// client/src/utils/axiosInterceptor.js
import axios from 'axios';
import store from '../store';
import { logout } from '../store/authSlice';

// Global config: Connect straight to backend
axios.defaults.baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000');

// Create a configured axios instance (or use global axios)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returns a 401 Unauthorized, automatically log out
    if (error.response && error.response.status === 401) {
      store.dispatch(logout());
      // Optional: window.location.href = '/login'; depending on your router
    }
    return Promise.reject(error);
  }
);

export default axios;
