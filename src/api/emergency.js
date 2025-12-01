import apiClient from './client';

export const emergencyAPI = {
  // Trigger SOS emergency
  triggerSOS: async (sosData = {}) => {
    const response = await apiClient.post('/emergency/sos', sosData);
    return response.data;
  },

  // Get emergency events
  getEmergencyEvents: async (params = {}) => {
    const response = await apiClient.get('/emergency/events', { params });
    return response.data;
  },

  // Resolve emergency event
  resolveEmergencyEvent: async (eventId) => {
    const response = await apiClient.patch(`/emergency/events/${eventId}/resolve`);
    return response.data;
  },
};

