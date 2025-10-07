import api from './api';

const receiptService = {
  // Process receipt with OCR
  processReceiptOCR: async (receiptFile) => {
    try {
      const formData = new FormData();
      formData.append('receipt', receiptFile);

      console.log('Uploading receipt for OCR processing...');
      const response = await api.post('/expense-tracker/receipts/process-ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Receipt OCR response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error processing receipt OCR:', error);
      throw error;
    }
  },

  // Confirm and create transaction from receipt data
  confirmReceiptTransaction: async (receiptData) => {
    try {
      console.log('Confirming receipt transaction with data:', receiptData);
      const response = await api.post('/expense-tracker/receipts/confirm-transaction', receiptData);
      
      console.log('Receipt transaction confirmation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error confirming receipt transaction:', error);
      throw error;
    }
  },

  // Reject receipt processing
  rejectReceiptProcessing: async (tempFilePath, fileName, reason = 'User rejected') => {
    try {
      const response = await api.post('/expense-tracker/receipts/reject-processing', {
        tempFilePath,
        fileName,
        reason
      });

      console.log('Receipt rejection response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error rejecting receipt processing:', error);
      throw error;
    }
  },

  // Get receipt processing history
  getReceiptHistory: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/expense-tracker/receipts/history?page=${page}&limit=${limit}`);
      
      console.log('Receipt history response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching receipt history:', error);
      throw error;
    }
  }
};

export default receiptService;