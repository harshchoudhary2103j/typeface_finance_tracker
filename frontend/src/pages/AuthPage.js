import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../components/auth/AuthForm';
import { Toaster } from 'react-hot-toast';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleToggle = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="auth-page">
      <Toaster position="top-right" />
      
      <div className="auth-page__container">
        <div className="auth-page__left">
          <div className="auth-page__brand">
            <h1>ExpenseTracker</h1>
            <p>Take control of your finances with smart expense tracking</p>
          </div>
          
          <div className="auth-page__features">
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div>
                <h3>Smart Analytics</h3>
                <p>Get insights into your spending patterns with detailed charts and reports</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">💰</div>
              <div>
                <h3>Budget Management</h3>
                <p>Set budgets and track your progress towards financial goals</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <div>
                <h3>User Friendly</h3>
                <p>Access your expense data anywhere, anytime with an intuitive interface</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="auth-page__right">
          <AuthForm isLogin={isLogin} onToggle={handleToggle} />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
