import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from './NavigationRef';
import { ApiProvider, useApi } from './ApiContext';
import { AstroStatusProvider } from './AstroStatusContext';
import eventEmitter from './EventEmitter';
import * as Notifications from 'expo-notifications';
import { Platform, View } from 'react-native';

import { registerForPushNotificationsAsync } from './RegisterPushNotification';
import { AstroCustChatFlowProvider } from "./AstroCustChatFlow";



// Import your screens
import LoginScreen from './LoginScreen';
import CustomerScreen from './CustomerScreen';
import OtpPage from './OtpPage';
import CustRegisterScreen from './CustRegisterScreen';
import MainScreen from './MainScreen';
import AstrologerRegistration from './AstrologerRegistration';
import AstrologerOtherDetails from './AstrologerOtherDetails';

import AdminMainPage from './AdminMainPage';
import AstrologerOthDetRO from './AstrologerOthDetRO';
import ChatScreen from './ChatScreen';

import AstroMainScreen from './AstroMainScreen';
import AstromobileFlow from './AstromobileFlow';
import ContactUsScreen from './ContactUsScreen';
import FAQScreen from './FAQScreen';
import SupportScreen from './SupportScreen';
import AdminSupportScreen from './AdminSupportScreen';
import CustomerSupport from './CustomerSupport';
import AstroTISContacts from './AstroTISContacts';
import AboutUsScreen from './AboutUsScreen';
import AstroProfileInfo from './AstroProfileInfo';
import SpiritualBooks from './SpiritualBooks';
import RemedyCategoryScreen from './RemedyCategoryScreen';
import LoveRemedyScreen from './LoveRemedyScreen';
import AdminAstroEditPage from './AdminAstroEditPage';
import CustProfileScreen from './CustProfileScreen';
import CustomerChatHistoryScreen from './CustomerChatHistoryScreen';
import ChatDetailScreen from './ChatDetailScreen';
import MyAstrologersScreen from './MyAstrologersScreen';
import PackageSelectionScreen from './PackageSelectionScreen';
import CustomerRemedyScreen from './CustomerRemedyScreen';
import CommonRemedyScreen from './CommonRemedyScreen';
import CustomerCounsellingScreen from './CustomerCounsellingScreen';
import AstroSettingScreen from './AstroSettingScreen';
import CallChatScreen from './CallChatScreen';
import CourseSessionOfferScreen from './CourseSessionOfferScreen';
import AstroProfile from './AstroProfile';
import TermsAndConditionsScreen from './TermsAndConditionsScreen';
import PrivacyPolicyScreen from './PrivacyPolicyScreen';
import AstroTermsAndConditionScreen from './AstroTermsAndConditionScreen';
import AstroPrivacyPolicyScreen from './AstroPrivacyPolicyScreen';
import CustContactUs from './CustContactUs';
import OffersScreen from './OffersScreen';
import CallChatOffersScreen from './CallChatOffersScreen';
import SessionCourseScreen from './SessionCourseScreen';
import RemedyScreen from './RemedyScreen';
import AstroBlogScreen from './AstroBlogScreen';
import CartScreen from "./CartScreen";
import AstroEventScreen from './AstroEventScreen';


import api from './api/apiClient';


let messaging = null;
if (Platform.OS === 'android' || Platform.OS === 'ios') {
    try {
        messaging = require('@react-native-firebase/messaging').default;
    } catch (e) {
        console.warn("Firebase Messaging not available");
    }
}

// Helper to show actionable local notification (Astro background)
async function showChatRequestNotification(data) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "New Chat Request",
      body: `${data.custName} wants to chat with you.`,
      data,
      sound: true,
      sound: 'default',  // Or custom sound file
      color: '#FF6600',  // Accent color for buttons/text
      categoryIdentifier: "chat_request_actions",
      smallIcon: 'ic_notification',  // Custom icon (add to android/app/src/main/res/drawable)
      largeIcon: 'ic_large_notification',  // Large icon for tray
      channelId: 'chat_requests',  // Use custom channel
    },
    trigger: null,
  });
}

// Global flag to prevent FCM duplicate message emission
global.isWebSocketActive = false;

// Configure how notifications behave in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Replace lines 76-82 with this:
if (Platform.OS !== 'web' && messaging) {
  try {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('📩 Background message:', remoteMessage);
      if (remoteMessage.data?.type === "chat_request") {
        await showChatRequestNotification(remoteMessage.data);
      }
    });
  } catch (e) {
    console.error("FCM Background Error:", e);
  }
}




