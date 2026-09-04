import { Post } from '../models/Post.js';

// @desc    Get all posts for public feed (with pagination)
// @route   GET /api/posts
// @access  Public
export const getFeed = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const currentUserId = req.user ? req.user._id.toString() : null;

    // Enhance posts with isLikedByMe flag for convenience
    const formattedPosts = posts.map((post) => {
      const isLikedByMe = currentUserId
        ? post.likes.some((like) => like.userId.toString() === currentUserId)
        : false;

      return {
        ...post,
        isLikedByMe,
        likesCount: post.likes ? post.likes.length : 0,
        commentsCount: post.comments ? post.comments.length : 0,
      };
    });

    res.status(200).json({
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
    console.error('Error in getFeed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching feed',
    });
  }
};

// @desc    Get a single post by ID
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const currentUserId = req.user ? req.user._id.toString() : null;
    const isLikedByMe = currentUserId
      ? post.likes.some((like) => like.userId.toString() === currentUserId)
      : false;

    res.status(200).json({
      success: true,
      data: {
        post: {
          ...post,
          isLikedByMe,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching post',
    });
  }
};

// @desc    Create a new post (text, image, or both)
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let imageUrl = req.body.imageUrl || '';

    // If file was uploaded via multer, set the image URL
    if (req.file) {
      // Create server-relative URL
      const host = req.get('host');
      const protocol = req.protocol;
      imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    // Validation: at least content or imageUrl must exist
    const hasContent = content && content.trim().length > 0;
    const hasImage = imageUrl && imageUrl.trim().length > 0;

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

    res.status(201).json({
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
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating post',
    });
  }
};

// @desc    Toggle like on a post (Like / Unlike)
// @route   PUT /api/posts/:id/like
// @access  Private
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
      // User already liked -> unlike
      post.likes.splice(existingLikeIndex, 1);
      isLikedByMe = false;
    } else {
      // Add like with user details
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

    res.status(200).json({
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
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error toggling like',
    });
  }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comment
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;

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
      replyTo: req.body.replyTo ? req.body.replyTo.trim() : '',
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    post.commentsCount = post.comments.length;
    await post.save();

    const addedComment = post.comments[post.comments.length - 1];

    res.status(201).json({
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
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding comment',
    });
  }
};

// @desc    Get list of all users who liked a post
// @route   GET /api/posts/:id/likes
// @access  Public
export const getPostLikes = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select('likes likesCount');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        postId: post._id,
        likesCount: post.likesCount,
        likes: post.likes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching likes',
    });
  }
};

// @desc    Delete post (author only)
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check ownership
    if (post.author.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this post',
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      data: { postId: req.params.id },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting post',
    });
  }
};
