import axios from 'axios';
import { API_BASE_URL, API_VERSION } from '../constants/config';

// Public API client (no auth required)
const publicApiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}/public`,
  timeout: 10000,
});

export const publicProfileAPI = {
  // Get public profile by username
  getPublicProfile: async (username, token = null) => {
    const params = token ? { token } : {};
    const response = await publicApiClient.get(`/profile/${username}`, { params });
    return response.data;
  },

  // Verify password for password-protected profile
  verifyPassword: async (username, password) => {
    const response = await publicApiClient.post(`/profile/${username}/verify-password`, {
      password,
    });
    return response.data;
  },

  // Request OTP for OTP-protected profile
  requestOTP: async (username, email = null) => {
    const response = await publicApiClient.post(`/profile/${username}/request-otp`, {
      email,
    });
    return response.data;
  },

  // Verify OTP for OTP-protected profile
  verifyOTP: async (username, otp) => {
    const response = await publicApiClient.post(`/profile/${username}/verify-otp`, {
      otp,
    });
    return response.data;
  },

  // Get emergency profile (requires token from SOS event)
  getEmergencyProfile: async (username, token) => {
    const response = await publicApiClient.get(`/emergency/${username}`, {
      params: { token },
    });
    return response.data;
  },
};

