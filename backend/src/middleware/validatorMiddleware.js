import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

export const validateSignup = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Please provide your full name')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Please provide a username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain alphanumeric characters and underscores'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Please provide an email address')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Please provide a password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors,
];

export const validateLogin = [
  body().custom((value) => {
    const identifier = value.loginIdentifier || value.email || value.username;
    if (!identifier || !identifier.toString().trim()) {
      throw new Error('Please provide email/username and password');
    }
    return true;
  }),
  body('password')
    .notEmpty()
    .withMessage('Please provide email/username and password'),
  handleValidationErrors,
];

export const validateCreatePost = [
  body().custom((value, { req }) => {
    const hasText = Boolean(value.content && value.content.toString().trim().length > 0);
    const hasImage = Boolean((value.imageUrl && value.imageUrl.toString().trim().length > 0) || req.file);
    if (!hasText && !hasImage) {
      throw new Error('Post must include either text content, an image, or both.');
    }
    return true;
  }),
  body('content')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Post content cannot exceed 2000 characters'),
  handleValidationErrors,
];

export const validateComment = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text cannot be empty')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  handleValidationErrors,
];

export const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  handleValidationErrors,
];
