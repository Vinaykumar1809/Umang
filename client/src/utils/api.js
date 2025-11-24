import axios from 'axios';

// Use production backend URL from env or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ALLOWS sending cookies for auth
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add the token each time
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Get latest token on every request
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Add a response interceptor for error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error.response || error.message);
    return Promise.reject(error);
  }
);

export default api;
