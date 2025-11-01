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
  
  // For Android emulator, use special IP to access host machine's localhost
  if (Platform.OS === 'android') {
    // Try emulator localhost first, then fallback to network IP
    return __DEV__ ? 'http://10.0.2.2:5000' : 'http://192.168.0.141:5000';
  }
  
  // For iOS simulator or web, use localhost
  if (Platform.OS === 'ios' || Platform.OS === 'web') {
    return __DEV__ ? 'http://localhost:5000' : 'http://192.168.0.141:5000';
  }
  
  // Default fallback
  return 'http://192.168.0.141:5000';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_VERSION = '/api';

// Log API URL for debugging (only in dev)
if (__DEV__) {
  console.log('[API Config] Platform:', Platform.OS);
  console.log('[API Config] API Base URL:', API_BASE_URL);
  console.log('[API Config] Full API URL:', `${API_BASE_URL}${API_VERSION}`);
}

