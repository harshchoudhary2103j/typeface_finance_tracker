import React, { useState } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

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
          
          {/* Dashboard content will go here */}
          <div className="dashboard-widgets">
            <div className="widget">
              <h3>Total Expenses</h3>
              <p>Coming soon...</p>
            </div>
            <div className="widget">
              <h3>Monthly Budget</h3>
              <p>Coming soon...</p>
            </div>
            <div className="widget">
              <h3>Recent Transactions</h3>
              <p>Coming soon...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;