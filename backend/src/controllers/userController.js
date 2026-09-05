import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { uploadMedia } from '../config/cloudinary.js';
import logger from '../utils/logger.js';

const supportsTransactions = () => {
  const type = mongoose.connection.client?.topology?.description?.type;
  return type === 'ReplicaSetWithPrimary' || type === 'Sharded';
};

// Retrieve user profile by username or ID, including paginated posts and follow state
export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(username);
    const query = isObjectId
      ? { $or: [{ _id: username }, { username: username.toLowerCase().trim() }] }
      : { username: username.toLowerCase().trim() };

    const user = await User.findOne(query)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `@${username} not found`,
      });
    }

    const currentUserId = req.user ? req.user._id.toString() : null;
    const isFollowing = currentUserId && user.followers
      ? user.followers.some((id) => id.toString() === currentUserId)
      : false;

    // Paginated posts query to avoid unbounded memory usage
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [posts, totalPosts] = await Promise.all([
      Post.find({ 'author.userId': user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({ 'author.userId': user._id }),
    ]);

    const formattedPosts = posts.map((post) => ({
      ...post,
      isLikedByMe: currentUserId
        ? post.likes.some((like) => like.userId.toString() === currentUserId)
        : false,
      likesCount: post.likes ? post.likes.length : 0,
      commentsCount: post.comments ? post.comments.length : 0,
    }));

    return res.status(200).json({
      success: true,
      data: {
        user: {
          ...user,
          followersCount: user.followers ? user.followers.length : 0,
          followingCount: user.following ? user.following.length : 0,
          isFollowing,
        },
        posts: formattedPosts,
        pagination: {
          page,
          limit,
          totalPosts,
          totalPages: Math.ceil(totalPosts / limit),
          hasMore: page * limit < totalPosts,
        },
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching user profile');
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user profile',
    });
  }
};

// Update profile information (name, bio, avatar)
export const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    let avatar = req.body.avatar;

    if (req.file) {
      const uploadResult = await uploadMedia(req.file, 'taskplanet/avatars', req);
      avatar = uploadResult.url;
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar) user.avatar = avatar.trim();

    await user.save();

    // Synchronize author metadata across existing posts in background
    if (name || avatar) {
      Post.updateMany(
        { 'author.userId': user._id },
        {
          $set: {
            'author.name': user.name,
            'author.avatar': user.avatar,
          },
        }
      ).catch((err) => {
        logger.warn({ err }, 'Background author sync non-fatal error');
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          followersCount: user.followers ? user.followers.length : 0,
          followingCount: user.following ? user.following.length : 0,
        },
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error updating profile');
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile',
    });
  }
};

// Toggle follow / unfollow on a user with transaction support where available
export const toggleFollow = async (req, res) => {
  try {
    const targetParam = req.params.id;
    const currentUserId = req.user._id;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetParam);
    const query = isObjectId
      ? { $or: [{ _id: targetParam }, { username: targetParam.toLowerCase().trim() }] }
      : { username: targetParam.toLowerCase().trim() };

    const targetUser = await User.findOne(query);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (targetUser._id.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    targetUser.followers = targetUser.followers || [];
    currentUser.following = currentUser.following || [];

    const isFollowing = targetUser.followers.some(
      (id) => id.toString() === currentUserId.toString()
    );

    const useTransaction = supportsTransactions();
    let session = null;

    if (useTransaction) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    try {
      if (isFollowing) {
        targetUser.followers = targetUser.followers.filter(
          (id) => id.toString() !== currentUserId.toString()
        );
        currentUser.following = currentUser.following.filter(
          (id) => id.toString() !== targetUser._id.toString()
        );
      } else {
        targetUser.followers.push(currentUserId);
        currentUser.following.push(targetUser._id);
      }

      targetUser.followersCount = targetUser.followers.length;
      currentUser.followingCount = currentUser.following.length;

      const saveOptions = session ? { session } : {};
      await targetUser.save(saveOptions);
      await currentUser.save(saveOptions);

      if (session) {
        await session.commitTransaction();
      }
    } catch (txErr) {
      if (session) {
        await session.abortTransaction();
      }
      throw txErr;
    } finally {
      if (session) {
        await session.endSession();
      }
    }

    return res.status(200).json({
      success: true,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      data: {
        targetUserId: targetUser._id,
        targetUsername: targetUser.username,
        isFollowing: !isFollowing,
        followersCount: targetUser.followersCount,
        followingCount: currentUser.followingCount,
        following: currentUser.following,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error toggling follow');
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating follow status',
    });
  }
};
