import { Post } from '../models/Post.js';
import { uploadMedia } from '../config/cloudinary.js';
import logger from '../utils/logger.js';

// Retrieve paginated public feed
export const getFeed = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [totalPosts, posts] = await Promise.all([
      Post.countDocuments(),
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const currentUser = req.user;
    const currentUserId = currentUser ? currentUser._id.toString() : null;
    const followingIds = currentUser?.following
      ? currentUser.following.map((id) => id.toString())
      : [];

    const formattedPosts = posts.map((post) => {
      const isLikedByMe = currentUserId
        ? post.likes.some((like) => like.userId.toString() === currentUserId)
        : false;

      const isFollowingAuthor =
        currentUserId && post.author?.userId
          ? followingIds.includes(post.author.userId.toString())
          : false;

      return {
        ...post,
        isLikedByMe,
        isFollowingAuthor,
        likesCount: post.likes ? post.likes.length : 0,
        commentsCount: post.comments ? post.comments.length : 0,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
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
    logger.error({ err: error }, 'Error fetching public feed');
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching feed',
    });
  }
};

// Retrieve a single post by ID
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const currentUser = req.user;
    const currentUserId = currentUser ? currentUser._id.toString() : null;
    const isLikedByMe = currentUserId
      ? post.likes.some((like) => like.userId.toString() === currentUserId)
      : false;
    const isFollowingAuthor =
      currentUserId && post.author?.userId && currentUser?.following
        ? currentUser.following.some((id) => id.toString() === post.author.userId.toString())
        : false;

    return res.status(200).json({
      success: true,
      data: {
        post: {
          ...post,
          isLikedByMe,
          isFollowingAuthor,
        },
      },
    });
  } catch (error) {
    logger.error({ err: error, id: req.params.id }, 'Error fetching post');
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching post',
    });
  }
};

// Create a new post (text, image, or both)
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let imageUrl = req.body.imageUrl || '';

    if (req.file) {
      const uploadResult = await uploadMedia(req.file, 'taskplanet/posts', req);
      imageUrl = uploadResult.url;
    }

    const hasContent = Boolean(content && content.trim().length > 0);
    const hasImage = Boolean(imageUrl && imageUrl.trim().length > 0);

    if (!hasContent && !hasImage) {
      return res.status(400).json({
        success: false,
        message: 'Post must include either text content, an image, or both.',
      });
    }

    const newPost = await Post.create({
      author: {
        userId: req.user._id,
        username: req.user.username,
        name: req.user.name,
        avatar: req.user.avatar,
      },
      content: hasContent ? content.trim() : '',
      imageUrl: hasImage ? imageUrl.trim() : '',
      likes: [],
      comments: [],
      likesCount: 0,
      commentsCount: 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post: {
          ...newPost.toObject(),
          isLikedByMe: false,
        },
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error creating post');
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating post',
    });
  }
};

// Toggle like / unlike on a post
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const currentUserId = req.user._id.toString();
    const existingLikeIndex = post.likes.findIndex(
      (like) => like.userId.toString() === currentUserId
    );

    let isLikedByMe = false;

    if (existingLikeIndex > -1) {
      post.likes.splice(existingLikeIndex, 1);
      isLikedByMe = false;
    } else {
      post.likes.push({
        userId: req.user._id,
        username: req.user.username,
        name: req.user.name,
        avatar: req.user.avatar,
        likedAt: new Date(),
      });
      isLikedByMe = true;
    }

    post.likesCount = post.likes.length;
    await post.save();

    return res.status(200).json({
      success: true,
      message: isLikedByMe ? 'Post liked' : 'Post unliked',
      data: {
        postId: post._id,
        isLikedByMe,
        likesCount: post.likesCount,
        likes: post.likes,
      },
    });
  } catch (error) {
    logger.error({ err: error, id: req.params.id }, 'Error toggling like');
    return res.status(500).json({
      success: false,
      message: error.message || 'Error toggling like',
    });
  }
};

// Add a comment to a post
export const addComment = async (req, res) => {
  try {
    const { text, replyTo } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty',
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const newComment = {
      userId: req.user._id,
      username: req.user.username,
      name: req.user.name,
      avatar: req.user.avatar,
      text: text.trim(),
      replyTo: replyTo ? replyTo.trim() : '',
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    post.commentsCount = post.comments.length;
    await post.save();

    const addedComment = post.comments[post.comments.length - 1];

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        postId: post._id,
        comment: addedComment,
        commentsCount: post.commentsCount,
        comments: post.comments,
      },
    });
  } catch (error) {
    logger.error({ err: error, id: req.params.id }, 'Error adding comment');
    return res.status(500).json({
      success: false,
      message: error.message || 'Error adding comment',
    });
  }
};

// Retrieve list of users who liked a post
export const getPostLikes = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select('likes likesCount');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        postId: post._id,
        likesCount: post.likesCount,
        likes: post.likes,
      },
    });
  } catch (error) {
    logger.error({ err: error, id: req.params.id }, 'Error fetching likes');
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching likes',
    });
  }
};

// Delete a post (author only)
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.author.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this post',
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      data: { postId: req.params.id },
    });
  } catch (error) {
    logger.error({ err: error, id: req.params.id }, 'Error deleting post');
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting post',
    });
  }
};
