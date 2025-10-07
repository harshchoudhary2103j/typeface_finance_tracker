import React, { useState, useEffect } from 'react';
import { Calendar, CalendarIcon } from 'lucide-react';
import transactionService from '../services/transactionService';
import './Transactions.css';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    subclass: '',
    paymentMethod: '',
    startDate: '',
    endDate: ''
  });

  // Edit modal states
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [subclassOptions, setSubclassOptions] = useState({});

  // Fetch transactions
  const fetchTransactions = async (page = 1, currentFilters = filters) => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...currentFilters
      };

      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await transactionService.getTransactions(params);
      
      if (response.success) {
        setTransactions(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subclass options
  const fetchSubclassOptions = async () => {
    try {
      const response = await transactionService.getSubclassOptions();
      if (response.success) {
        setSubclassOptions(response.data);
      }
    } catch (error) {
      console.error('Error fetching subclass options:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTransactions();
    fetchSubclassOptions();
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchTransactions(1, filters);
  };

  // Clear filters
  const clearFilters = () => {
    const emptyFilters = {
      type: '',
      subclass: '',
      paymentMethod: '',
      startDate: '',
      endDate: ''
    };
    setFilters(emptyFilters);
    fetchTransactions(1, emptyFilters);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTransactions(newPage);
    }
  };

  // Handle delete
  const handleDelete = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const response = await transactionService.deleteTransaction(transactionId);
      if (response.success) {
        fetchTransactions(pagination.page); // Refresh current page
      } else {
        setError(response.message || 'Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError(error.response?.data?.message || 'Failed to delete transaction');
    }
  };

  // Handle edit modal
  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      subclass: transaction.subclass,
      paymentMethod: transaction.paymentMethod || '',
      date: transaction.date.split('T')[0] // Format date for input
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingTransaction(null);
    setEditForm({});
  };

  // Handle edit form changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle edit form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await transactionService.updateTransaction(
        editingTransaction._id,
        editForm
      );
      
      if (response.success) {
        closeEditModal();
        fetchTransactions(pagination.page); // Refresh current page
      } else {
        setError(response.message || 'Failed to update transaction');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      setError(error.response?.data?.message || 'Failed to update transaction');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="transactions-container">
      <h2>Transactions</h2>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-row">
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            name="subclass"
            value={filters.subclass}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {filters.type && subclassOptions[filters.type] && 
              subclassOptions[filters.type].map(subclass => (
                <option key={subclass} value={subclass}>{subclass}</option>
              ))
            }
          </select>

          <select
            name="paymentMethod"
            value={filters.paymentMethod}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="digital_wallet">Digital Wallet</option>
            <option value="other">Other</option>
          </select>

          <div className="date-input-container">
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="filter-input date-input"
              placeholder="Start Date"
            />
            <CalendarIcon className="calendar-icon" size={16} />
          </div>

          <div className="date-input-container">
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="filter-input date-input"
              placeholder="End Date"
            />
            <CalendarIcon className="calendar-icon" size={16} />
          </div>

          <button onClick={applyFilters} className="filter-btn apply-btn">
            Apply Filters
          </button>
          <button onClick={clearFilters} className="filter-btn clear-btn">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading">
          Loading transactions...
        </div>
      )}

      {/* Transactions Table */}
      {!loading && (
        <div className="table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Category</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td>{formatDate(transaction.date)}</td>
                    <td>
                      <span className={`type-badge ${transaction.type}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td>{transaction.description}</td>
                    <td>{transaction.subclass}</td>
                    <td>{transaction.paymentMethod || 'N/A'}</td>
                    <td className={`amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => openEditModal(transaction)}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(transaction._id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrev}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages} 
            ({pagination.totalCount} total transactions)
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Transaction</h3>
              <button onClick={closeEditModal} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-group">
                <label>Type:</label>
                <select
                  name="type"
                  value={editForm.type}
                  onChange={handleEditFormChange}
                  required
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div className="form-group">
                <label>Amount:</label>
                <input
                  type="number"
                  name="amount"
                  value={editForm.amount}
                  onChange={handleEditFormChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Description:</label>
                <input
                  type="text"
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category:</label>
                <select
                  name="subclass"
                  value={editForm.subclass}
                  onChange={handleEditFormChange}
                  required
                >
                  <option value="">Select Category</option>
                  {editForm.type && subclassOptions[editForm.type] && 
                    subclassOptions[editForm.type].map(subclass => (
                      <option key={subclass} value={subclass}>{subclass}</option>
                    ))
                  }
                </select>
              </div>

              {editForm.type === 'expense' && (
                <div className="form-group">
                  <label>Payment Method:</label>
                  <select
                    name="paymentMethod"
                    value={editForm.paymentMethod}
                    onChange={handleEditFormChange}
                  >
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="digital_wallet">Digital Wallet</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Date:</label>
                <div className="date-input-container">
                  <input
                    type="date"
                    name="date"
                    value={editForm.date}
                    onChange={handleEditFormChange}
                    required
                    className="date-input"
                  />
                  <CalendarIcon className="calendar-icon" size={16} />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeEditModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;