// Navigation helper
const navigateWhenReady = (screen, params) => {
  if (navigationRef.current?.isReady()) {
    navigationRef.current.navigate(screen, params);
  } else {
    const interval = setInterval(() => {
      if (navigationRef.current?.isReady()) {
        clearInterval(interval);
        navigationRef.current.navigate(screen, params);
      }
    }, 500);
  }
};



const Stack = createStackNavigator();

const AppContent = () => {
  const { API_BASE_URL } = useApi();

  useEffect(() => {
    let unsubscribeMessage = null;
    let subscription = null;

    

    const setupFCM = async () => {
      // 1️⃣ Ask local notification permission (iOS only actually matters)
      const { status } = await Notifications.requestPermissionsAsync();
      console.log("🔔 Local notification permission:", status);
      
// 2️⃣ Register device for push notifications (get token + send to backend)
await AsyncStorage.setItem("APP_FOR", "ASTRO");  // ✅ Fixed for astrologer app
console.log("🧭 APP_FOR fixed as ASTRO for this build");

await registerForPushNotificationsAsync(API_BASE_URL);



      // ✅ NEW: Register category for actionable buttons (Accept/Reject)
 // Check if on web before calling native notification categories
if (Platform.OS !== 'web') {
  await Notifications.setNotificationCategoryAsync("chat_request_actions", [
    {
      identifier: "ACCEPT_CHAT",
      buttonTitle: "Accept",
      options: { opensAppToForeground: false },
    },
    {
      identifier: "REJECT_CHAT",
      buttonTitle: "Reject",
      options: { opensAppToForeground: false },
    },
  ]);
}

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('chat_requests', {
      name: 'Chat Requests',
      importance: Notifications.AndroidImportance.HIGH,  // Bold, heads-up
      vibrationPattern: [0, 250, 250, 250],  // Haptic feedback
      lightColor: '#FF6600',  // Orange glow
      sound: true,
    });
  }

  // 3️⃣ Foreground FCM listener
if (Platform.OS !== 'web' && messaging) {
    unsubscribeMessage = messaging().onMessage(async (remoteMessage) => {
  console.log("📩 Foreground message:", remoteMessage);

  if (remoteMessage.data?.type === "chat_message") {
  console.log("📨 Foreground chat_message received");

  const astroId = await AsyncStorage.getItem("astroMobile");
  const custId = await AsyncStorage.getItem("mobileNumber");
  const appFor = await AsyncStorage.getItem("APP_FOR");

  // 🚫 Ignore echo message (sender = receiver)
  if (remoteMessage.data?.typedBy === (appFor === "ASTRO" ? astroId : custId)) {
    console.log("🔁 Echo message from self — ignoring");
    return;
  }

  const newChat = {
    chatMessage: remoteMessage.data?.message || remoteMessage.notification?.body || "",
    typedBy: remoteMessage.data.typedBy,
    senderName: remoteMessage.data.senderName || "",
    chatTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  // ✅ Update UI if WebSocket not active
  if (!global.isWebSocketActive) {
    console.log("💬 Emitting newMessage from FCM (WebSocket inactive)");
    eventEmitter.emit("newMessage", newChat);
  } else {
    console.log("⚠️ WebSocket active — skipping FCM message emit");
  }

  // 🚀 Navigate to ChatScreen (optional based on your flow)
  console.log("🧭 Navigating to ChatScreen with:", { astroId, custId, fromScreen: appFor });

  await AsyncStorage.setItem("activeAstroCode", astroId || remoteMessage.data?.astroId || "");

  navigateWhenReady("ChatScreen", {
    astroId,
    custId: remoteMessage.data?.custId || custId,
    custCode: remoteMessage.data?.custId || custId,
    mobileNumber: remoteMessage.data?.custId || custId,
    name: remoteMessage.data.senderName || "Chat",
    fromScreen: appFor,
    viewOnly: false,
  });

  // ✅ NO NOTIFICATION in foreground for chat_message
  console.log("📵 Skipped showing chat notification (app in foreground)");
  return;
}


  // 2️⃣ Handle chat_end
  else if (remoteMessage.data?.type === "chat_end") {
    console.log("🔔 Chat end received via FCM, closing astro chat");

    const data = remoteMessage.data;

    // ✅ Save IDs to AsyncStorage (so AstroMainScreen knows the right context)
    await AsyncStorage.setItem("activeAstroCode", data?.astroId || "");
    await AsyncStorage.setItem("activeCustCode", data?.custId || "");

    // ✅ Show a local push notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Chat Ended",
        body: data?.message || "Your customer has ended the chat session.",
        data,
      },
      trigger: null,
    });

    // ✅ Navigate back to AstroMainScreen
    navigationRef.current?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "AstroMainScreen" }],
      })
    );
  }

  else if (remoteMessage.data?.type === "chat_request") {
    const { custId, custName, astroId } = remoteMessage.data;
    // ✅ Emit to AstroMainScreen for styled modal (no duplicate Alert)
    eventEmitter.emit("incomingChatRequest", { custId, custName, astroId });
  }

  else if (remoteMessage.data?.type === "chat_accepted") {
    console.log("✅ Chat accepted by astrologer:", remoteMessage.data);

    // 1️⃣ Bring customer back to MainScreen (if not already there)
    navigateWhenReady("Main");

    // 2️⃣ Emit event so CustomerMainScreen can open the package modal
    setTimeout(() => {
      eventEmitter.emit("openPackageModal", {
        astroId: remoteMessage.data.astroId,
        custId: remoteMessage.data.custId,
      });
    }, 1000); // small delay so navigation completes first
  }

  else if (remoteMessage.data?.type === "chat_rejected") {
    console.log("🚫 Chat rejected by astrologer:", remoteMessage.data);
    // ✅ Emit to MainScreen for styled popup (no duplicate Alert)
    eventEmitter.emit("chatRejected", remoteMessage.data);
  }

  // 3️⃣ Handle astro_registration
  else if (remoteMessage.data?.type === "astro_registration") {
    console.log("✅ Astro Registration notification:", remoteMessage.data);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Thanks for your details",
        body: "Our team will get back to you shortly.",
        data: remoteMessage.data,
      },
      trigger: null,
    });
    navigateWhenReady("AstroRegistrationComplete", {
      astroMobile: remoteMessage.data.astroId,
    });
  }

  // 4️⃣ Fallback generic notification
  else if (remoteMessage.notification) {
    console.log("📢 Generic notification:", remoteMessage.notification);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.notification.title || "Notification",
        body: remoteMessage.notification.body || remoteMessage.data?.message || "",
        data: remoteMessage.data || {},
      },
      trigger: null,
    });
  }
});}





