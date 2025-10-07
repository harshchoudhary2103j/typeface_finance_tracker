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
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #fef7f7 0%, #fdf2f8 25%, #fce7f3 50%, #fbcfe8 100%)',
      padding: '40px 60px',
      position: 'relative',
      overflow: 'auto',
      margin: 0,
      boxSizing: 'border-box'
    },
    backgroundDecor: {
      position: 'absolute',
      top: '-10%',
      right: '-10%',
      width: '40%',
      height: '40%',
      background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
      borderRadius: '50%',
      animation: 'float 8s ease-in-out infinite'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '32px',
      padding: '60px 80px',
      boxShadow: '0 25px 50px rgba(236, 72, 153, 0.15)',
      maxWidth: '1400px',
      width: '100%',
      margin: '0 auto',
      border: '1px solid rgba(251, 113, 133, 0.2)',
      position: 'relative',
      zIndex: 10,
      minHeight: 'calc(100vh - 120px)',
      boxSizing: 'border-box'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '60px',
      paddingBottom: '30px',
      borderBottom: '3px solid #fce7f3'
    },
    title: {
      color: '#881337',
      margin: 0,
      fontSize: '48px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #881337 0%, #be185d 50%, #ec4899 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      position: 'relative'
    },
    titleIcon: {
      position: 'absolute',
      left: '-70px',
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '42px',
      animation: 'bounce 2s ease-in-out infinite'
    },
    logoutButton: {
      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      color: '#ffffff',
      border: 'none',
      padding: '16px 32px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 25px rgba(220, 38, 38, 0.3)',
      minHeight: '56px'
    },
    contentGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '40px',
      marginBottom: '40px'
    },
    welcomeCard: {
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
      padding: '40px',
      borderRadius: '24px',
      border: '1px solid #f9a8d4',
      position: 'relative',
      overflow: 'hidden',
      gridColumn: 'span 1'
    },
    welcomeCardDecor: {
      position: 'absolute',
      top: '-20px',
      right: '-20px',
      fontSize: '80px',
      opacity: 0.1,
      color: '#ec4899'
    },
    welcomeTitle: {
      color: '#881337',
      marginBottom: '24px',
      fontSize: '28px',
      fontWeight: '600',
      position: 'relative',
      zIndex: 2
    },
    userInfo: {
      color: '#9f1239',
      margin: '12px 0',
      fontSize: '18px',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      zIndex: 2
    },
    infoLabel: {
      fontWeight: '600',
      marginRight: '12px',
      color: '#881337',
      minWidth: '60px'
    },
    successCard: {
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      padding: '40px',
      borderRadius: '24px',
      border: '1px solid #86efac',
      position: 'relative',
      overflow: 'hidden',
      gridColumn: 'span 2'
    },
    successCardDecor: {
      position: 'absolute',
      bottom: '-15px',
      right: '-15px',
      fontSize: '60px',
      opacity: 0.2,
      color: '#22c55e'
    },
    successTitle: {
      color: '#059669',
      marginBottom: '20px',
      fontSize: '24px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      zIndex: 2
    },
    successText: {
      color: '#047857',
      margin: 0,
      lineHeight: '1.6',
      fontSize: '18px',
      position: 'relative',
      zIndex: 2
    },
    statsCard: {
      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      padding: '40px',
      borderRadius: '24px',
      border: '1px solid #93c5fd',
      position: 'relative',
      overflow: 'hidden',
      gridColumn: 'span 1'
    },
    statsTitle: {
      color: '#1e40af',
      fontSize: '24px',
      fontWeight: '600',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center'
    },
    statsText: {
      color: '#1e3a8a',
      fontSize: '16px',
      lineHeight: '1.6'
    }
  };

  return (
    <div style={dashboardStyles.container}>
      <div style={dashboardStyles.backgroundDecor}></div>
      <div style={dashboardStyles.card}>
        <div style={dashboardStyles.header}>
          <h1 style={dashboardStyles.title}>
            <span style={dashboardStyles.titleIcon}>💰</span>
            Dashboard
          </h1>
          <button 
            onClick={handleLogout}
            style={dashboardStyles.logoutButton}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 35px rgba(220, 38, 38, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.3)';
            }}
          >
            Logout
          </button>
        </div>
        
        <div style={dashboardStyles.contentGrid}>
          <div style={dashboardStyles.welcomeCard}>
            <div style={dashboardStyles.welcomeCardDecor}>📊</div>
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
          
          <div style={dashboardStyles.statsCard}>
            <h4 style={dashboardStyles.statsTitle}>
              📈 Quick Stats
            </h4>
            <p style={dashboardStyles.statsText}>
              Your expense tracking journey starts here! Set up your budget, 
              add transactions, and watch your financial health improve over time.
            </p>
          </div>
        </div>
        
        <div style={dashboardStyles.successCard}>
          <div style={dashboardStyles.successCardDecor}>💸</div>
          <h4 style={dashboardStyles.successTitle}>
            🎉 Authentication Successful!
          </h4>
          <p style={dashboardStyles.successText}>
            You have successfully logged into your expense tracker application. 
            This is where your main application content will go. You can now start 
            tracking your expenses, managing transactions, viewing analytics, and 
            taking control of your financial future. The dashboard provides a 
            comprehensive overview of your spending patterns and financial goals.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;