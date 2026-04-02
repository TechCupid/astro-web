import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Request user permission for notifications
 */
export const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  return enabled;
};

/**
 * Get the FCM token and store it locally
 */
export const getFcmToken = async () => {
  let fcmToken = await AsyncStorage.getItem('fcmToken');

  if (!fcmToken) {
    try {
      const newFcmToken = await messaging().getToken();
      if (newFcmToken) {
        await AsyncStorage.setItem('fcmToken', newFcmToken);
        console.log('New FCM Token:', newFcmToken);
        return newFcmToken;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  } else {
    console.log('FCM Token already exists:', fcmToken);
    return fcmToken;
  }
};

/**
 * Listen for incoming messages
 */
export const setupNotificationListeners = () => {
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification caused app to open from background state:', remoteMessage.notification);
  });

  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('Notification caused app to open from quit state:', remoteMessage.notification);
      }
    });

  messaging().onMessage(async (remoteMessage) => {
    console.log('New foreground message:', remoteMessage.notification);
  });
};
