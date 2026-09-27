import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Live Render backend URL (no trailing slash, no leading space)
export const BASE_URL = 'https://artisan-backend-e78e.onrender.com';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token automatically
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to attach bearer token', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Global error handler
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Optional: Clear stale token if unauthorized
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

/**
 * Normalizes product image URLs/paths so images display reliably on physical devices
 * whether stored as localhost:5000, 127.0.0.1, 10.x.x.x, 192.168.x.x, relative paths, or raw filenames.
 */
export const resolveImageUrl = (url?: string): string => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return 'https://via.placeholder.com/300?text=No+Image';
  }

  const trimmed = url.trim();

  // 1. Matches localhost, 127.0.0.1, 10.x.x.x, 192.168.x.x, or 172.16-31.x.x with or without ports
  const localIpRegex = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?/i;

  if (localIpRegex.test(trimmed)) {
    return trimmed.replace(localIpRegex, BASE_URL);
  }

  // 2. If it's already a valid external HTTPS link (Cloudinary, S3, Unsplash, etc.)
  if (trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 3. Handle relative path starting with slash (e.g. /uploads/filename.jpg)
  if (trimmed.startsWith('/')) {
    return `${BASE_URL}${trimmed}`;
  }

  // 4. Handle relative path starting with "uploads/" (e.g. uploads/filename.jpg)
  if (trimmed.startsWith('uploads/')) {
    return `${BASE_URL}/${trimmed}`;
  }

  // 5. Bare filename fallback (e.g. 1788604783440-Blue-pottery-1.jpg)
  return `${BASE_URL}/uploads/${trimmed}`;
};

export default api;