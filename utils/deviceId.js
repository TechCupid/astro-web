import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Platform } from 'react-native'; // ✅ Added Platform import

export const getOrCreateDeviceId = async () => {
  // 1. Check if we already have a stored ID
  let deviceId = await AsyncStorage.getItem('DEVICE_ID');

  if (deviceId) {
    console.log('📱 DEVICE ID (stored) →', deviceId);
    return deviceId;
  }

  // 2. Handle Web specifically to prevent the "UnavailabilityError"
  if (Platform.OS === 'web') {
    deviceId = `WEB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🌐 DEVICE ID (web generated) →', deviceId);
    await AsyncStorage.setItem('DEVICE_ID', deviceId);
    return deviceId;
  }

  // 3. Mobile logic (Android/iOS)
  let androidId = null;

  try {
    // Only call getAndroidId if it exists (it won't on iOS or Web)
    if (Platform.OS === 'android' && Application.getAndroidId) {
      androidId = await Application.getAndroidId();
    }
  } catch (e) {
    console.warn('⚠️ Could not fetch Android ID:', e);
  }

  // 4. Fallback logic
  deviceId =
    androidId ||
    Application.applicationId ||
    `${Date.now()}-${Math.random()}`;

  console.log('📱 DEVICE ID (new mobile) →', deviceId);

  await AsyncStorage.setItem('DEVICE_ID', deviceId);
  return deviceId;
};