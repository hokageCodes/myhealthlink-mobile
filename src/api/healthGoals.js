import apiClient from './client';

export const healthGoalsAPI = {
  // Get all health goals
  getGoals: async (params = {}) => {
    const response = await apiClient.get('/health-goals', { params });
    return response.data;
  },

  // Get single health goal
  getGoal: async (id) => {
    const response = await apiClient.get(`/health-goals/${id}`);
    return response.data;
  },

  // Create health goal
  createGoal: async (goalData) => {
    const response = await apiClient.post('/health-goals', goalData);
    return response.data;
  },

  // Update health goal
  updateGoal: async (id, goalData) => {
    const response = await apiClient.put(`/health-goals/${id}`, goalData);
    return response.data;
  },

  // Delete health goal
  deleteGoal: async (id) => {
    const response = await apiClient.delete(`/health-goals/${id}`);
    return response.data;
  },

  // Add milestone to goal
  addMilestone: async (goalId, milestoneData) => {
    const response = await apiClient.post(`/health-goals/${goalId}/milestones`, milestoneData);
    return response.data;
  },
};

