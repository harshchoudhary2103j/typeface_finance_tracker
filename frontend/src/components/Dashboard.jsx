import React, { useState, useEffect, useRef } from 'react';
import authService from '../services/authService';
import analyticsService from '../services/analyticsService';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Transactions from './Transactions';
import './Dashboard.css';

const Dashboard = () => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics'); // Add tab state
  
  // Analytics data state
  const [balanceData, setBalanceData] = useState(null);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Retry logic state
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [autoRefreshTime, setAutoRefreshTime] = useState(null);
  const [countdown, setCountdown] = useState(null);
  
  // Add flag to prevent multiple simultaneous calls
  const [isFetching, setIsFetching] = useState(false);
  const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);
  
  // Debouncing ref to prevent multiple API calls
  const fetchTimeoutRef = useRef(null);
  const autoRefreshTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  
  const MAX_RETRY_ATTEMPTS = 3;
  const AUTO_REFRESH_DELAY = 5 * 60 * 1000; // 5 minutes

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  // Manual retry function
  const handleManualRetry = () => {
    if (isBlocked || isFetching) {
      console.log('Manual retry blocked. Please wait...');
      return;
    }
    
    console.log('Manual retry initiated');
    setRetryAttempts(0);
    setError('');
    fetchAnalyticsData(true);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (e) => {
    if (!e.target.closest('.profile-dropdown-container')) {
      setShowProfileDropdown(false);
    }
  };

  React.useEffect(() => {
    if (showProfileDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showProfileDropdown]);

  if (!user) {
    navigate('/login');
    return null;
  }

  // Get first letter of user's first name for profile icon
  const profileInitial = user.name?.firstname?.charAt(0).toUpperCase() || 'U';

  // Colors for pie charts
  const COLORS = ['#ec4899', '#be185d', '#881337', '#f472b6', '#fbbf24', '#fb7185', '#a855f7', '#06b6d4'];

  // Fetch analytics data with retry logic
  const fetchAnalyticsData = async (isRetry = false) => {
    // Prevent multiple simultaneous calls
    if (isFetching && !isRetry) {
      console.log('API call already in progress, skipping...');
      return;
    }

    try {
      // If blocked and not a retry, don't proceed
      if (isBlocked && !isRetry) {
        console.log('API calls are blocked. Waiting for auto-refresh...');
        return;
      }
      
      setIsFetching(true);
      setLoading(true);
      setError('');
      
      console.log('Fetching analytics data...');
      console.log('User ID check:', user?.id || 'No user ID found');
      console.log('Retry attempts:', retryAttempts);
      
      // Fetch balance overview
      const balanceResponse = await analyticsService.getBalanceOverview();
      console.log('Balance data received:', balanceResponse);
      
      // Fetch income categories
      const incomeResponse = await analyticsService.getCategoryAnalytics('income');
      console.log('Income categories received:', incomeResponse);
      
      // Fetch expense categories  
      const expenseResponse = await analyticsService.getCategoryAnalytics('expense');
      console.log('Expense categories received:', expenseResponse);
      
      setBalanceData(balanceResponse.data?.balance || {});
      setIncomeCategories(incomeResponse.data?.categories || []);
      setExpenseCategories(expenseResponse.data?.categories || []);
      
      // Reset retry attempts on success
      setRetryAttempts(0);
      setIsBlocked(false);
      setAutoRefreshTime(null);
      setCountdown(null);
      setHasInitiallyFetched(true);
      
      // Clear auto refresh timeout and countdown if exists
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
        autoRefreshTimeoutRef.current = null;
      }
      
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      
      const newRetryAttempts = retryAttempts + 1;
      setRetryAttempts(newRetryAttempts);
      
      if (newRetryAttempts >= MAX_RETRY_ATTEMPTS) {
        setError('Failed to load analytics data. Too many requests.');
        setIsBlocked(true);
        
        // Set auto refresh time
        const refreshTime = new Date(Date.now() + AUTO_REFRESH_DELAY);
        setAutoRefreshTime(refreshTime);
        
        // Start countdown
        const updateCountdown = () => {
          const now = new Date();
          const timeDiff = refreshTime.getTime() - now.getTime();
          
          if (timeDiff <= 0) {
            setCountdown(null);
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
          } else {
            const minutes = Math.floor(timeDiff / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
          }
        };
        
        updateCountdown();
        countdownIntervalRef.current = setInterval(updateCountdown, 1000);
        
        // Set auto refresh timeout
        autoRefreshTimeoutRef.current = setTimeout(() => {
          console.log('Auto-refreshing after 5 minutes...');
          setRetryAttempts(0);
          setIsBlocked(false);
          setAutoRefreshTime(null);
          setCountdown(null);
          
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          
          fetchAnalyticsData(true);
        }, AUTO_REFRESH_DELAY);
        
      } else {
        setError(`Failed to load analytics data. Retrying... (${newRetryAttempts}/${MAX_RETRY_ATTEMPTS})`);
        
        // Only auto-retry if this is not already a retry to prevent loops
        if (!isRetry) {
          // Retry with exponential backoff
          setTimeout(() => {
            fetchAnalyticsData(true);
          }, Math.pow(2, newRetryAttempts) * 1000); // 2s, 4s, 8s delays
        }
      }
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // Load data on component mount - ONLY ONCE
  useEffect(() => {
    if (user && !hasInitiallyFetched && !isFetching) {
      fetchAnalyticsData();
    }
    
    // Cleanup function
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [user]); // Only depend on user, not on isBlocked or other changing states

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="dashboard-navbar">
        <div className="navbar-left">
          <h1 className="navbar-brand">ExpenseTracker</h1>
        </div>
        
        <div className="navbar-right">
          {/* Notification Icon */}
          <div className="navbar-icon notification-icon">
            <span className="icon">🔔</span>
            <span className="notification-badge">3</span>
          </div>
          
          {/* Profile Dropdown */}
          <div className="profile-dropdown-container">
            <div className="navbar-icon profile-icon" onClick={toggleProfileDropdown}>
              <span className="icon profile-initial">{profileInitial}</span>
            </div>
            
            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="profile-avatar">
                    <span className="avatar-icon">{profileInitial}</span>
                  </div>
                  <div className="profile-info">
                    <h3 className="profile-name">
                      {user.name?.firstname} {user.name?.lastname}
                    </h3>
                    <p className="profile-email">{user.email}</p>
                  </div>
                </div>
                
                <div className="profile-dropdown-divider"></div>
                
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h2 className="dashboard-title">
            Welcome back, {user.name?.firstname}! 💰
          </h2>
          <p className="dashboard-subtitle">
            Ready to track your expenses and grow your wealth?
          </p>
          
          {/* Navigation Tabs */}
          <div className="dashboard-tabs">
            <button 
              className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              📊 Analytics
            </button>
            <button 
              className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              💳 Transactions
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'analytics' && (
            <div className="tab-content">
              {/* Dashboard Analytics Cards */}
              <div className="dashboard-widgets">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading analytics data...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <p className="error-message">{error}</p>
                {isBlocked && countdown && (
                  <p className="countdown-message">
                    Auto-refresh in: {countdown}
                  </p>
                )}
                {!isBlocked && (
                  <button onClick={handleManualRetry} className="retry-button" disabled={loading}>
                    {loading ? 'Retrying...' : 'Try Again'}
                  </button>
                )}
                {isBlocked && (
                  <p className="blocked-message">
                    Too many failed attempts. Please wait for auto-refresh.
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Total Income Card */}
                <div className="widget income-card">
                  <div className="widget-header">
                    <span className="widget-icon">💰</span>
                    <h3>Total Income</h3>
                  </div>
                  <div className="widget-value">
                    ${balanceData?.totalIncome?.toFixed(2) || '0.00'}
                  </div>
                  <div className="widget-details">
                    <span className="transaction-count">
                      {balanceData?.incomeTransactions || 0} transactions
                    </span>
                  </div>
                </div>

                {/* Income Distribution Pie Chart */}
                <div className="widget chart-card">
                  <div className="widget-header">
                    <span className="widget-icon">📊</span>
                    <h3>Income Distribution</h3>
                  </div>
                  <div className="chart-container">
                    {incomeCategories.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={incomeCategories}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {incomeCategories.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [`$${value.toFixed(2)}`, 'Amount']}
                            labelFormatter={(label) => `Category: ${label}`}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="no-data">
                        <p>No income data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Expenses Card */}
                <div className="widget expense-card">
                  <div className="widget-header">
                    <span className="widget-icon">💸</span>
                    <h3>Total Expenses</h3>
                  </div>
                  <div className="widget-value">
                    ${balanceData?.totalExpense?.toFixed(2) || '0.00'}
                  </div>
                  <div className="widget-details">
                    <span className="transaction-count">
                      {balanceData?.expenseTransactions || 0} transactions
                    </span>
                  </div>
                </div>

                {/* Expense Distribution Pie Chart */}
                <div className="widget chart-card">
                  <div className="widget-header">
                    <span className="widget-icon">📈</span>
                    <h3>Expense Distribution</h3>
                  </div>
                  <div className="chart-container">
                    {expenseCategories.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={expenseCategories}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {expenseCategories.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [`$${value.toFixed(2)}`, 'Amount']}
                            labelFormatter={(label) => `Category: ${label}`}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="no-data">
                        <p>No expense data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="tab-content">
              <Transactions />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;