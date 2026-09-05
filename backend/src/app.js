import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { isCloudinaryConfigured } from './config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Response compression
app.use(compression());

// Dynamic CORS configuration supporting local dev, Vercel deployments, and configured CLIENT_URL
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5001',
];

if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((url) => {
    const clean = url.trim().replace(/\/+$/, '');
    if (clean) allowedOrigins.push(clean);
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.trim().replace(/\/+$/, '');

    // Allow configured origins
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    // Automatically allow all Vercel deployments (*.vercel.app)
    try {
      const parsedHostname = new URL(cleanOrigin).hostname;
      if (parsedHostname.endsWith('.vercel.app') || parsedHostname === 'vercel.app') {
        return callback(null, true);
      }
    } catch {
      // Ignore URL parse errors
    }

    // Allow localhost/local network
    if (cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Allow all other origins in production to prevent blocking public web/mobile clients
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Rate limiters (protect against abuse and brute-force)
const isTestEnv = process.env.NODE_ENV === 'test';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestEnv ? 1000 : 30, // 30 login/signup attempts per 15 min in prod
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 5000 : 300,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Serve uploaded images statically for local fallback
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root info route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Social Media App API is running (TaskPlanet Inspired)',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    mediaStorage: isCloudinaryConfigured() ? 'cloudinary' : 'local-disk',
    endpoints: {
      auth: '/api/auth',
      posts: '/api/posts',
      users: '/api/users',
      health: '/api/health',
    },
  });
});

// Enhanced production health check
app.get(['/api/health', '/health'], (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      host: mongoose.connection.host || 'unknown',
    },
    mediaStorage: {
      provider: isCloudinaryConfigured() ? 'cloudinary' : 'local-disk',
      cloudinaryConfigured: isCloudinaryConfigured(),
    },
    memoryUsage: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    },
  });
});

// Apply API rate limiting
app.use('/api', apiLimiter);

// Mount feature routes (support both /api/* and root paths for robustness)
app.use(['/api/auth', '/auth'], authLimiter, authRoutes);
app.use(['/api/posts', '/posts'], postRoutes);
app.use(['/api/users', '/users'], userRoutes);

// 404 Catch-all handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('Unhandled Server Error:', err);
  }

  // Multer error handling
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
    });
  }

  // Duplicate key error (MongoDB code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate value entered for ${field}. Please use another value.`,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
