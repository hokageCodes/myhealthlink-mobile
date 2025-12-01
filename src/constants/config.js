import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get API URL from config or use default
// For Android emulator: use 10.0.2.2 to access localhost on host machine
// For iOS simulator: use localhost or your local IP
// For physical devices: use your computer's local IP address
const getApiBaseUrl = () => {
  // Check if API URL is set in expo config
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }
  
  // Check if we're in development mode
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
  
  // For Android emulator, use special IP to access host machine's localhost
  if (Platform.OS === 'android') {
    // Try emulator localhost first, then fallback to network IP
    return isDev ? 'http://10.0.2.2:5000' : 'http://192.168.0.141:5000';
  }
  
  // For iOS simulator or web, use localhost
  // Note: Physical iOS devices must use LAN IP, not localhost
  if (Platform.OS === 'ios') {
    // Use LAN IP for physical devices, localhost only works for simulator
    return isDev ? 'http://192.168.0.141:5000' : 'http://192.168.0.141:5000';
  }
  
  // Web platform can use localhost
  if (Platform.OS === 'web') {
    return isDev ? 'http://localhost:5000' : 'http://192.168.0.141:5000';
  }
  
  // Default fallback
  return 'http://192.168.0.141:5000';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_VERSION = '/api';

// Get Frontend URL for share links
const getFrontendBaseUrl = () => {
  // Check if FRONTEND URL is set in expo config
  if (Constants.expoConfig?.extra?.frontendUrl) {
    return Constants.expoConfig.extra.frontendUrl;
  }
  
  // Check if we're in development mode
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
  
  // For Android emulator, use special IP to access host machine
  if (Platform.OS === 'android') {
    return isDev ? 'http://10.0.2.2:3000' : 'https://yourdomain.com';
  }
  
  // For iOS simulator or web, use localhost
  // Note: Physical iOS devices must use LAN IP, not localhost
  if (Platform.OS === 'ios') {
    // Use LAN IP for physical devices, localhost only works for simulator
    return isDev ? 'http://192.168.0.141:3000' : 'https://yourdomain.com';
  }
  
  // Web platform can use localhost
  if (Platform.OS === 'web') {
    return isDev ? 'http://localhost:3000' : 'https://yourdomain.com';
  }
  
  // Default fallback - use local network IP for dev
  return isDev ? 'http://192.168.0.141:3000' : 'https://yourdomain.com';
};

export const FRONTEND_BASE_URL = getFrontendBaseUrl();

// Log URLs for debugging (only in dev)
if (__DEV__) {
  console.log('[API Config] Platform:', Platform.OS);
  console.log('[API Config] API Base URL:', API_BASE_URL);
  console.log('[API Config] Frontend Base URL:', FRONTEND_BASE_URL);
  console.log('[API Config] Full API URL:', `${API_BASE_URL}${API_VERSION}`);
}

