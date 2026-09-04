# TaskPlanet Social – Mini Social Post Application
> **3W Full Stack Internship Assignment — Task 1**  
> Inspired by the Social Page of the [TaskPlanet App on Google Play](https://play.google.com/store/apps/details?id=com.taskplanet).

[![Backend API](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)](file:///Users/karamveer/Desktop/social-media-app/backend)
[![Frontend Web](https://img.shields.io/badge/Frontend-React%20%7C%20Material%20UI-blue.svg)](file:///Users/karamveer/Desktop/social-media-app/frontend)
[![Mobile App](https://img.shields.io/badge/Mobile-React%20Native%20CLI-purple.svg)](file:///Users/karamveer/Desktop/social-media-app/mobile)
[![Database](https://img.shields.io/badge/Database-MongoDB%20(2%20Collections)-brightgreen.svg)](file:///Users/karamveer/Desktop/social-media-app/backend/src/models)
[![Styling](https://img.shields.io/badge/Styling-Material--UI%20(No%20Tailwind)-orange.svg)](file:///Users/karamveer/Desktop/social-media-app/frontend/src/theme.js)

---

## 📌 Project Overview
This repository contains a full-stack **Mini Social Post Application** built to replicate and enhance the community social experience of the **TaskPlanet App**. It allows registered users to share updates (text, images, or both), browse a public feed, like posts with instant heart reactions, and participate in discussion threads.

The project is structured into three dedicated folders:
1. **`backend/`**: Node.js, Express, MongoDB (Mongoose), JWT Authentication, and Multer file uploads.
2. **`frontend/`**: React.js web application styled with Material UI (MUI) and Vanilla CSS (**strictly 0% TailwindCSS**).
3. **`mobile/`**: React Native CLI mobile application supporting bottom tab navigation, infinite feed, image picker, and responsive modals.

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
| **Efficient Pagination** | Page-based pagination with "Load More" & Infinite Scroll support | 🏆 Bonus |
| **Dual Platform** | Includes both **React Web App** & **React Native CLI App** | 🏆 Bonus |

---

## 🏗 Database Schema (Strictly 2 Collections)

As mandated by Step 4 of the guidelines, only two collections exist in the database:

### 1. `users` Collection
- `_id`: ObjectId
- `name`: Full Name
- `username`: Unique username (lowercase, indexed)
- `email`: Unique email (lowercase, indexed)
- `password`: Hashed using bcrypt (salt rounds: 10)
- `avatar`: Avatar image URL
- `bio`: Short user description
- `createdAt`, `updatedAt`: Timestamps

### 2. `posts` Collection
- `_id`: ObjectId
- `author`: Embedded subdocument `{ userId, username, name, avatar }`
- `content`: Post body text (optional if image is provided)
- `imageUrl`: Image URL or uploaded path (optional if text is provided)
- `likes`: Embedded Array `[{ userId, username, name, avatar, likedAt }]`
- `comments`: Embedded Array `[{ _id, userId, username, name, avatar, text, createdAt }]`
- `likesCount`: Denormalized counter for high-performance sorting
- `commentsCount`: Denormalized counter for high-performance queries
- `createdAt`: Timestamp (indexed with `{ createdAt: -1 }` for rapid paginated queries)

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

# Run automated tests (Verifies all 8 test cases & 2-collection constraint)
npm test

# Start the server (Uses in-memory MongoDB automatically if no Atlas URI is provided)
npm start
```
- API will run at: `http://localhost:5001`
- Health check: `http://localhost:5001/api/health`

> **Note:** If you have a MongoDB Atlas connection string, you can set it in `backend/.env`:
> ```env
> PORT=5001
> MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/social-app?retryWrites=true&w=majority
> JWT_SECRET=your_secret_key_here
> ```
> If `MONGO_URI` is left blank, the app will automatically start an embedded in-memory MongoDB server with pre-seeded sample data!

---

### 2. React Web App Setup (`frontend/`)
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
- Web Application will be live at: `http://localhost:5173`

---

### 3. React Native CLI Setup (`mobile/`)
```bash
cd mobile

# Install dependencies
npm install

# Run Metro bundler
npm start

# In another terminal, run on Android or iOS
npm run android
# or
npm run ios
```

---

## 🔑 Pre-Configured Demo Accounts for Testing
You can use any of these pre-seeded accounts to log in with one click:

| Name | Username | Email | Password |
|---|---|---|---|
| **Aarav Sharma** | `aarav_s` | `aarav@example.com` | `Password123!` |
| **Priya Patel** | `priya_p` | `priya@example.com` | `Password123!` |
| **Rohan Verma** | `rohan_v` | `rohan@example.com` | `Password123!` |
| **Ananya Gupta** | `ananya_g` | `ananya@example.com` | `Password123!` |

*(Or click **Sign Up** to create a fresh user account instantly!)*

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/signup`
  - Body: `{ name, username, email, password, bio? }`
  - Response: `{ success: true, data: { user, token } }`
- `POST /api/auth/login`
  - Body: `{ loginIdentifier, password }`
  - Response: `{ success: true, data: { user, token } }`
- `GET /api/auth/me` *(Auth Required)*
  - Header: `Authorization: Bearer <token>`
  - Response: `{ success: true, data: { user } }`

### Posts (`/api/posts`)
- `GET /api/posts?page=1&limit=10`
  - Returns paginated public feed with `likesCount`, `commentsCount`, `isLikedByMe`, and pagination metadata.
- `POST /api/posts` *(Auth Required)*
  - Supports multipart file upload (`image`) or JSON `{ content, imageUrl }`.
  - Validates that either text or image is present.
- `PUT /api/posts/:id/like` *(Auth Required)*
  - Toggles like status (like / unlike).
  - Returns updated `likesCount`, `isLikedByMe`, and the full `likes` list.
- `POST /api/posts/:id/comment` *(Auth Required)*
  - Body: `{ text }`
  - Appends comment to post document and increments `commentsCount`.
- `GET /api/posts/:id/likes`
  - Returns list of usernames, names, and avatars of users who liked the post.
- `DELETE /api/posts/:id` *(Auth Required - Author Only)*
  - Deletes post.

---

## ☁️ Deployment Instructions

### 1. Database (MongoDB Atlas)
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and allow network access from `0.0.0.0/0`.
3. Copy your connection string into the backend environment variables as `MONGO_URI`.

### 2. Backend (Render)
1. Push this repository to GitHub.
2. Log into [Render](https://render.com) and choose **New Web Service**.
3. Point to this repository:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. In Environment Variables, set:
   - `NODE_ENV`: `production`
   - `PORT`: `5001`
   - `MONGO_URI`: `mongodb+srv://...`
   - `JWT_SECRET`: `your_secure_random_key`

*(Alternatively, connect using the included `backend/render.yaml` blueprint).*

### 3. Frontend (Vercel)
1. Log into [Vercel](https://vercel.com) and click **Add New Project**.
2. Select your repository:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: `https://your-render-backend-url.onrender.com/api`
4. Deploy!

---

## 📋 Submission Details
- **Assignment**: 3W Full Stack Internship Assignment — Task 1 (Mini Social Post Application)
- **Reference**: [TaskPlanet App on Play Store](https://play.google.com/store/apps/details?id=com.taskplanet)
- **Submission Form**: [Round 1 Task Submission Form](https://forms.gle/eriRaMuN8Tu6t4Rs7)
- **Deadline**: 6 September 2026
