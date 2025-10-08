const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");
const {
  getAllSubclasses,
  formatSubclassLabel,
} = require("../constants/transactionSubclasses");

// Helper function to build query filters
const buildQueryFilters = (userId, filters = {}) => {
  const query = { userId: new mongoose.Types.ObjectId(userId) };

  if (filters.type) query.type = filters.type;
  if (filters.subclass) query.subclass = filters.subclass;
  if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;

  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = new Date(filters.startDate);
    if (filters.endDate) query.date.$lte = new Date(filters.endDate);
  }

  return query;
};

// Helper function to build date range filter
const buildDateRangeFilter = (startDate, endDate) => {
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.date = {};
    if (startDate) dateFilter.date.$gte = new Date(startDate);
    if (endDate) dateFilter.date.$lte = new Date(endDate);
  }
  return dateFilter;
};

// Get balance overview (total income, total expenses, net balance)
const getBalanceOverview = async (req, res) => {
  try {
    // Extract userId from headers (set by nginx after authentication)
    const userId = req.headers["x-user-id"];
    console.log('Extracted userId in getBalanceOverview:', userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in request headers",
      });
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const { startDate, endDate } = req.query;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const query = buildQueryFilters(userId, filters);

    const [incomeResult, expenseResult] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...query, type: "income" } },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: "$amount" },
            incomeTransactions: { $sum: 1 },
          },
        },
      ]),
      Transaction.aggregate([
        { $match: { ...query, type: "expense" } },
        {
          $group: {
            _id: null,
            totalExpense: { $sum: "$amount" },
            expenseTransactions: { $sum: 1 },
          },
        },
      ]),
    ]);

    const income = incomeResult[0] || { totalIncome: 0, incomeTransactions: 0 };
    const expense = expenseResult[0] || { totalExpense: 0, expenseTransactions: 0 };

    const balance = {
      totalIncome: income.totalIncome,
      totalExpense: expense.totalExpense,
      netBalance: income.totalIncome - expense.totalExpense,
      incomeTransactions: income.incomeTransactions,
      expenseTransactions: expense.expenseTransactions,
      totalTransactions: income.incomeTransactions + expense.expenseTransactions,
    };

    res.status(200).json({
      success: true,
      message: "Balance overview retrieved successfully",
      data: { balance },
    });
  } catch (error) {
    console.error("Error getting balance overview:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get category-wise analytics
const getCategoryAnalytics = async (req, res) => {
  try {
    // Extract userId from headers (set by nginx after authentication)
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in request headers",
      });
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const { type, startDate, endDate } = req.query;

    if (!type || !["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Valid type (income/expense) is required",
      });
    }

    const filters = { type };
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const query = buildQueryFilters(userId, filters);
    console.log('Query for getCategoryAnalytics:', JSON.stringify(query, null, 2));

    const categoryData = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$subclass",
          totalAmount: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $project: {
          name: {
            $replaceAll: {
              input: "$_id",
              find: "_",
              replacement: " "
            }
          },
          value: "$totalAmount",
          count: "$transactionCount",
        },
      },
      { $sort: { value: -1 } },
    ]);

    console.log('Category aggregation result:', categoryData);

    // Post-process to capitalize each word
    const formattedCategoryData = categoryData.map(item => ({
      ...item,
      name: item.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    }));

    res.status(200).json({
      success: true,
      message: `${type} category analytics retrieved successfully`,
      data: { categories: formattedCategoryData },
    });
  } catch (error) {
    console.error("Error getting category analytics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get timeline analytics (spending/income over time)
const getTimelineAnalytics = async (req, res) => {
  try {
    // Extract userId from headers (set by nginx after authentication)
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in request headers",
      });
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const { period = "daily", type, startDate, endDate } = req.query;

    const validPeriods = ["daily", "weekly", "monthly"];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        message: "Valid period (daily/weekly/monthly) is required",
      });
    }

    const filters = {};
    if (type && ["income", "expense"].includes(type)) filters.type = type;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const query = buildQueryFilters(userId, filters);

    let groupBy;
    switch (period) {
      case "daily":
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
        };
        break;
      case "weekly":
        groupBy = {
          year: { $year: "$date" },
          week: { $week: "$date" },
        };
        break;
      case "monthly":
        groupBy = {
          year: { $year: "$date" },
          month: { $month: "$date" },
        };
        break;
    }

    const timelineData = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: groupBy,
          totalAmount: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
          incomeAmount: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
          },
          expenseAmount: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } },
    ]);

    res.status(200).json({
      success: true,
      message: `Timeline analytics (${period}) retrieved successfully`,
      data: { timeline: timelineData, period },
    });
  } catch (error) {
    console.error("Error getting timeline analytics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get subclass options (reusing from transaction controller)
const getSubclassOptions = async (req, res) => {
  try {
    const subclasses = getAllSubclasses();

    res.status(200).json({
      success: true,
      message: "Subclass options retrieved successfully",
      data: subclasses,
    });
  } catch (error) {
    console.error("Error fetching subclass options:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get total income
const getTotalIncome = async (req, res) => {
  try {
    // Extract userId from headers (set by nginx after authentication)
    const userId = req.headers["x-user-id"];
    console.log('Extracted userId in getTotalIncome:', userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in request headers",
      });
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const { startDate, endDate } = req.query;

    const filters = { type: "income" };
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const query = buildQueryFilters(userId, filters);
    console.log('Query for getTotalIncome:', JSON.stringify(query, null, 2));

    const incomeResult = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$amount" },
          incomeTransactions: { $sum: 1 },
        },
      },
    ]);

    console.log('Income aggregation result:', incomeResult);

    const income = incomeResult[0] || { totalIncome: 0, incomeTransactions: 0 };

    res.status(200).json({
      success: true,
      message: "Total income retrieved successfully",
      data: {
        totalIncome: income.totalIncome,
        incomeTransactions: income.incomeTransactions,
      },
    });
  } catch (error) {
    console.error("Error getting total income:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get total expenses
const getTotalExpenses = async (req, res) => {
  try {
    // Extract userId from headers (set by nginx after authentication)
    const userId = req.headers["x-user-id"];
    console.log('Extracted userId in getTotalExpenses:', userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in request headers",
      });
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const { startDate, endDate } = req.query;

    const filters = { type: "expense" };
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const query = buildQueryFilters(userId, filters);
    console.log('Query for getTotalExpenses:', JSON.stringify(query, null, 2));

    const expenseResult = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" },
          expenseTransactions: { $sum: 1 },
        },
      },
    ]);

    console.log('Expense aggregation result:', expenseResult);

    const expense = expenseResult[0] || { totalExpense: 0, expenseTransactions: 0 };

    res.status(200).json({
      success: true,
      message: "Total expenses retrieved successfully",
      data: {
        totalExpense: expense.totalExpense,
        expenseTransactions: expense.expenseTransactions,
      },
    });
  } catch (error) {
    console.error("Error getting total expenses:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getBalanceOverview,
  getCategoryAnalytics,
  getTimelineAnalytics,
  getSubclassOptions,
  getTotalIncome,
  getTotalExpenses,
};

