import apiClient from './client';

export const medicationsAPI = {
  // Get all medications
  getMedications: async (params = {}) => {
    const response = await apiClient.get('/medications', { params });
    return response.data;
  },

  // Get single medication
  getMedication: async (id) => {
    const response = await apiClient.get(`/medications/${id}`);
    return response.data;
  },

  // Create medication
  createMedication: async (medicationData) => {
    const response = await apiClient.post('/medications', medicationData);
    return response.data;
  },

  // Alias for createMedication
  addMedication: async (medicationData) => {
    const response = await apiClient.post('/medications', medicationData);
    return response.data;
  },

  // Update medication
  updateMedication: async (id, medicationData) => {
    const response = await apiClient.put(`/medications/${id}`, medicationData);
    return response.data;
  },

  // Delete medication
  deleteMedication: async (id) => {
    const response = await apiClient.delete(`/medications/${id}`);
    return response.data;
  },

  // Get active medications
  getActiveMedications: async () => {
    const response = await apiClient.get('/medications/active');
    return response.data;
  },

  // Log medication intake
  logIntake: async (medicationId, data = {}) => {
    const response = await apiClient.post(`/medications/${medicationId}/log`, data);
    return response.data;
  },

  // Get medication adherence
  getAdherence: async (medicationId, days = 30) => {
    const response = await apiClient.get(`/medications/${medicationId}/adherence`, {
      params: { days },
    });
    return response.data;
  },

  // Get missed medications
  getMissedMedications: async (days = 7) => {
    const response = await apiClient.get('/medications/missed', {
      params: { days },
    });
    return response.data;
  },
};

