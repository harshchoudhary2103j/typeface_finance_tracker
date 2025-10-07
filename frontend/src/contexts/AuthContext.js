import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check if user is already authenticated on app load
    const token = localStorage.getItem('authToken');
    const user = authService.getCurrentUser();
    
    if (token && user) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user },
      });
    }
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.login(credentials);
      // Backend returns { user: { name: {...} }, token }
      const { token, user } = response;
      
      authService.storeAuthData(token, user);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user },
      });
      
      return response;
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message || 'Login failed',
      });
      throw error;
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.register(userData);
      // Backend returns { user: { name: {...} }, token }
      const { token, user } = response;
      
      authService.storeAuthData(token, user);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user },
      });
      
      return response;
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message || 'Registration failed',
      });
      throw error;
    }
  };

  const logout = async () => {
    // Clear all auth data from localStorage
    authService.logout();
    
    // Dispatch logout action
    dispatch({ type: 'LOGOUT' });
    
    // Add a small delay before redirecting
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
