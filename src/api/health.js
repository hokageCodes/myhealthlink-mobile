import apiClient from './client';

export const healthAPI = {
  // Get health metrics
  getMetrics: async (params = {}) => {
    const response = await apiClient.get('/health/metrics', { params });
    return response.data;
  },

  // Add health metric
  addMetric: async (metricData) => {
    const response = await apiClient.post('/health/metrics', metricData);
    return response.data;
  },

  // Update health metric
  updateMetric: async (id, metricData) => {
    const response = await apiClient.put(`/health/metrics/${id}`, metricData);
    return response.data;
  },

  // Delete health metric
  deleteMetric: async (id) => {
    const response = await apiClient.delete(`/health/metrics/${id}`);
    return response.data;
  },

  // Get health summary
  getSummary: async (days = 30) => {
    const response = await apiClient.get('/health/summary', {
      params: { days },
    });
    return response.data;
  },
};

