import express from 'express';
import {
  getUserProfile,
  updateProfile,
  toggleFollow,
} from '../controllers/userController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get user profile and their published posts
router.get('/:username', optionalProtect, getUserProfile);

// Update own profile (name, bio, avatar)
router.put('/profile', protect, updateProfile);

// Toggle follow / unfollow
router.put('/:id/follow', protect, toggleFollow);

export default router;
