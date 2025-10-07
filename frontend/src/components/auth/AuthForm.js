import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import './AuthForm.css';

const AuthForm = ({ isLogin = true, onToggle }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { login, register, clearError } = useAuth();
  
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    clearError();
    
    try {
      if (isLogin) {
        await login({
          email: data.email,
          password: data.password,
        });
        toast.success('Login successful!');
      } else {
        // Backend expects name as a full string that it will split
        await register({
          name: data.name,
          email: data.email,
          password: data.password,
        });
        toast.success('Registration successful!');
      }
    } catch (error) {
      // Handle different error formats from backend
      let errorMessage = 'Authentication failed';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.msg) {
        errorMessage = error.msg;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    reset();
    clearError();
    onToggle();
  };

  return (
    <div className="auth-form">
      <div className="auth-form__header">
        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p>
          {isLogin
            ? 'Sign in to access your expense tracker'
            : 'Join us to start tracking your expenses'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form__form">
        {!isLogin && (
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              {...registerField('name', {
                required: 'Full name is required',
                minLength: {
                  value: 3,
                  message: 'Name must be at least 3 characters',
                },
                validate: (value) => {
                  const parts = value.trim().split(' ');
                  if (parts.length < 2) {
                    return 'Please provide at least first and last name';
                  }
                  return true;
                }
              })}
              className={errors.name ? 'error' : ''}
              placeholder="Enter your full name (e.g., John Doe)"
            />
            {errors.name && (
              <span className="error-message">{errors.name.message}</span>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            {...registerField('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email address',
              },
            })}
            className={errors.email ? 'error' : ''}
            placeholder="Enter your email"
          />
          {errors.email && (
            <span className="error-message">{errors.email.message}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            {...registerField('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            className={errors.password ? 'error' : ''}
            placeholder="Enter your password"
          />
          {errors.password && (
            <span className="error-message">{errors.password.message}</span>
          )}
        </div>

        <button
          type="submit"
          className="auth-form__submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading-spinner">Loading...</span>
          ) : isLogin ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="auth-form__footer">
        <p>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={handleToggle}
            className="auth-form__toggle"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
