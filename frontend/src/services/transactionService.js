import api from './api';

const transactionService = {
  // Get all transactions with filtering and pagination
  getTransactions: async (params = {}) => {
    try {
      const response = await api.get('expense-tracker/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  // Get a single transaction by ID
  getTransactionById: async (id) => {
    try {
      const response = await api.get(`expense-tracker/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  },

  // Create a new transaction
  createTransaction: async (transactionData) => {
    try {
      const response = await api.post('expense-tracker/transactions', transactionData);
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  // Update an existing transaction
  updateTransaction: async (id, transactionData) => {
    try {
      const response = await api.put(`expense-tracker/transactions/${id}`, transactionData);
      return response.data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },

  // Delete a transaction
  deleteTransaction: async (id) => {
    try {
      const response = await api.delete(`expense-tracker/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  // Get subclass options for forms
  getSubclassOptions: async () => {
    try {
      const response = await api.get('expense-tracker/transactions/subclasses');
      return response.data;
    } catch (error) {
      console.error('Error fetching subclass options:', error);
      throw error;
    }
  }
};

export default transactionService;