import apiClient from './client';
import * as SecureStore from 'expo-secure-store';

export const authAPI = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  login: async (emailOrPhone, password, rememberMe = false) => {
    try {
      const response = await apiClient.post('/auth/login', {
        emailOrPhone,
        password,
        rememberMe,
      });
      
      if (response.data && response.data.success) {
        const data = response.data.data || {};
        const { accessToken, refreshToken, user } = data;
        
        if (!accessToken) {
          throw new Error('No access token received from server');
        }
        
        await SecureStore.setItemAsync('accessToken', accessToken);
        if (refreshToken) {
          await SecureStore.setItemAsync('refreshToken', refreshToken);
        }
        if (user) {
          await SecureStore.setItemAsync('userData', JSON.stringify(user));
        }
      }
      
      return response.data;
    } catch (error) {
      // Re-throw with better error message
      if (error.response) {
        // Server responded with error
        throw error;
      } else if (error.request) {
        // Request made but no response
        throw new Error('Cannot connect to server. Please check your network and API URL.');
      } else {
        // Something else
        throw error;
      }
    }
  },

  verifyOTP: async (email, otp) => {
    try {
      const response = await apiClient.post('/auth/verify-otp', { email, otp });
      
      if (response.data && response.data.success) {
        const data = response.data.data || {};
        const { accessToken, refreshToken, user } = data;
        
        if (!accessToken) {
          throw new Error('No access token received from server');
        }
        
        await SecureStore.setItemAsync('accessToken', accessToken);
        if (refreshToken) {
          await SecureStore.setItemAsync('refreshToken', refreshToken);
        }
        if (user) {
          await SecureStore.setItemAsync('userData', JSON.stringify(user));
        }
      }
      
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error;
      } else if (error.request) {
        throw new Error('Cannot connect to server. Please check your network and API URL.');
      } else {
        throw error;
      }
    }
  },

  resendOTP: async (email) => {
    const response = await apiClient.post('/auth/resend-otp', { email });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('userData');
    }
  },

  isAuthenticated: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    return !!token;
  },

  getUserData: async () => {
    const userDataString = await SecureStore.getItemAsync('userData');
    return userDataString ? JSON.parse(userDataString) : null;
  },
};

