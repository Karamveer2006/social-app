import { User } from '../models/User.js';
import { Post } from '../models/Post.js';

// @desc    Get user profile by username including their posts & follow status
// @route   GET /api/users/:username
// @access  Public / Optional Auth
export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase().trim() })
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User @${username} not found`,
      });
    }

    const currentUserId = req.user ? req.user._id.toString() : null;
    const isFollowing = currentUserId && user.followers
      ? user.followers.some((id) => id.toString() === currentUserId)
      : false;

    // Fetch all posts by this author
    const posts = await Post.find({ 'author.userId': user._id })
      .sort({ createdAt: -1 })
      .lean();

    const formattedPosts = posts.map((post) => ({
      ...post,
      isLikedByMe: currentUserId
        ? post.likes.some((like) => like.userId.toString() === currentUserId)
        : false,
      likesCount: post.likes ? post.likes.length : 0,
      commentsCount: post.comments ? post.comments.length : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user,
          followersCount: user.followers ? user.followers.length : 0,
          followingCount: user.following ? user.following.length : 0,
          isFollowing,
        },
        posts: formattedPosts,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user profile',
    });
  }
};

// @desc    Update user profile (name, bio, avatar)
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
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

    // Also update author info on existing posts in background for consistency
    if (name || avatar) {
      await Post.updateMany(
        { 'author.userId': user._id },
        {
          $set: {
            'author.name': user.name,
            'author.avatar': user.avatar,
          },
        }
      );
    }

    res.status(200).json({
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
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile',
    });
  }
};

// @desc    Toggle follow / unfollow a user
// @route   PUT /api/users/:id/follow
// @access  Private
export const toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    targetUser.followers = targetUser.followers || [];
    currentUser.following = currentUser.following || [];

    const isFollowing = targetUser.followers.some(
      (id) => id.toString() === currentUserId.toString()
    );

    if (isFollowing) {
      // Unfollow
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId.toString()
      );
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId.toString()
      );
    } else {
      // Follow
      targetUser.followers.push(currentUserId);
      currentUser.following.push(targetUserId);
    }

    targetUser.followersCount = targetUser.followers.length;
    currentUser.followingCount = currentUser.following.length;

    await targetUser.save();
    await currentUser.save();

    res.status(200).json({
      success: true,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      data: {
        targetUserId: targetUser._id,
        isFollowing: !isFollowing,
        followersCount: targetUser.followersCount,
      },
    });
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating follow status',
    });
  }
};
