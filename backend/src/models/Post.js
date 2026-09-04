import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    likedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      required: [true, 'Comment text cannot be empty'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    replyTo: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
      username: {
        type: String,
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
      },
      avatar: {
        type: String,
        default: '',
      },
    },
    content: {
      type: String,
      trim: true,
      maxlength: [2000, 'Post content cannot exceed 2000 characters'],
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    likes: [likeSchema],
    comments: [commentSchema],
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Validation: At least one of content or imageUrl must be provided!
postSchema.pre('validate', function (next) {
  const hasContent = this.content && this.content.trim().length > 0;
  const hasImage = this.imageUrl && this.imageUrl.trim().length > 0;

  if (!hasContent && !hasImage) {
    this.invalidate('content', 'A post must contain either text, an image, or both.');
  } else {
    next();
  }
});

// Synchronize likesCount and commentsCount before saving
postSchema.pre('save', function (next) {
  this.likesCount = this.likes.length;
  this.commentsCount = this.comments.length;
  next();
});

// Index for performant paginated feed
postSchema.index({ createdAt: -1 });

export const Post = mongoose.model('Post', postSchema);
