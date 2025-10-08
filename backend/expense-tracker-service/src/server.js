require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import database
const { connectDB } = require('../config/database');

// Import routes
const transactionRoutes = require('./routes/transactions');
const analyticsRoutes = require('./routes/analytics');
const receiptRoutes = require('./routes/receipts');
const statementRoutes = require('./routes/statements');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { handleUploadError } = require('./middleware/upload');

const app = express();
const PORT = process.env.PORT || 3002;

// Rate limiting with environment variables
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Enhanced CORS configuration for frontend connectivity


// Middleware setup
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(morgan(process.env.LOG_LEVEL || 'combined')); // Logging
app.use(limiter); // Rate limiting
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Expense Tracker Service is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    availableRoutes: {
      transactions: '/api/v1/expense-tracker/transactions',
      analytics: '/api/v1/expense-tracker/analytics',
      receipts: '/api/v1/expense-tracker/receipts',
      statements: '/api/v1/expense-tracker/statements'
    }
  });
});

// API routes
app.use('/api/v1/expense-tracker/transactions', transactionRoutes);
app.use('/api/v1/expense-tracker/analytics', analyticsRoutes);
app.use('/api/v1/expense-tracker/receipts', receiptRoutes);
app.use('/api/v1/expense-tracker/statements', statementRoutes);

// Handle upload errors
app.use(handleUploadError);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Initialize services and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Expense Tracker Service running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});


startServer();

module.exports = app;