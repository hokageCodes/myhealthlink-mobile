import Constants from 'expo-constants';

// For mobile devices, use your computer's local IP address
// Update this IP address if needed (find it with ipconfig on Windows or ifconfig on Mac/Linux)
export const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl 
  || 'http://192.168.0.141:5000';

export const API_VERSION = '/api';

