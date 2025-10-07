import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Edit, Trash2, DollarSign } from 'lucide-react';
import statementService from '../services/statementService';
import './AddStatement.css';

const AddStatement = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingTransactions, setEditingTransactions] = useState([]);

  // Available transaction subclasses
  const incomeSubclasses = [
    'salary', 'freelance', 'business_income', 'dividends', 'interest', 
    'rental_income', 'bonus', 'other_income'
  ];
  
  const expenseSubclasses = [
    'groceries', 'food_dining', 'transportation', 'fuel', 'utilities', 
    'rent', 'insurance', 'healthcare', 'clothing', 'entertainment', 
    'shopping', 'education', 'other_expenses'
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError('');
    setSuccess('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    setUploading(true);
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      // Get user ID from localStorage (assuming it's stored there)
      const userString = localStorage.getItem('user');
      if (!userString) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(userString);
      const userId = user.id || user._id;

      if (!userId) {
        throw new Error('User ID not found');
      }

      // Process statement with OCR
      const response = await statementService.processStatementOCR(file, userId);
      
      if (response.success) {
        setExtractedData(response.data.extractedData);
        setEditingTransactions(response.data.extractedData.transactions);
        setShowReviewModal(true);
        setSuccess('Statement processed successfully! Please review the extracted transactions.');
      } else {
        setError(response.message || 'Failed to process statement');
      }
    } catch (error) {
      console.error('Error uploading statement:', error);
      setError(error.response?.data?.message || error.message || 'Failed to process statement');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleTransactionEdit = (index, field, value) => {
    const updatedTransactions = [...editingTransactions];
    updatedTransactions[index] = {
      ...updatedTransactions[index],
      [field]: value
    };
    setEditingTransactions(updatedTransactions);
  };

  const handleRemoveTransaction = (index) => {
    const updatedTransactions = editingTransactions.filter((_, i) => i !== index);
    setEditingTransactions(updatedTransactions);
  };

  const handleConfirmTransactions = async () => {
    if (editingTransactions.length === 0) {
      setError('No transactions to confirm');
      return;
    }

    setProcessing(true);
    try {
      const userString = localStorage.getItem('user');
      const user = JSON.parse(userString);
      const userId = user.id || user._id;

      const confirmationData = {
        userId: userId,
        transactions: editingTransactions,
        statementInfo: extractedData.statementInfo,
        tempFilePath: extractedData.fileInfo.path,
        fileName: extractedData.fileInfo.filename,
        originalName: extractedData.fileInfo.originalName,
        fileSize: extractedData.fileInfo.size
      };

      const response = await statementService.confirmStatementTransactions(confirmationData);
      
      if (response.success) {
        setSuccess(`Successfully created ${response.data.summary.totalCreated} transactions!`);
        setShowReviewModal(false);
        setFile(null);
        setExtractedData(null);
        setEditingTransactions([]);
      } else {
        setError(response.message || 'Failed to confirm transactions');
      }
    } catch (error) {
      console.error('Error confirming transactions:', error);
      setError(error.response?.data?.message || 'Failed to confirm transactions');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectProcessing = async () => {
    if (!extractedData) return;

    try {
      const rejectionData = {
        tempFilePath: extractedData.fileInfo.path,
        fileName: extractedData.fileInfo.filename,
        reason: 'User rejected extracted data'
      };

      await statementService.rejectStatementProcessing(rejectionData);
      
      setShowReviewModal(false);
      setFile(null);
      setExtractedData(null);
      setEditingTransactions([]);
      setSuccess('Statement processing cancelled successfully');
    } catch (error) {
      console.error('Error rejecting processing:', error);
      setError('Failed to cancel processing');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const resetUpload = () => {
    setFile(null);
    setError('');
    setSuccess('');
    setExtractedData(null);
    setEditingTransactions([]);
    setShowReviewModal(false);
  };

  const handleUploadAreaClick = () => {
    if (!file && !uploading) {
      document.getElementById('statement-file-input').click();
    }
  };

  return (
    <div className="add-statement">
      <div className="add-statement-header">
        <h2>Upload Bank Statement</h2>
        <p>Upload a PDF bank statement to automatically extract transactions</p>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="message error">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-btn">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="message success">
          <CheckCircle size={20} />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="close-btn">
            <X size={16} />
          </button>
        </div>
      )}

      {/* File Upload Area */}
      <div className="upload-section">
        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleUploadAreaClick}
          style={{ cursor: !file && !uploading ? 'pointer' : 'default' }}
        >
          {!file ? (
            <>
              <Upload size={48} className="upload-icon" />
              <h3>Drop your PDF statement here</h3>
              <p>or click to browse files</p>
              <input
                type="file"
                id="statement-file-input"
                accept=".pdf"
                onChange={handleFileInputChange}
                className="file-input"
                disabled={uploading}
              />
              <div className="file-requirements">
                <p>• PDF files only</p>
                <p>• Maximum size: 10MB</p>
                <p>• Bank statements with transaction history</p>
              </div>
            </>
          ) : (
            <div className="file-selected">
              <FileText size={48} className="file-icon" />
              <div className="file-info">
                <h3>{file.name}</h3>
                <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={resetUpload} className="remove-file-btn" disabled={uploading}>
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        {file && !showReviewModal && (
          <div className="upload-actions">
            <button
              onClick={handleUpload}
              disabled={uploading || processing}
              className="upload-btn"
            >
              {processing ? (
                <>
                  <div className="spinner"></div>
                  Processing with OCR...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Process Statement
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Transaction Review Modal */}
      {showReviewModal && extractedData && (
        <div className="modal-overlay">
          <div className="review-modal">
            <div className="modal-header">
              <h3>Review Extracted Transactions</h3>
              <button onClick={handleRejectProcessing} className="close-btn">
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {/* Statement Info */}
              <div className="statement-info">
                <h4>Statement Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Account Number:</label>
                    <span>{extractedData.statementInfo.accountNumber}</span>
                  </div>
                  <div className="info-item">
                    <label>Period:</label>
                    <span>{extractedData.statementInfo.period}</span>
                  </div>
                  <div className="info-item">
                    <label>Opening Balance:</label>
                    <span>{formatCurrency(extractedData.statementInfo.openingBalance)}</span>
                  </div>
                  <div className="info-item">
                    <label>Closing Balance:</label>
                    <span>{formatCurrency(extractedData.statementInfo.closingBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Processing Results */}
              <div className="processing-results">
                <h4>Processing Results</h4>
                <div className="results-grid">
                  <div className="result-item">
                    <DollarSign size={16} />
                    <span>Income: {extractedData.processingResults.incomeCount}</span>
                  </div>
                  <div className="result-item">
                    <DollarSign size={16} />
                    <span>Expenses: {extractedData.processingResults.expenseCount}</span>
                  </div>
                  <div className="result-item">
                    <FileText size={16} />
                    <span>Total: {editingTransactions.length}</span>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="transactions-section">
                <h4>Transactions ({editingTransactions.length})</h4>
                <div className="transactions-table-container">
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingTransactions.map((transaction, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="date"
                              value={transaction.date}
                              onChange={(e) => handleTransactionEdit(index, 'date', e.target.value)}
                              className="table-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={transaction.description}
                              onChange={(e) => handleTransactionEdit(index, 'description', e.target.value)}
                              className="table-input"
                            />
                          </td>
                          <td>
                            <select
                              value={transaction.type}
                              onChange={(e) => {
                                handleTransactionEdit(index, 'type', e.target.value);
                                // Reset subclass when type changes
                                const defaultSubclass = e.target.value === 'income' ? 'other_income' : 'other_expenses';
                                handleTransactionEdit(index, 'subclass', defaultSubclass);
                              }}
                              className="table-select"
                            >
                              <option value="income">Income</option>
                              <option value="expense">Expense</option>
                            </select>
                          </td>
                          <td>
                            <select
                              value={transaction.subclass}
                              onChange={(e) => handleTransactionEdit(index, 'subclass', e.target.value)}
                              className="table-select"
                            >
                              {(transaction.type === 'income' ? incomeSubclasses : expenseSubclasses).map(subclass => (
                                <option key={subclass} value={subclass}>
                                  {subclass.replace(/_/g, ' ')}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={transaction.amount}
                              onChange={(e) => handleTransactionEdit(index, 'amount', parseFloat(e.target.value) || 0)}
                              className="table-input amount-input"
                            />
                          </td>
                          <td>
                            <button
                              onClick={() => handleRemoveTransaction(index)}
                              className="remove-transaction-btn"
                              title="Remove transaction"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={handleRejectProcessing}
                className="cancel-btn"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTransactions}
                className="confirm-btn"
                disabled={processing || editingTransactions.length === 0}
              >
                {processing ? (
                  <>
                    <div className="spinner"></div>
                    Creating Transactions...
                  </>
                ) : (
                  `Confirm ${editingTransactions.length} Transactions`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddStatement;