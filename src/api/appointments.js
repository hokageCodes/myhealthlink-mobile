import apiClient from './client';

export const appointmentsAPI = {
  // Get all appointments
  getAppointments: async (params = {}) => {
    const response = await apiClient.get('/appointments', { params });
    return response.data;
  },

  // Get single appointment
  getAppointment: async (id) => {
    const response = await apiClient.get(`/appointments/${id}`);
    return response.data;
  },

  // Create appointment
  createAppointment: async (appointmentData) => {
    const response = await apiClient.post('/appointments', appointmentData);
    return response.data;
  },

  // Update appointment
  updateAppointment: async (id, appointmentData) => {
    const response = await apiClient.put(`/appointments/${id}`, appointmentData);
    return response.data;
  },

  // Delete appointment
  deleteAppointment: async (id) => {
    const response = await apiClient.delete(`/appointments/${id}`);
    return response.data;
  },

  // Get upcoming appointments
  getUpcomingAppointments: async (limit = 5) => {
    const response = await apiClient.get('/appointments/upcoming', {
      params: { limit },
    });
    return response.data;
  },
};

