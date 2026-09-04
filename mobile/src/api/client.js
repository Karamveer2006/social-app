import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In Android emulator, 10.0.2.2 maps to computer localhost; iOS simulator uses localhost
const DEFAULT_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5001/api'
    : 'http://localhost:5001/api';

export const API_BASE_URL = DEFAULT_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('taskplanet_mobile_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Error reading token from storage:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
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
  createPost: async (postData) => {
    const isFormData = postData instanceof FormData;
    const config = isFormData
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
