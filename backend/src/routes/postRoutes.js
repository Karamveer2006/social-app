import express from 'express';
import {
  getFeed,
  getPostById,
  createPost,
  toggleLike,
  addComment,
  getPostLikes,
  deletePost,
} from '../controllers/postController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public / optionally authenticated feed
router.get('/', optionalProtect, getFeed);

// Create a post (accepts text, optional single image upload, or both)
router.post('/', protect, upload.single('image'), createPost);

// Specific post details
router.get('/:id', optionalProtect, getPostById);

// Get list of usernames who liked this post
router.get('/:id/likes', getPostLikes);

// Toggle like / unlike on post
router.put('/:id/like', protect, toggleLike);

// Add comment to post
router.post('/:id/comment', protect, addComment);

// Delete post (author only)
router.delete('/:id', protect, deletePost);

export default router;
