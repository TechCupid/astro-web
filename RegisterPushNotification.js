import { Alert,Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api/apiClient';
const messaging = Platform.OS !== 'web' ? require('@react-native-firebase/messaging').default : null;
const { getApp } = Platform.OS !== 'web' ? require('@react-native-firebase/app') : { getApp: () => null };

// 🔄 Keep reference to avoid multiple refresh listeners
let tokenRefreshUnsubscribe = null;


// 🔹 Generate and cache FCM token early (before login/registration)
export async function initEarlyFCMToken() {
  if (Platform.OS === 'web') return null
  const buildVersion = "FCM_INIT_v3_2025_10_22_1830"; // 🕒 manually bump each build
  console.log(`🟢 initEarlyFCMToken() called — build version: ${buildVersion} — ${new Date().toISOString()}`);

  try {
    await messaging().registerDeviceForRemoteMessages();
    console.log("⚡ Firebase remote messages registered successfully.");

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('⚠️ Push permission not granted yet.');
      return null;
    }

    let token = await messaging().getToken();
    let retries = 0;
    while (!token && retries < 5) {
      retries++;
      console.warn(`🔁 Token null — retry ${retries}/5 in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
      token = await messaging().getToken();
    }

    if (token) {
      console.log(`✅ Pre-generated FCM token obtained: ${token}`);
      await AsyncStorage.setItem('preGenToken', token);
    } else {
      console.warn('🚫 Still no token after retries.');
    }

    return token;
  } catch (err) {
    console.error(`❌ Early FCM init failed: ${err.message}`);
    return null;
  }
}



export async function registerForPushNotificationsAsync(API_BASE_URL, forcedToken = null) {
  try {
    if (Platform.OS === 'web') {
    console.log("🌐 Web detected: Skipping push registration");
    return null;
  }
    // 🔐 Request permissions
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      Alert.alert('Permission denied', 'Push notification permission was not granted.');
      return null;
    }

    // ✅ Get token
   let token = forcedToken || (await messaging().getToken());
let retryCount = 0;

// 🔄 Retry logic if null or empty
while (!token && retryCount < 3) {
  const wait = 2000 * (retryCount + 1); // 2s, then 4s, then 6s
  console.warn(`⚠️ Token null, retrying in ${wait/1000}s...`);
await new Promise(resolve => setTimeout(resolve, 1200));

  token = await messaging().getToken();
  retryCount++;
}


if (!token) {
  console.warn('🚫 FCM token still null after retries');
  return null;
}

console.log('✅ Final FCM Token:', token);


    await AsyncStorage.setItem('genToken', token);

    // ✅ Send to backend
    if (API_BASE_URL) {
      await updateBackendToken(API_BASE_URL, token);
    }

    // 🔄 Refresh token (make sure only one listener is active)
    if (tokenRefreshUnsubscribe) {
      tokenRefreshUnsubscribe(); // remove old listener
    }

    tokenRefreshUnsubscribe = messaging().onTokenRefresh(async newToken => {
      console.log('🔄 Token refreshed:', newToken);
      if (!newToken) {
        console.warn('⚠️ Received empty refreshed token, skipping update');
        return;
      }
      await AsyncStorage.setItem('genToken', newToken);
      if (API_BASE_URL) await updateBackendToken(API_BASE_URL, newToken);
    });

    return token;
  } catch (err) {
    console.error('❌ Push registration error:', err.message);
    return null;
  }
}

async function updateBackendToken(API_BASE_URL, token) {
  try {
    if (!token || token === "null" || token.trim().length < 20) {
  console.warn('🚫 Invalid FCM token (null or malformed), backend update skipped.');
  return;
}

   const appFor = 'ASTRO'; // 🔥 fixed for astrologer app


    if (appFor === 'ASTRO') {
      const astroMobile = await AsyncStorage.getItem('astroMobile');
      if (astroMobile) {
        await api.post(`${API_BASE_URL}/api/astrologers/updateFcmToken`, {
        astroId: astroMobile,
        fcmToken: token,
      });
        console.log('✅ Astro token updated to backend');
      }
    } else if (appFor === 'CUST') {
      const mobileNumber = await AsyncStorage.getItem('mobileNumber');
      if (mobileNumber) {
        await api.post(`${API_BASE_URL}/api/customers/updateFcmToken`, {
          custId: mobileNumber,
          fcmToken: token,
        });
        console.log(`✅ Customer token updated for custId=${mobileNumber}`);
      } else {
        console.warn('⚠️ No mobileNumber found in storage, token not sent');
      }
    } else {
      console.warn('⚠️ Unknown APP_FOR, token not updated to backend');
    }
  } catch (err) {
    console.error('❌ Failed to update backend token:', err.response?.data || err.message || err);
  }
}
