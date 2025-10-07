import api from './api';

export const authService = {
  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/api/v1/auth/register', userData);
      // Backend returns { user: { name: {...} }, token } directly in response.data
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/api/v1/auth/login', credentials);
      // Backend returns { user: { name: {...} }, token } directly in response.data
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Logout user
  logout: () => {
    // Clear all authentication related data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Clear any other auth-related data if exists
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresAt');
    
    // Optionally clear all localStorage (uncomment if needed)
    // localStorage.clear();
  },

  // Get current user from token
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Store auth data
  storeAuthData: (token, user) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
};
