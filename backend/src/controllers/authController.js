import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';

export const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  following: user.following || [],
  followers: user.followers || [],
  followersCount: user.followers ? user.followers.length : 0,
  followingCount: user.following ? user.following.length : 0,
  createdAt: user.createdAt,
});

// Register a new user
export const signup = async (req, res) => {
  try {
    const { name, username, email, password, avatar, bio } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, username, email, password)',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    const [emailExists, usernameExists] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      User.findOne({ username: normalizedUsername }),
    ]);

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken. Please choose another one',
      });
    }

    const user = await User.create({
      name: name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedUsername}`,
      bio: bio ? bio.trim() : '',
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: formatUserResponse(user),
        token,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Signup error');
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during signup',
    });
  }
};

// Authenticate user credentials & issue JWT
export const login = async (req, res) => {
  try {
    const { loginIdentifier, email, username, password } = req.body;
    const identifier = (loginIdentifier || email || username || '').toLowerCase().trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password',
      });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email/username and password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email/username and password',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: formatUserResponse(user),
        token,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Login error');
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// Get profile of authenticated user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching authenticated user');
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user profile',
    });
  }
};
