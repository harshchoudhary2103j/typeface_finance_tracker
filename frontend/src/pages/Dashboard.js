import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle the name structure from backend: user.name = { firstname, lastname, middlename? }
  const displayName = user?.name 
    ? `${user.name.firstname} ${user.name.middlename ? user.name.middlename + ' ' : ''}${user.name.lastname}`
    : 'User';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Show logout toast
      toast.success('Logging out...');
      
      // Call logout function
      await logout();
      
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout');
      setIsLoggingOut(false);
    }
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Welcome to Dashboard, {displayName}!</h1>
      <p>Your expense tracker dashboard will be here.</p>
      <button 
        onClick={handleLogout}
        disabled={isLoggingOut}
        style={{
          padding: '0.75rem 1.5rem',
          background: isLoggingOut ? '#9ca3af' : '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isLoggingOut ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          opacity: isLoggingOut ? 0.7 : 1
        }}
      >
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
};

export default Dashboard;
