import React, { useState, useEffect, useRef } from 'react';
import analyticsService from '../services/analyticsService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './Analytics.css';

const Analytics = () => {
  // Analytics data state
  const [balanceData, setBalanceData] = useState(null);
  const [totalIncomeData, setTotalIncomeData] = useState(null);
  const [totalExpenseData, setTotalExpenseData] = useState(null);
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

  // Colors for pie charts
  const COLORS = ['#ec4899', '#be185d', '#881337', '#f472b6', '#fbbf24', '#fb7185', '#a855f7', '#06b6d4'];

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
      console.log('Retry attempts:', retryAttempts);
      
      // Fetch balance overview
      const balanceResponse = await analyticsService.getBalanceOverview();
      console.log('Balance data received:', balanceResponse);
      
      // Fetch total income
      const totalIncomeResponse = await analyticsService.getTotalIncome();
      console.log('Total income data received:', totalIncomeResponse);
      
      // Fetch total expenses
      const totalExpenseResponse = await analyticsService.getTotalExpenses();
      console.log('Total expense data received:', totalExpenseResponse);
      
      // Fetch income categories
      const incomeResponse = await analyticsService.getCategoryAnalytics('income');
      console.log('Income categories received:', incomeResponse);
      
      // Fetch expense categories  
      const expenseResponse = await analyticsService.getCategoryAnalytics('expense');
      console.log('Expense categories received:', expenseResponse);
      
      setBalanceData(balanceResponse.data?.balance || {});
      setTotalIncomeData(totalIncomeResponse.data || {});
      setTotalExpenseData(totalExpenseResponse.data || {});
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

  // Load data on component mount
  useEffect(() => {
    if (!hasInitiallyFetched && !isFetching) {
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
  }, []);

  // Calculate net balance
  const netBalance = (totalIncomeData?.totalIncome || 0) - (totalExpenseData?.totalExpense || 0);

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>📊 Financial Analytics</h2>
        <p>Track your income, expenses, and financial health</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-card">
            <h3>⚠️ Unable to Load Data</h3>
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
        </div>
      ) : (
        <div className="analytics-content">
          {/* Summary Cards Row */}
          <div className="summary-cards">
            <div className="analytics-card income-card">
              <div className="card-header">
                <div className="card-icon income-icon">💰</div>
                <div className="card-title">
                  <h3>Total Income</h3>
                  <span className="card-subtitle">All time earnings</span>
                </div>
              </div>
              <div className="card-value income-value">
                ${totalIncomeData?.totalIncome?.toFixed(2) || '0.00'}
              </div>
              <div className="card-footer">
                <span className="transaction-count">
                  {totalIncomeData?.incomeTransactions || 0} transactions
                </span>
              </div>
            </div>

            <div className="analytics-card expense-card">
              <div className="card-header">
                <div className="card-icon expense-icon">💸</div>
                <div className="card-title">
                  <h3>Total Expenses</h3>
                  <span className="card-subtitle">All time spending</span>
                </div>
              </div>
              <div className="card-value expense-value">
                ${totalExpenseData?.totalExpense?.toFixed(2) || '0.00'}
              </div>
              <div className="card-footer">
                <span className="transaction-count">
                  {totalExpenseData?.expenseTransactions || 0} transactions
                </span>
              </div>
            </div>

            <div className="analytics-card balance-card">
              <div className="card-header">
                <div className={`card-icon balance-icon ${netBalance >= 0 ? 'positive' : 'negative'}`}>
                  {netBalance >= 0 ? '📈' : '📉'}
                </div>
                <div className="card-title">
                  <h3>Net Balance</h3>
                  <span className="card-subtitle">Income - Expenses</span>
                </div>
              </div>
              <div className={`card-value balance-value ${netBalance >= 0 ? 'positive' : 'negative'}`}>
                {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
              </div>
              <div className="card-footer">
                <span className={`balance-status ${netBalance >= 0 ? 'positive' : 'negative'}`}>
                  {netBalance >= 0 ? '✅ Healthy' : '⚠️ Deficit'}
                </span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-section">
            <div className="chart-card income-chart">
              <div className="chart-header">
                <h3>💰 Income Distribution</h3>
                <p>Breakdown by category</p>
              </div>
              <div className="chart-container">
                {incomeCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={incomeCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
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
                    <div className="no-data-icon">📊</div>
                    <p>No income data available</p>
                    <span>Start adding income transactions to see the breakdown</span>
                  </div>
                )}
              </div>
            </div>

            <div className="chart-card expense-chart">
              <div className="chart-header">
                <h3>💸 Expense Distribution</h3>
                <p>Spending by category</p>
              </div>
              <div className="chart-container">
                {expenseCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
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
                    <div className="no-data-icon">📈</div>
                    <p>No expense data available</p>
                    <span>Start adding expense transactions to see the breakdown</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h3>📋 Quick Insights</h3>
            <div className="insights-grid">
              <div className="insight-item">
                <span className="insight-label">Average Income</span>
                <span className="insight-value">
                  ${totalIncomeData?.incomeTransactions > 0 ? 
                    (totalIncomeData.totalIncome / totalIncomeData.incomeTransactions).toFixed(2) : 
                    '0.00'}
                </span>
              </div>
              <div className="insight-item">
                <span className="insight-label">Average Expense</span>
                <span className="insight-value">
                  ${totalExpenseData?.expenseTransactions > 0 ? 
                    (totalExpenseData.totalExpense / totalExpenseData.expenseTransactions).toFixed(2) : 
                    '0.00'}
                </span>
              </div>
              <div className="insight-item">
                <span className="insight-label">Total Transactions</span>
                <span className="insight-value">
                  {(totalIncomeData?.incomeTransactions || 0) + (totalExpenseData?.expenseTransactions || 0)}
                </span>
              </div>
              <div className="insight-item">
                <span className="insight-label">Savings Rate</span>
                <span className="insight-value">
                  {totalIncomeData?.totalIncome > 0 ? 
                    ((netBalance / totalIncomeData.totalIncome) * 100).toFixed(1) : 
                    '0.0'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;