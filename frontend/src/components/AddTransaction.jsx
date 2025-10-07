import React, { useState, useEffect } from 'react';
import transactionService from '../services/transactionService';
import receiptService from '../services/receiptService';
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
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  
  // Receipt-specific state
  const [receiptFile, setReceiptFile] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptMessage, setReceiptMessage] = useState({ type: '', text: '' });
  const [showReceiptForm, setShowReceiptForm] = useState(false);

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

  // Receipt handling functions
  const handleReceiptFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setReceiptMessage({ type: 'error', text: 'Please select an image file (JPG, PNG, GIF)' });
        return;
      }
      
      // Validate file size (max 15MB for better user experience)
      if (file.size > 15 * 1024 * 1024) {
        setReceiptMessage({ type: 'error', text: 'File size must be less than 15MB. Please choose a smaller image or compress it.' });
        return;
      }

      setReceiptFile(file);
      setReceiptMessage({ type: '', text: '' });
    }
  };

  const handleReceiptUpload = async () => {
    if (!receiptFile) {
      setReceiptMessage({ type: 'error', text: 'Please select a receipt file' });
      return;
    }

    setReceiptLoading(true);
    setReceiptMessage({ type: '', text: '' });

    try {
      const response = await receiptService.processReceiptOCR(receiptFile);
      
      if (response.success) {
        setOcrResult(response.data);
        setShowReceiptForm(true);
        setReceiptMessage({ type: 'success', text: 'Receipt processed successfully! Please review the data below.' });
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      
      let errorMessage = 'Failed to process receipt';
      
      if (error.response?.status === 413) {
        errorMessage = 'File too large. Please choose an image smaller than 15MB.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid file format or size';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setReceiptMessage({ type: 'error', text: errorMessage });
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleReceiptConfirm = async () => {
    if (!ocrResult?.extractedData) {
      setReceiptMessage({ type: 'error', text: 'No receipt data to confirm' });
      return;
    }

    setReceiptLoading(true);
    setReceiptMessage({ type: '', text: '' });

    try {
      const confirmData = {
        merchant: ocrResult.extractedData.merchant,
        date: ocrResult.extractedData.date,
        amount: ocrResult.extractedData.amount,
        description: ocrResult.extractedData.description,
        subclass: ocrResult.extractedData.subclass,
        paymentMethod: 'other',
        tempFilePath: ocrResult.extractedData.tempFilePath,
        fileName: ocrResult.extractedData.fileName,
        originalName: ocrResult.extractedData.originalName,
        fileSize: ocrResult.extractedData.fileSize
      };

      const response = await receiptService.confirmReceiptTransaction(confirmData);
      
      if (response.success) {
        setReceiptMessage({ type: 'success', text: 'Transaction created successfully from receipt!' });
        // Reset receipt state
        setTimeout(() => {
          setShowReceiptUpload(false);
          setShowReceiptForm(false);
          setOcrResult(null);
          setReceiptFile(null);
          setReceiptMessage({ type: '', text: '' });
        }, 2000);
      }
    } catch (error) {
      console.error('Error confirming receipt transaction:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create transaction from receipt';
      setReceiptMessage({ type: 'error', text: errorMessage });
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleReceiptReject = async () => {
    if (!ocrResult?.extractedData) {
      setReceiptMessage({ type: 'error', text: 'No receipt data to reject' });
      return;
    }

    try {
      await receiptService.rejectReceiptProcessing(
        ocrResult.extractedData.tempFilePath,
        ocrResult.extractedData.fileName,
        'User rejected the extracted data'
      );
      
      setReceiptMessage({ type: 'info', text: 'Receipt processing cancelled' });
      // Reset receipt state
      setTimeout(() => {
        setShowReceiptUpload(false);
        setShowReceiptForm(false);
        setOcrResult(null);
        setReceiptFile(null);
        setReceiptMessage({ type: '', text: '' });
      }, 1500);
    } catch (error) {
      console.error('Error rejecting receipt:', error);
      setReceiptMessage({ type: 'error', text: 'Failed to cancel receipt processing' });
    }
  };

  const handleReceiptDataChange = (field, value) => {
    setOcrResult(prev => ({
      ...prev,
      extractedData: {
        ...prev.extractedData,
        [field]: value
      }
    }));
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
        <p>Choose how you want to add your transaction</p>
      </div>

      {!showForm && !showReceiptUpload ? (
        <div className="transaction-options">
          {/* Manual Transaction Card */}
          <div className="transaction-card" onClick={() => setShowForm(true)}>
            <div className="card-icon">
              <span>💰</span>
            </div>
            <div className="card-content">
              <h3>Manual Entry</h3>
              <p>Add transaction details manually</p>
            </div>
            <div className="card-arrow">
              <span>→</span>
            </div>
          </div>

          {/* Receipt Upload Card */}
          <div className="transaction-card receipt-card" onClick={() => setShowReceiptUpload(true)}>
            <div className="card-icon">
              <span>📄</span>
            </div>
            <div className="card-content">
              <h3>Upload Receipt</h3>
              <p>Scan receipt and auto-fill details</p>
            </div>
            <div className="card-arrow">
              <span>→</span>
            </div>
          </div>
        </div>
      ) : showForm ? (
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
      ) : (
        // Receipt Upload Section
        <div className="receipt-upload-container">
          <div className="form-header">
            <h3>Upload Receipt</h3>
            <button 
              type="button" 
              className="close-btn"
              onClick={() => {
                setShowReceiptUpload(false);
                setShowReceiptForm(false);
                setOcrResult(null);
                setReceiptFile(null);
                setReceiptMessage({ type: '', text: '' });
              }}
            >
              ✕
            </button>
          </div>

          {receiptMessage.text && (
            <div className={`message ${receiptMessage.type}`}>
              {receiptMessage.text}
            </div>
          )}

          {!showReceiptForm ? (
            // File Upload Section
            <div className="receipt-upload-section">
              <div className="upload-area">
                <div className="upload-icon">📷</div>
                <h4>Upload Receipt Image</h4>
                <p>Supported formats: JPG, PNG, GIF (Max 15MB)</p>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptFileChange}
                  className="file-input"
                  id="receipt-file"
                />
                <label htmlFor="receipt-file" className="file-label">
                  Choose File
                </label>
                
                {receiptFile && (
                  <div className="file-selected">
                    <span className="file-name">{receiptFile.name}</span>
                    <span className="file-size">
                      ({(receiptFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                )}
              </div>

              <div className="upload-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => {
                    setShowReceiptUpload(false);
                    setReceiptFile(null);
                    setReceiptMessage({ type: '', text: '' });
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-submit"
                  onClick={handleReceiptUpload}
                  disabled={!receiptFile || receiptLoading}
                >
                  {receiptLoading ? 'Processing...' : 'Process Receipt'}
                </button>
              </div>
            </div>
          ) : (
            // OCR Result Review Section
            <div className="receipt-review-section">
              <h4>Review Extracted Data</h4>
              <p>Please verify the information below and make any necessary changes:</p>

              <div className="extracted-data-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="receipt-merchant">Merchant</label>
                    <input
                      type="text"
                      id="receipt-merchant"
                      value={ocrResult?.extractedData?.merchant || ''}
                      onChange={(e) => handleReceiptDataChange('merchant', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="receipt-amount">Amount</label>
                    <input
                      type="number"
                      id="receipt-amount"
                      value={ocrResult?.extractedData?.amount || ''}
                      onChange={(e) => handleReceiptDataChange('amount', parseFloat(e.target.value))}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="receipt-date">Date</label>
                    <input
                      type="date"
                      id="receipt-date"
                      value={ocrResult?.extractedData?.date || ''}
                      onChange={(e) => handleReceiptDataChange('date', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="receipt-subclass">Category</label>
                    <select
                      id="receipt-subclass"
                      value={ocrResult?.extractedData?.subclass || ''}
                      onChange={(e) => handleReceiptDataChange('subclass', e.target.value)}
                    >
                      {ocrResult?.availableSubclasses?.map(subclass => (
                        <option key={subclass} value={subclass}>
                          {subclass.charAt(0).toUpperCase() + subclass.slice(1).replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="receipt-description">Description</label>
                  <textarea
                    id="receipt-description"
                    value={ocrResult?.extractedData?.description || ''}
                    onChange={(e) => handleReceiptDataChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                {ocrResult?.extractedData?.items && ocrResult.extractedData.items.length > 0 && (
                  <div className="receipt-items">
                    <h5>Detected Items:</h5>
                    <div className="items-list">
                      {ocrResult.extractedData.items.map((item, index) => (
                        <div key={index} className="item-row">
                          <span className="item-name">{item.name}</span>
                          <span className="item-qty">Qty: {item.qty}</span>
                          <span className="item-price">${item.price}</span>
                          <span className="item-category">{item.category}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="receipt-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={handleReceiptReject}
                  disabled={receiptLoading}
                >
                  Reject
                </button>
                <button 
                  type="button" 
                  className="btn-submit"
                  onClick={handleReceiptConfirm}
                  disabled={receiptLoading}
                >
                  {receiptLoading ? 'Creating...' : 'Add to Transactions'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddTransaction;