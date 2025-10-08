const express = require('express');
const router = express.Router();
const {
  getCategoryAnalytics,
  getTimelineAnalytics,
  getBalanceOverview,
  getSubclassOptions,
  getTotalIncome,
  getTotalExpenses
} = require('../controllers/analyticsController');

// Analytics endpoints
router.get('/category', getCategoryAnalytics);
router.get('/timeline', getTimelineAnalytics);
router.get('/balance', getBalanceOverview);
router.get('/subclasses', getSubclassOptions);
router.get('/income', getTotalIncome);
router.get('/expenses', getTotalExpenses);

module.exports = router;