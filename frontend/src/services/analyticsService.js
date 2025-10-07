import api from './api';

const analyticsService = {
  // Get balance overview (total income, total expenses, net balance)
  getBalanceOverview: async (startDate = null, endDate = null) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const queryString = params.toString();
      const url = `/expense-tracker/analytics/balance${queryString ? `?${queryString}` : ''}`;
      
      console.log('Calling balance API:', url);
      const response = await api.get(url);
      console.log('Balance API response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching balance overview:', error);
      throw error;
    }
  },

  // Get category analytics for pie charts
  getCategoryAnalytics: async (type, startDate = null, endDate = null) => {
    try {
      const params = new URLSearchParams();
      params.append('type', type); // 'income' or 'expense'
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `/expense-tracker/analytics/category?${params.toString()}`;
      
      console.log(`Calling category analytics API for ${type}:`, url);
      const response = await api.get(url);
      console.log(`Category analytics response for ${type}:`, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching category analytics for ${type}:`, error);
      throw error;
    }
  },

  // Get timeline analytics (optional for future use)
  getTimelineAnalytics: async (period = 'daily', type = null, startDate = null, endDate = null) => {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (type) params.append('type', type);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `/expense-tracker/analytics/timeline?${params.toString()}`;
      
      console.log('Calling timeline analytics API:', url);
      const response = await api.get(url);
      console.log('Timeline analytics response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching timeline analytics:', error);
      throw error;
    }
  },

  // Get subclass options (for reference)
  getSubclassOptions: async () => {
    try {
      console.log('Calling subclass options API');
      const response = await api.get('/expense-tracker/analytics/subclasses');
      console.log('Subclass options response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching subclass options:', error);
      throw error;
    }
  }
};

export default analyticsService;