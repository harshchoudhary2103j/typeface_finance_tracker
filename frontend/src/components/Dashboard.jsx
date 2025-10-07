import React from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const dashboardStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    },
    card: {
      background: '#ffffff',
      borderRadius: '16px',
      padding: '40px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      maxWidth: '900px',
      margin: '0 auto',
      border: '1px solid rgba(255,255,255,0.2)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '40px',
      paddingBottom: '20px',
      borderBottom: '2px solid #f1f5f9'
    },
    title: {
      color: '#1e293b',
      margin: 0,
      fontSize: '36px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    logoutButton: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: '#ffffff',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
    },
    welcomeCard: {
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '30px',
      borderRadius: '16px',
      marginBottom: '30px',
      border: '1px solid #e2e8f0'
    },
    welcomeTitle: {
      color: '#1e293b',
      marginBottom: '20px',
      fontSize: '24px',
      fontWeight: '600'
    },
    userInfo: {
      color: '#475569',
      margin: '8px 0',
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center'
    },
    infoLabel: {
      fontWeight: '600',
      marginRight: '8px',
      color: '#334155'
    },
    successCard: {
      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      padding: '30px',
      borderRadius: '16px',
      border: '1px solid #86efac'
    },
    successTitle: {
      color: '#059669',
      marginBottom: '15px',
      fontSize: '20px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center'
    },
    successText: {
      color: '#047857',
      margin: 0,
      lineHeight: '1.6',
      fontSize: '16px'
    }
  };

  return (
    <div style={dashboardStyles.container}>
      <div style={dashboardStyles.card}>
        <div style={dashboardStyles.header}>
          <h1 style={dashboardStyles.title}>Dashboard</h1>
          <button 
            onClick={handleLogout}
            style={dashboardStyles.logoutButton}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.2)';
            }}
          >
            Logout
          </button>
        </div>
        
        <div style={dashboardStyles.welcomeCard}>
          <h3 style={dashboardStyles.welcomeTitle}>Welcome back!</h3>
          <p style={dashboardStyles.userInfo}>
            <span style={dashboardStyles.infoLabel}>Name:</span> 
            {typeof user.name === 'string' ? user.name : `${user.name.firstname} ${user.name.lastname}`}
          </p>
          <p style={dashboardStyles.userInfo}>
            <span style={dashboardStyles.infoLabel}>Email:</span> 
            {user.email}
          </p>
        </div>
        
        <div style={dashboardStyles.successCard}>
          <h4 style={dashboardStyles.successTitle}>
            🎉 Authentication Successful!
          </h4>
          <p style={dashboardStyles.successText}>
            You have successfully logged into your expense tracker application. 
            This is where your main application content will go. You can now start 
            tracking your expenses, managing transactions, and viewing analytics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;