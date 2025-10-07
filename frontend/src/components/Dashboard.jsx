import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import Analytics from './Analytics';
import Transactions from './Transactions';
import AddTransaction from './AddTransaction';
import AddStatement from './AddStatement';
import './Dashboard.css';

const Dashboard = () => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics'); // Add tab state

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
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
            <button 
              className={`tab-button ${activeTab === 'add-transaction' ? 'active' : ''}`}
              onClick={() => setActiveTab('add-transaction')}
            >
              ➕ Add Transaction
            </button>
            <button 
              className={`tab-button ${activeTab === 'add-statement' ? 'active' : ''}`}
              onClick={() => setActiveTab('add-statement')}
            >
              📄 Upload Statement
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'analytics' && (
            <div className="tab-content">
              <Analytics />
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="tab-content">
              <Transactions />
            </div>
          )}

          {activeTab === 'add-transaction' && (
            <div className="tab-content">
              <AddTransaction />
            </div>
          )}

          {activeTab === 'add-statement' && (
            <div className="tab-content">
              <AddStatement />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;