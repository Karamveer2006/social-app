import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('taskplanet_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired
      const token = localStorage.getItem('taskplanet_token');
      if (token) {
        localStorage.removeItem('taskplanet_token');
        localStorage.removeItem('taskplanet_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: async (userData) => {
    const res = await api.post('/auth/signup', userData);
    return res.data;
  },
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const postsAPI = {
  getFeed: async (page = 1, limit = 10) => {
    const res = await api.get(`/posts?page=${page}&limit=${limit}`);
    return res.data;
  },
  getPost: async (id) => {
    const res = await api.get(`/posts/${id}`);
    return res.data;
  },
  createPost: async (postData) => {
    // If postData is FormData (for file uploads), let browser set Content-Type
    const config =
      postData instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};
    const res = await api.post('/posts', postData, config);
    return res.data;
  },
  toggleLike: async (postId) => {
    const res = await api.put(`/posts/${postId}/like`);
    return res.data;
  },
  addComment: async (postId, text) => {
    const res = await api.post(`/posts/${postId}/comment`, { text });
    return res.data;
  },
  getLikes: async (postId) => {
    const res = await api.get(`/posts/${postId}/likes`);
    return res.data;
  },
  deletePost: async (postId) => {
    const res = await api.delete(`/posts/${postId}`);
    return res.data;
  },
};

export default api;
