import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const api = axios.create({
  timeout: 10000, // 10 seconds timeout for real-world stability
});

/**
 * Dynamically updates the base URL.
 * Called from ApiContext.js when the app starts or IP changes.
 */
export const setApiBaseUrl = (baseURL) => {
  api.defaults.baseURL = baseURL;
  console.log('🌐 API Base URL set to:', baseURL);
};

/**
 * Request Interceptor:
 * Automatically attaches the JWT Token and the X-DEVICE-ID to every outgoing request.
 */
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. Retrieve Token and Device ID from AsyncStorage (Works for Web & Mobile)
      let token = await AsyncStorage.getItem('ASTRO_JWT');
      let deviceId = await AsyncStorage.getItem('DEVICE_ID');

      // 2. Generate Device ID if it doesn't exist (First time login)
      if (!deviceId) {
        if (Platform.OS === 'web' && typeof crypto !== 'undefined' && crypto.randomUUID) {
          deviceId = `WEB-${crypto.randomUUID()}`;
        } else {
          // Fallback for older browsers or mobile
          deviceId = `APP-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
        }
        await AsyncStorage.setItem('DEVICE_ID', deviceId);
        console.log('📱 New Device ID Generated:', deviceId);
      }

      // 3. Attach Bearer Token for protected routes
      // ✅ Correct this block in apiClient.js
if (token && token !== "null" && token !== "") { 
    config.headers.Authorization = `Bearer ${token}`;
} else {
    // 🛡️ CRITICAL: If no token, do NOT send the header at all.
    delete config.headers.Authorization; 
}

      // 4. Attach X-DEVICE-ID for the JwtAuthFilter security check
      // We don't overwrite it if it's already manually set in the request
      if (deviceId && !config.headers['X-DEVICE-ID']) {
        config.headers['X-DEVICE-ID'] = deviceId;
      }

    } catch (err) {
      console.error('🚨 Interceptor Error:', err);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor:
 * Handles global errors like 401 (Unauthorized) or 403 (Forbidden)
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('⚠️ Session expired or unauthorized. Cleaning up...');
      // Option: You can trigger a logout or redirect here if needed
      // await AsyncStorage.removeItem('ASTRO_JWT'); 
    }
    return Promise.reject(error);
  }
);

export default api;