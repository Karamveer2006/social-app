# TaskPlanet Social – Mini Social Post Application
> **3W Full Stack Internship Assignment — Task 1 (Production Ready)**  
> Inspired by the Social Page of the [TaskPlanet App on Google Play](https://play.google.com/store/apps/details?id=com.taskplanet).

[![Backend API](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)](file:///Users/karamveer/Desktop/social-media-app/backend)
[![Cloud Storage](https://img.shields.io/badge/Media%20Storage-Cloudinary%20CDN-orange.svg)](https://cloudinary.com)
[![Frontend Web](https://img.shields.io/badge/Frontend-React%20%7C%20Material%20UI-blue.svg)](file:///Users/karamveer/Desktop/social-media-app/frontend)
[![Mobile App](https://img.shields.io/badge/Mobile-React%20Native%20CLI-purple.svg)](file:///Users/karamveer/Desktop/social-media-app/mobile)
[![Database](https://img.shields.io/badge/Database-MongoDB%20(Strictly%202%20Collections)-brightgreen.svg)](file:///Users/karamveer/Desktop/social-media-app/backend/src/models)
[![Styling](https://img.shields.io/badge/Styling-Material--UI%20(No%20Tailwind)-red.svg)](file:///Users/karamveer/Desktop/social-media-app/frontend/src/theme.js)

---

## 📌 Project Overview
This repository contains a full-stack **Mini Social Post Application** built to replicate and enhance the community social experience of the **TaskPlanet App**. It allows registered users to share updates (text, images, or both), browse an infinite public feed, like posts with instant heart reactions, reply to comments, follow other creators, edit their bio & upload profile pictures, and seamlessly toggle between Light and Obsidian Dark modes.

The project is cleanly divided into three independent modules:
1. **`backend/`**: Node.js + Express + MongoDB (Strictly **2 collections**: `users` and `posts`), JWT Authentication, Cloudinary cloud media storage (with local fallback), Helmet security headers, compression, and rate limiting.
2. **`frontend/`**: React.js (Vite) styled with Material UI (MUI) and Vanilla CSS tokens (**strictly 0% TailwindCSS**) with Rollup chunk splitting.
3. **`mobile/`**: React Native CLI mobile application with bottom tab navigation, infinite feed, native image picker, threaded replies, and full dark/light theme awareness.

---

## 🎯 Features Checklist & Assignment Requirements

| Requirement | Description | Status |
|---|---|:---:|
| **Account Creation** | Signup & Login with email/username and password using JWT & bcrypt | ✅ Complete |
| **Two Collections Only** | Strictly **2 collections** in MongoDB: `users` and `posts` | ✅ Complete |
| **Flexible Posts** | Users can post **text only**, **image only**, or **both** | ✅ Complete |
| **Public Feed** | All posts from all users are visible on a central public feed | ✅ Complete |
| **Likes & Comments Count** | Shows real-time total likes and comments count on every post | ✅ Complete |
| **Usernames Saved** | Saves and displays usernames of everyone who liked or commented | ✅ Complete |
| **Liked By Dialog** | Modal dialog revealing all user profiles who liked the post | ✅ Complete |
| **Instant UI Updates** | Optimistic UI updates on Like and Comment actions for zero lag | ✅ Complete |
| **No TailwindCSS** | Custom styling with Material UI (MUI) & Vanilla CSS | ✅ Complete |
| **Cloudinary Media Storage** | Global CDN for post images and profile pictures with auto-optimization | 🏆 Bonus |
| **Production Hardening** | Helmet, rate limiting, gzip compression, graceful shutdown & health diagnostics | 🏆 Bonus |
| **Comment Replies** | Threaded replies (`replyTo`) with `@username` autofill on Web & Mobile | 🏆 Bonus |
| **Follow / Unfollow System** | 1-tap creator follow with instant count updates (embedded in `users`) | 🏆 Bonus |
| **Profile & Avatar Editing** | Native and web photo pickers to upload and update avatars | 🏆 Bonus |
| **Infinite Scrolling** | Modern scroll-to-load sentinel effect replacing manual buttons | 🏆 Bonus |
| **Obsidian Dark Mode** | Deep `#0A0E1A` dark palette with navbar toggle on Web & Mobile | 🏆 Bonus |
| **Dual Platform** | Includes both **React Web App** & **React Native CLI App** | 🏆 Bonus |

---

## 🏗 Database Schema (Strictly 2 Collections)

As mandated by Step 4 of the recruiter guidelines, only **two collections** exist in the database:

### 1. `users` Collection
- `_id`: ObjectId
- `name`: Full Name
- `username`: Unique username (lowercase, indexed)
- `email`: Unique email (lowercase, indexed)
- `password`: Hashed using bcrypt (salt rounds: 10)
- `avatar`: Avatar image URL (Cloudinary CDN or local path)
- `bio`: Short user description
- `followers`: Embedded Array `[ObjectId]`
- `following`: Embedded Array `[ObjectId]`
- `createdAt`, `updatedAt`: Timestamps

### 2. `posts` Collection
- `_id`: ObjectId
- `author`: Embedded subdocument `{ userId, username, name, avatar }`
- `content`: Post body text (optional if image is provided)
- `imageUrl`: Cloudinary CDN URL or image path (optional if text is provided)
- `likes`: Embedded Array `[{ userId, username, name, avatar, likedAt }]`
- `comments`: Embedded Array `[{ _id, userId, username, name, avatar, text, replyTo, replyToUsername, createdAt }]`
- `likesCount`: Denormalized counter for high-performance sorting
- `commentsCount`: Denormalized counter for high-performance queries
- `createdAt`: Timestamp (indexed with `{ createdAt: -1 }` for rapid paginated queries)

---

## ☁️ Cloudinary Setup

The application uses **Cloudinary** for scalable, persistent cloud image hosting (post images and profile avatars).

### How It Works:
- **Dual-Mode Architecture**: When Cloudinary credentials are set in `.env`, uploaded images are automatically pushed to Cloudinary with `quality: 'auto'` and `fetch_format: 'auto'`, returning secure CDN URLs (`https://res.cloudinary.com/...`). Local temporary files are automatically cleaned up to prevent disk bloat.
- **Seamless Local Fallback**: If Cloudinary credentials are omitted (e.g. running automated tests `npm test`, offline dev), the server gracefully falls back to local disk storage (`/uploads`) without error.

### Getting Cloudinary Keys:
1. Sign up for a free account at [cloudinary.com](https://cloudinary.com/).
2. On your Cloudinary Dashboard, find:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. Add them to `backend/.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

---

## 🛡 Production Security & Performance Hardening

1. **Helmet HTTP Headers**: Configured with `crossOriginResourcePolicy: { policy: 'cross-origin' }` to protect against clickjacking, MIME-sniffing, and XSS while allowing cross-origin image loads.
2. **Rate Limiting**:
   - **Auth Endpoints** (`/api/auth/*`): 30 requests per 15 minutes to block brute-force attacks.
   - **API Endpoints** (`/api/*`): 300 requests per 15 minutes to prevent DDoS.
3. **HTTP Compression**: Gzip/Deflate compression enabled via `compression` middleware.
4. **Graceful Shutdown**: Listens for `SIGTERM` and `SIGINT`, closes HTTP listeners, terminates open database connections, and exits cleanly.
5. **System Health Diagnostics**: `GET /api/health` returns real-time uptime, database state, memory usage (RSS / heap), environment, and media storage provider.
6. **Optimized Rollup Chunking**: Web frontend chunks are split into `vendor-react`, `vendor-mui`, `vendor-icons`, and `vendor-utils` for sub-200ms loads.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- npm (v9.0.0 or higher)

---

### 1. Backend Setup (`backend/`)
```bash
cd backend

# Install dependencies
npm install

# Run automated integration tests (12/12 passing, verifies 2-collection rule)
npm test

# Start server in watch mode
npm run dev
```
- API will run at: `http://localhost:5001`
- Health check: `http://localhost:5001/api/health`

> **Note:** For local development, if `MONGO_URI` is left blank in `backend/.env`, an embedded in-memory MongoDB server starts automatically. For production deployments, connect your production MongoDB Atlas cluster via `MONGO_URI`. If sample data is ever desired for testing, run `npm run seed` manually.

---

### 2. React Web App Setup (`frontend/`)
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Or build production bundle
npm run build
```
- Web Application: `http://localhost:5173`

---

### 3. React Native CLI Setup (`mobile/`)
```bash
cd mobile

# Install dependencies
npm install

# Start Metro bundler
npx react-native start

# Run on Android or iOS
npx react-native run-android
# or
npx react-native run-ios
```

---

## 🔐 User Registration & Authentication

The deployed application runs clean with no hardcoded accounts or static demo data. Users register directly on either Web or Mobile:
1. Navigate to **Sign Up** (`/signup` on Web or tap **Sign Up** on Mobile).
2. Enter **Full Name**, **Username**, **Email**, and **Password** (min. 6 characters).
3. Once registered, log in to create your first post, follow other users, customize your bio, and upload your profile picture.

*(Optional for local testing only: developers can run `npm run seed` inside `backend/` to populate sample accounts).*

---

## 📡 REST API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/signup` – Register new user
- `POST /api/auth/login` – Login user & receive JWT token
- `GET /api/auth/me` – Fetch current session profile

### Posts (`/api/posts`)
- `GET /api/posts?page=1&limit=10` – Paginated public feed
- `POST /api/posts` – Create post (Multipart `image` or JSON `{ content, imageUrl }`)
- `PUT /api/posts/:id/like` – Toggle like / unlike
- `GET /api/posts/:id/likes` – List users who liked post
- `POST /api/posts/:id/comment` – Add comment or reply (`{ text, replyTo }`)
- `DELETE /api/posts/:id` – Delete post (author only)

### Users (`/api/users`)
- `GET /api/users/:username` – Get user profile, follower counts, and posts
- `PUT /api/users/profile` – Update profile & upload avatar (Multipart `avatar` or JSON)
- `PUT /api/users/:id/follow` – Toggle follow / unfollow creator

### Diagnostics (`/api/health`)
- `GET /api/health` – System status, database connection, memory, Cloudinary provider

---

## ☁️ Production Deployment Guide

### 1. Database (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and whitelist all IPs (`0.0.0.0/0`).
3. Copy connection string as `MONGO_URI`.

### 2. Backend (Render)
1. Push repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New > Blueprint** and select this repo (uses `backend/render.yaml`), or create a **Web Service**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
3. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5001`
   - `MONGO_URI`: your MongoDB Atlas URI
   - `JWT_SECRET`: your random 32+ character string
   - `CLOUDINARY_CLOUD_NAME`: your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: your Cloudinary API secret
   - `CLIENT_URL`: `https://your-frontend.vercel.app`

### 3. Frontend (Vercel)
1. In [Vercel](https://vercel.com), click **Add New > Project** and import the repository:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
2. Add Environment Variable:
   - `VITE_API_URL`: `https://your-render-backend-url.onrender.com/api`
3. Deploy! Static asset caching and security headers are automatically configured via `frontend/vercel.json`.

---