// 4️⃣ Listener for when user taps on a notification from tray
subscription = Notifications.addNotificationResponseReceivedListener(async response => {
  const data = response.notification.request.content.data;
  console.log("📲 Notification tapped:", data);

  // ✅ Handle Accept/Reject from background tray
  if (data?.type === "chat_request") {
    const { custId, astroId } = data;
    const actionId = response.actionIdentifier;  // "ACCEPT_CHAT" or "REJECT_CHAT"
    console.log("🟢 Tray action pressed:", actionId);

    try {
      if (actionId === "ACCEPT_CHAT") {
        // API + status (customer gets package modal via backend FCM)
        await api.post(`${API_BASE_URL}/api/chat/request/accept`, { custId, astroId });
        await api.put(`${API_BASE_URL}/api/astrologers/status`, {
          astroId,
          status: "busy",
        });
        // Nav to AstroMainScreen (wait for customer package)
        navigateWhenReady("AstroMainScreen", { astroId });
        console.log("✅ Background Accept: API + nav to AstroMainScreen");

      } else if (actionId === "REJECT_CHAT") {
        // API only (customer rejection popup via backend FCM)—notif auto-closes
        await api.post(`${API_BASE_URL}/api/chat/request/reject`, { custId, astroId });
        console.log("🚫 Background Reject: API called, notif auto-closed");
      }
      // ✅ Force close notification after action (clears tray)
      await Notifications.dismissAllNotificationsAsync();
    } catch (err) {
      console.error("❌ Tray action error:", err);
      await Notifications.scheduleNotificationAsync({
        content: { title: "Action Failed", body: "Please open app." },
        trigger: null,
      });
    }
  }

  // ✅ Handle chat_message tap (nav to ChatScreen)
  if (data?.type === "chat_message") {
    const { astroId, custId, fromScreen, senderName } = data;
    navigateWhenReady("ChatScreen", {
      astroId,
      custId,
      name: senderName || "Chat",
      fromScreen,
      viewOnly: false,
    });
    console.log("💬 Background msg tap: Nav to ChatScreen");
    // ✅ Close after tap
    await Notifications.dismissAllNotificationsAsync();
  }

  if (data?.type === "chat_end") {
    console.log("🔔 Handling chat_end from tray tap");
    navigationRef.current?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "AstroMainScreen" }],
      })
    );
    // ✅ Close after tap
    await Notifications.dismissAllNotificationsAsync();
  }
});
    };

    setupFCM();

    return () => {
      if (unsubscribeMessage) unsubscribeMessage();
      if (subscription) subscription.remove();
    };
  }, [API_BASE_URL]);

  


  return (
    <NavigationContainer ref={navigationRef}>
     <Stack.Navigator
        initialRouteName="AstromobileFlow"
        
      >
       
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Customer" component={CustomerScreen} />
        <Stack.Screen name="OtpPage" component={OtpPage} />
        <Stack.Screen name="Register" component={CustRegisterScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="AstrologerRegistration" component={AstrologerRegistration} />
        <Stack.Screen name="AstrologerOtherDetails" component={AstrologerOtherDetails} />
    
        <Stack.Screen name="AdminMainPage" component={AdminMainPage} />
        <Stack.Screen name="AstrologerOthDetRO" component={AstrologerOthDetRO} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="AstroMainScreen" component={AstroMainScreen}  options={{ title: "Main Screen" }}/>
        <Stack.Screen name="AstromobileFlow" component={AstromobileFlow}/>
        <Stack.Screen name="ContactUs" component={ContactUsScreen} />
        <Stack.Screen name="FAQScreen" component={FAQScreen} />
        <Stack.Screen name="SupportScreen" component={SupportScreen} />
        <Stack.Screen name="AdminSupportScreen" component={AdminSupportScreen} />
        <Stack.Screen name="CustomerSupport" component={CustomerSupport} />
        <Stack.Screen name="CustContactUs" component={CustContactUs} />
        <Stack.Screen name="AstroTISContacts" component={AstroTISContacts} options={{headerShown: false}} />
        <Stack.Screen name="AboutUs" component={AboutUsScreen} options={{headerShown: false}}/>
        <Stack.Screen name="AstroProfileInfo" component={AstroProfileInfo} options={{ headerShown: false }} />
        <Stack.Screen name="SpiritualBooks" component={SpiritualBooks} options={{headerShown: false}}/>
        <Stack.Screen name="RemedyCategory" component={RemedyCategoryScreen} options={{headerShown: false}}/>
        <Stack.Screen name="LoveRemedy" component={LoveRemedyScreen} />
        <Stack.Screen name="AdminAstroEditPage" component={AdminAstroEditPage} />
        <Stack.Screen name="OffersScreen" component={OffersScreen} />
        <Stack.Screen name="ChatDetailScreen" component={ChatDetailScreen} />
        <Stack.Screen name="CustProfileScreen" component={CustProfileScreen} />
        <Stack.Screen name="CallChatScreen" component={CallChatScreen} />
        <Stack.Screen name="CourseSessionOfferScreen" component={CourseSessionOfferScreen} />
        <Stack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} options={{headerShown: false}} />
        <Stack.Screen name="AstroPrivacyPolicyScreen" component={AstroPrivacyPolicyScreen} options={{headerShown: false}} />
        <Stack.Screen name="CallChatOffers" component={CallChatOffersScreen} />
        <Stack.Screen name="SessionCourseScreen" component={SessionCourseScreen} />
        <Stack.Screen name="MyAstrologersScreen" component={MyAstrologersScreen} />
        <Stack.Screen name="CustomerCounsellingScreen" component={CustomerCounsellingScreen} />
        <Stack.Screen name="CustomerChatHistoryScreen" component={CustomerChatHistoryScreen} />
        <Stack.Screen name="CustomerRemedyScreen" component={CustomerRemedyScreen} />
        <Stack.Screen name="CommonRemedyScreen" component={CommonRemedyScreen} />
        <Stack.Screen name="PackageSelectionScreen" component={PackageSelectionScreen} />
        <Stack.Screen name="AstroSettingScreen" component={AstroSettingScreen} />
        <Stack.Screen name="AstroProfile" component={AstroProfile} />
        <Stack.Screen name="TermsAndConditionsScreen" component={TermsAndConditionsScreen} />
        <Stack.Screen name="AstroTermsAndConditionScreen" component={AstroTermsAndConditionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RemedyScreen" component={RemedyScreen} options={{headerShown: false}}/>
        <Stack.Screen name="AstroBlogScreen" component={AstroBlogScreen}  options={{ headerShown: false }}/>
        <Stack.Screen name="CartScreen" component={CartScreen} />
        <Stack.Screen name="AstroEventScreen" component={AstroEventScreen} options={{headerShown:false}}/>

      </Stack.Navigator>

    </NavigationContainer>
  );
};


const App = () => (
  <View style={{ flex: 1 }}>
    <ApiProvider>
      <AstroStatusProvider>
        <AppContent />
      </AstroStatusProvider>
    </ApiProvider>
  </View>
);


export default App;