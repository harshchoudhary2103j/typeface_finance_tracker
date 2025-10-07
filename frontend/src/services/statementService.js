import api from './api';

const statementService = {
  // Process statement PDF with OCR
  processStatementOCR: async (statementFile, userId) => {
    try {
      const formData = new FormData();
      formData.append('statement', statementFile);
      formData.append('userId', userId);

      console.log('Uploading statement for OCR processing...');
      const response = await api.post('/expense-tracker/statements/process-ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Statement OCR response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error processing statement OCR:', error);
      throw error;
    }
  },

  // Confirm and create transactions from statement data
  confirmStatementTransactions: async (statementData) => {
    try {
      console.log('Confirming statement transactions with data:', statementData);
      const response = await api.post('/expense-tracker/statements/confirm-transactions', statementData);
      
      console.log('Statement transactions confirmed:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error confirming statement transactions:', error);
      throw error;
    }
  },

  // Reject statement processing and clean up temp file
  rejectStatementProcessing: async (rejectionData) => {
    try {
      console.log('Rejecting statement processing:', rejectionData);
      const response = await api.post('/expense-tracker/statements/reject-processing', rejectionData);
      
      console.log('Statement processing rejected:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error rejecting statement processing:', error);
      throw error;
    }
  },

  // Get statement processing history
  getStatementHistory: async (page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const response = await api.get(`/expense-tracker/statements/history?${params.toString()}`);
      
      console.log('Statement history retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching statement history:', error);
      throw error;
    }
  }
};

export default statementService;