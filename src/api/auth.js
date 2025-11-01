import apiClient from './client';
import * as SecureStore from 'expo-secure-store';

export const authAPI = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  login: async (emailOrPhone, password, rememberMe = false) => {
    const response = await apiClient.post('/auth/login', {
      emailOrPhone,
      password,
      rememberMe,
    });
    
    if (response.data.success) {
      const { accessToken, refreshToken, user } = response.data.data;
      await SecureStore.setItemAsync('accessToken', accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      }
      await SecureStore.setItemAsync('userData', JSON.stringify(user));
    }
    
    return response.data;
  },

  verifyOTP: async (email, otp) => {
    const response = await apiClient.post('/auth/verify-otp', { email, otp });
    
    if (response.data.success) {
      const { accessToken, user } = response.data.data;
      await SecureStore.setItemAsync('accessToken', accessToken);
      if (user) {
        await SecureStore.setItemAsync('userData', JSON.stringify(user));
      }
    }
    
    return response.data;
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

