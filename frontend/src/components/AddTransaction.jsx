import React, { useState, useEffect } from 'react';
import transactionService from '../services/transactionService';
import './AddTransaction.css';

const AddTransaction = () => {
  const [formData, setFormData] = useState({
    type: 'expense',
    subclass: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash'
  });

  const [subclassOptions, setSubclassOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForm, setShowForm] = useState(false);

  // Payment method options
  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'digital_wallet', label: 'Digital Wallet' },
    { value: 'check', label: 'Check' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchSubclassOptions();
  }, []);

  const fetchSubclassOptions = async () => {
    try {
      const response = await transactionService.getSubclassOptions();
      if (response.success) {
        setSubclassOptions(response.data);
      }
    } catch (error) {
      console.error('Error fetching subclass options:', error);
      setMessage({ type: 'error', text: 'Failed to load transaction categories' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset subclass when type changes
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        subclass: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Prepare data for submission
      const submissionData = {
        type: formData.type,
        subclass: formData.subclass,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date
      };

      // Add payment method only for expense transactions
      if (formData.type === 'expense') {
        submissionData.paymentMethod = formData.paymentMethod;
      }

      const response = await transactionService.createTransaction(submissionData);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Transaction created successfully!' });
        // Reset form
        setFormData({
          type: 'expense',
          subclass: '',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'cash'
        });
        // Hide form after successful submission
        setTimeout(() => {
          setShowForm(false);
          setMessage({ type: '', text: '' });
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create transaction';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const getSubclassOptionsForType = () => {
    if (!subclassOptions[formData.type]) return [];
    return subclassOptions[formData.type].map(option => ({
      value: option,
      label: option.charAt(0).toUpperCase() + option.slice(1).replace(/_/g, ' ')
    }));
  };

  return (
    <div className="add-transaction">
      <div className="add-transaction-header">
        <h2>Add New Transaction</h2>
        <p>Click the card below to add a new income or expense transaction</p>
      </div>

      {!showForm ? (
        <div className="transaction-card" onClick={() => setShowForm(true)}>
          <div className="card-icon">
            <span>💰</span>
          </div>
          <div className="card-content">
            <h3>Add Transaction</h3>
            <p>Record a new income or expense</p>
          </div>
          <div className="card-arrow">
            <span>→</span>
          </div>
        </div>
      ) : (
        <div className="transaction-form-container">
          <div className="form-header">
            <h3>Transaction Details</h3>
            <button 
              type="button" 
              className="close-btn"
              onClick={() => {
                setShowForm(false);
                setMessage({ type: '', text: '' });
              }}
            >
              ✕
            </button>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="transaction-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Transaction Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="subclass">Category *</label>
                <select
                  id="subclass"
                  name="subclass"
                  value={formData.subclass}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {getSubclassOptionsForType().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="date">Date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {formData.type === 'expense' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method</label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter transaction description (optional)"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => {
                  setShowForm(false);
                  setMessage({ type: '', text: '' });
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-submit"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Transaction'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddTransaction;