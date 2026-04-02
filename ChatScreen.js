import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
  Modal
} from 'react-native';
import { useApi } from './ApiContext';
import api from './api/apiClient';
import eventEmitter from './EventEmitter';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from "expo-notifications";
import { CommonActions } from '@react-navigation/native';
import { Client } from "@stomp/stompjs";
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ ADD THIS AT THE TOP (Outside the component)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, // This enables the 'Ping' sound
    shouldSetBadge: false,
  }),
});

const PACKAGE_OPTIONS = [
  { mins: 1, price: 25 },
  { mins: 5, price: 125 },
  { mins: 10, price: 250 },
  { mins: 15, price: 375 },
];

const ChatScreen = ({ route, navigation }) => {
  const [astroCode, setAstroCode] = useState(route?.params?.astroId || null);
  const astroId = astroCode || route?.params?.astroId || null;
  const name = route?.params?.name;
  const fromScreen = route?.params?.fromScreen;
  const initialPackage = route?.params?.package;
  const [twoMinWarning, setTwoMinWarning] = useState(false);
  const isAstrologer = fromScreen === 'ASTRO';
  const getCurrentUserId = () => (isAstrologer ? astroId : mobileNumber);
  const { API_BASE_URL } = useApi();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [chatDetails, setChatDetails] = useState([]);
  const [timeLeft, setTimeLeft] = useState(initialPackage?.mins * 60 || 0);
  const timerRef = useRef(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [isFavYes, setIsFavYes] = useState(false);
  const [isFavNo, setIsFavNo] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [customerDetails, setCustomerDetails] = useState(null);
  const [showSessionEndModal, setShowSessionEndModal] = useState(false);
  const [showRatingAlertModal, setShowRatingAlertModal] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const viewOnly = route?.params?.viewOnly ?? false;
  const flatListRef = useRef();
  const pollingRef = useRef(null);
  const sessionPollRef = useRef(null);
  const stompClientRef = useRef(null);
  // ✅ normalize customer identifier once
  const normalizedCust = route?.params?.custId || route?.params?.custCode || route?.params?.mobileNumber || null;
  const [mobileNumber, setMobileNumber] = useState(normalizedCust);

  useEffect(() => {
    const loadMobile = async () => {
      try {
        if (!isAstrologer) {
          const storedMobile = await AsyncStorage.getItem('mobileNumber');
          if (storedMobile && !mobileNumber) {
            setMobileNumber(storedMobile);
          } else if (!storedMobile) {
            showPopup("error", "Missing Mobile", "⚠️ No mobile number found in AsyncStorage!");
          } else {
            // showPopup("info", "Mobile From Params", ✅ Using param mobile: ${mobileNumber});
          }
        }
      } catch (err) {
        showPopup("error", "Storage Error", `❌ Failed to load mobile: ${err.message}`);
      }
    };
    loadMobile();
  }, []);

  // 🔹 Ensure astroCode always restored from AsyncStorage
  useEffect(() => {
    const loadAstroCode = async () => {
      try {
        if (!astroCode) {
          const storedAstro = await AsyncStorage.getItem("activeAstroCode");
          if (storedAstro) {
            setAstroCode(storedAstro);
            console.log("✅ Restored astroCode from AsyncStorage:", storedAstro);
          } else {
            showPopup("error", "Missing astroCode", "Astrologer ID missing. Please reopen chat.");
          }
        } else {
          // keep it updated
          await AsyncStorage.setItem("activeAstroCode", astroCode);
        }
      } catch (err) {
        console.error("Failed to load astroCode:", err);
      }
    };
    loadAstroCode();
  }, [astroCode]);

  useEffect(() => {
    const client = new Client({
      brokerURL: `${API_BASE_URL.replace(/^http/, "ws")}/ws-chat`,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("✅ STOMP connected (RN direct WebSocket)");
        global.isWebSocketActive = true;
        stopPolling(); // ✅ stop REST polling once socket is live
        client.subscribe("/topic/messages", (msg) => {
          try {
            const body = JSON.parse(msg.body);
            console.log("📩 STOMP message:", body);
            if (body.type === "chat_end") {
              setSessionEnded(true);
              showPopup("info", "Chat Ended", "Customer has ended the chat.");
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: "AstroMainScreen", params: { astroId, custId: mobileNumber } }],
                })
              );
            } else if (body.type === "chat_message") {
              // Process own echoes for replacement
              setTwoMinWarning(false);
              Notifications.scheduleNotificationAsync({
            content: {
                title: `Message from ${name}`,
                body: body.chatMessage,
                sound: 'default', // Uses default Android/iOS sound
            },
            trigger: null, // Send immediately
        });
              setChatDetails(prev => {
                // Compute stable key (prefer ID)
                const stableKey = body.id ? body.id.toString() : `${body.chatMessage?.trim().toLowerCase()}-${body.timestamp || body.createdAt || Date.now()}`;
                const chatTime = body.chatTime || new Date(body.createdAt || body.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                if (body.typedBy === getCurrentUserId()) {
                  // For OWN echo: Replace matching optimistic, or add if no match
                  let updated = prev.map(existingMsg =>
                    (existingMsg.chatMessage === body.chatMessage &&
                     existingMsg.tempKey && // Optimistic flag
                     prev.slice(-5).includes(existingMsg)) // Last 5 msgs (recent)
                    ? {
                        ...body,
                        key: stableKey,
                        chatTime: existingMsg.chatTime || chatTime,
                      }
                    : existingMsg
                  );
                  // If no replacement occurred (no ID in updated), add the echo
                  const wasReplaced = updated.some(m => m.id === body.id);
                  if (!wasReplaced) {
                    const newMsg = {
                      ...body,
                      key: stableKey,
                      chatTime,
                    };
                    updated = [...updated, newMsg];
                  }
                  return updated;
                } else {
                  // For OTHER: Add if not exists (by ID or key)
                  const exists = prev.some(m => m.id === body.id || m.key === stableKey);
                  if (exists) return prev;
                  const newMsg = {
                    ...body,
                    key: stableKey,
                    chatTime,
                  };
                  return [...prev, newMsg];
                }
              });
            }
          } catch (err) {
            console.error("❌ STOMP parse error:", err);
          }
        });
      },
      onDisconnect: () => {
        console.log("⚠️ STOMP disconnected, restart polling in 2s...");
        global.isWebSocketActive = false;
        // Unsubscribe to prevent duplicates
        if (stompClientRef.current?.subscriptions) {
          stompClientRef.current.subscriptions.forEach(sub => sub.unsubscribe());
          stompClientRef.current.subscriptions = [];
        }
        setTimeout(() => {
          if (!global.isWebSocketActive) startPolling();
        }, 2000);
      },
      onStompError: (frame) => {
        console.error("❌ STOMP error:", frame.headers["message"]);
      },
    });
    client.activate();
    stompClientRef.current = client;
    return () => {
      client.deactivate();
      global.isWebSocketActive = false;
      startPolling(); // ✅ re-enable polling when chat closed
    };
  }, [API_BASE_URL, navigation, astroId, mobileNumber]);

  // refs to avoid repeated navigation/alerts
  const mountedRef = useRef(true);
  const hasNavigatedRef = useRef(false);
  const lastNotifRef = useRef(0);
  const twoMinWarnedRef = useRef(false);
  const sessionCreatingRef = useRef(false);

  const ensureSessionActive = useCallback(async (autoStart = true) => {
    if (!astroId || !mobileNumber) {
      showPopup('error', 'Missing data', 'Cannot start session: missing astro or customer id.');
      return false;
    }
    if (sessionCreatingRef.current) {
      // wait for another creation to finish
      let waitCount = 0;
      while (sessionCreatingRef.current && waitCount < 10) {
        await new Promise(r => setTimeout(r, 200));
        waitCount++;
      }
    }
    try {
      // Check if session is already active
      const res = await api.get(`${API_BASE_URL}/api/session/status`, {
        params: { astroId, custId: mobileNumber }
      });
      const status = res?.data?.status?.toLowerCase();
      if (status && status !== 'ended') {
        return true;
      }
    } catch (err) {
      // Ignore error, treat as "no session"
    }
    if (!autoStart) return false;
    // Auto-start new session
    const mins = (selectedPackage?.mins) || (initialPackage?.mins) || 5;
    try {
      sessionCreatingRef.current = true;
      await api.post(`${API_BASE_URL}/api/session/start`, {
        astroId,
        custId: mobileNumber,
        minutes: mins,
      });
      if (!isAstrologer) {
        setSelectedPackage(prev => prev || { mins });
        startTimer(mins);
      }
      return true;
    } catch (err) {
      console.error('ensureSessionActive failed:', err?.message || err);
      showPopup('error', 'Session Error', 'Could not start session. Please try again.');
      return false;
    } finally {
      sessionCreatingRef.current = false;
    }
  }, [API_BASE_URL, astroId, mobileNumber, selectedPackage, initialPackage, isAstrologer, startTimer]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ✅ ADD THIS INSIDE THE ChatScreen COMPONENT
useEffect(() => {
    const setupNotifications = async () => {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Chat Notifications',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF6B00',
            });
        }
    };
    setupNotifications();
}, []);

  const showPopup = (type, title, message) => {
    setPopupType(type);
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupVisible(true);
  };

  // ----------------- DATA FETCH -------------------------
  const fetchData = useCallback(async () => {
    try {
      if (global.isWebSocketActive) {
        console.log("⚠️ Skipping fetchData() because WebSocket is active");
        return;
      }
      const response = await api.get(`${API_BASE_URL}/api/custastro/search`, {
        params: { astroCode: astroId, custCode: mobileNumber },
      });
      if (mountedRef.current) {
        // Replace with full history (backend provides ordered/complete)
        // Filter out old temps (rare, since REST saves them)
        const history = (Array.isArray(response.data) ? response.data : []).map(item => ({
          ...item,
          // Stable key from ID
          key: item.id ? item.id.toString() : `${item.chatMessage?.trim().toLowerCase()}-${item.timestamp || item.createdAt || Date.now()}`,
          // Compute chatTime if missing
          chatTime: item.chatTime || new Date(item.createdAt || item.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        })).filter(item => !item.tempKey); // Drop any unsynced temps
        setChatDetails(history);
        // Auto-scroll after sync
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      console.error('fetchData error:', err?.message || err);
    }
  }, [API_BASE_URL, astroId, mobileNumber]);

  const fetchCustomerDetails = useCallback(async () => {
    if (!mobileNumber) return;
    try {
      const res = await api.get(`${API_BASE_URL}/api/customers/${mobileNumber}`);
      if (mountedRef.current) setCustomerDetails(res.data);
    } catch (err) {
      console.error('Error fetching customer details', err);
    }
  }, [API_BASE_URL, mobileNumber]);

  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  // ----------------- Polling for messages -----------------
  const startPolling = useCallback(() => {
    stopPolling();
    const poll = async () => {
      if (global.isWebSocketActive) return; // Skip if WS back
      await fetchData();
      pollingRef.current = setTimeout(poll, 5000); // 5s for lightweight
    };
    poll();
  }, [fetchData]);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current); // ✅ correct
      pollingRef.current = null;
    }
  };

  // ----------------- Polling for session status (astro only) -----------------
  const startSessionPolling = useCallback(() => {
    if (!isAstrologer) return;
    stopSessionPolling();
    const pollSession = async () => {
      try {
        const res = await api.get(`${API_BASE_URL}/api/session/status`, {
          params: { astroId, custId: mobileNumber }
        });
        const statusRaw = res?.data?.status;
        const remainingRaw = res?.data?.remainingTime;
        const status = typeof statusRaw === 'string' ? statusRaw.toLowerCase() : null;
        const remaining = typeof remainingRaw === 'number' ? Number(remainingRaw) : null;
        if (remaining !== null && mountedRef.current) {
          setTimeLeft(Math.max(0, remaining));
        }
        if (status === 'ended') {
          if (!hasNavigatedRef.current && mountedRef.current) {
            setSessionEnded(true);
            // 🚫 Do not show popup if in view-only (chat history) mode
            if (!viewOnly) {
              hasNavigatedRef.current = true;
              Alert.alert('Session Ended', 'The session has been ended by the other party.', [
                {
                  text: 'OK',
                  onPress: () => navigation.dispatch(
                    CommonActions.reset({ index: 0, routes: [{ name: 'AstroMainScreen' }] })
                  )
                }
              ]);
            }
          }
        } else if (status === 'warning') {
          if (remaining !== null && !twoMinWarnedRef.current) {
            twoMinWarnedRef.current = true;
            setTwoMinWarning(true);
          }
        }
      } catch (err) {
        console.log('session status poll error:', err?.message || err);
      }
      sessionPollRef.current = setTimeout(pollSession, 6000); // every 6s
    };
    pollSession();
  }, [API_BASE_URL, astroId, mobileNumber, isAstrologer, navigation]);

  const stopSessionPolling = () => {
    if (sessionPollRef.current) {
      clearTimeout(sessionPollRef.current); // ✅ correct
      sessionPollRef.current = null;
    }
  };

  // ----------------- EventEmitter for new messages -----------------
  useEffect(() => {
    const handleNewMessage = (msg) => {
      if (!msg) return;
      // 🚫 Skip EventEmitter messages if WebSocket is already handling chats
      setTwoMinWarning(false);
      if (global.isWebSocketActive) {
        console.log("⚠️ Skipping EventEmitter message because WebSocket is active:", msg.chatMessage);
        return;
      }
      console.log("📩 newMessage event (via EventEmitter):", msg);
      setChatDetails(prev => {
        const stableKey = msg.id ? msg.id.toString() : `${msg.chatMessage?.trim().toLowerCase()}-${msg.timestamp || msg.createdAt || Date.now()}`;
        const chatTime = msg.chatTime || new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        if (msg.typedBy === getCurrentUserId()) {
          // Replace optimistic (similar logic), or add if no match
          let updated = prev.map(existingMsg =>
            (existingMsg.chatMessage === msg.chatMessage &&
             existingMsg.tempKey &&
             prev.slice(-5).includes(existingMsg))
            ? {
                ...msg,
                key: stableKey,
                chatTime: existingMsg.chatTime || chatTime
              }
            : existingMsg
          );
          // If no replacement occurred (no ID in updated), add the message
          const wasReplaced = updated.some(m => m.id === msg.id);
          if (!wasReplaced) {
            const newMsg = {
              ...msg,
              key: stableKey,
              chatTime,
            };
            updated = [...updated, newMsg];
          }
          return updated;
        } else {
          const exists = prev.some(m => m.id === msg.id || m.key === stableKey);
          if (exists) return prev;
          const newMsg = {
            ...msg,
            key: stableKey,
            chatTime
          };
          return [...prev, newMsg];
        }
      });
    };
    eventEmitter.on("newMessage", handleNewMessage);
    return () => eventEmitter.off("newMessage", handleNewMessage);
  }, [getCurrentUserId]);

  // ----------------- SIMPLE TIMER LOGIC -------------------------
  const startTimer = useCallback((minutes) => {
    // clear old timers if any
    if (timerRef.current) {
      clearTimeout(timerRef.current.warning);
      clearTimeout(timerRef.current.end);
    }
    const totalSeconds = minutes * 60;
    setTimeLeft(totalSeconds); // ✅ set initial time for UI
    timerRef.current = {};
    // 1️⃣ Warning at 2 min left
    if (totalSeconds > 120) {
      timerRef.current.warning = setTimeout(() => setTwoMinWarning(true), (totalSeconds - 120) * 1000);
    }
    // 2️⃣ End chat when time runs out
    timerRef.current.end = setTimeout(() => setShowSessionEndModal(true), totalSeconds * 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current.warning);
        clearTimeout(timerRef.current.end);
        timerRef.current = null;
      }
      stopPolling();
      stopSessionPolling();
    };
  }, []);

  // ✅ Control polling based on WebSocket state
  useEffect(() => {
    if (!global.isWebSocketActive && !sessionEnded) {
      console.log("🔁 Polling active (WebSocket inactive)");
      startPolling();
    } else {
      console.log("🧘 Polling stopped (WebSocket active or session ended)");
      stopPolling();
    }
    // Session status polling (astro only)
    if (!sessionEnded) {
      startSessionPolling();
    } else {
      stopSessionPolling();
    }
    return () => {
      stopPolling();
      stopSessionPolling();
    };
  }, [sessionEnded, startPolling, startSessionPolling]);

  useEffect(() => {
    if (!isAstrologer && selectedPackage?.mins && !sessionEnded) {
      startTimer(selectedPackage.mins);
    }
  }, [selectedPackage, startTimer, isAstrologer, sessionEnded]);

  useEffect(() => {
    if (!isAstrologer && initialPackage?.mins && !selectedPackage && !sessionEnded) {
      setSelectedPackage(initialPackage);
      startTimer(initialPackage.mins);
    }
  }, []);

  useEffect(() => {
    if (sessionEnded) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionEnded]);

  // ------------------------- END SESSION -------------------------
  const endSessionAndNotifyAstro = async () => {
    try {
      timerRef.current = null;
      setSessionEnded(true);
      stopPolling();
      stopSessionPolling();
      await api.post(`${API_BASE_URL}/api/session/end`, { astroId, custId: mobileNumber });
      eventEmitter.emit('endSession', true);
    } catch (err) {
      console.error('endSessionAndNotifyAstro err', err?.message || err);
    }
  };

  // ------------------------- SEND MESSAGE -------------------------
  const sendMessage = async () => {
    if (sessionEnded || !message.trim()) return;
    const currentUserId = getCurrentUserId(); // ✅ always correct
    if (!astroId || !mobileNumber || !currentUserId) {
      showPopup('error', 'Missing data', 'Cannot send message: missing astro, customer id or user.');
      return;
    }
    try {
      // ✅ Ensure session is active before sending
      const ok = await ensureSessionActive(true);
      if (!ok) {
        showPopup('error', 'No active session', 'Please start a session to send messages.');
        return;
      }
      if (twoMinWarning) setTwoMinWarning(false);
      const tempKey = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Unique temp for replacement
      const optimisticMsg = {
        chatMessage: message,
        astroCode: astroId,
        custCode: mobileNumber,
        typedBy: currentUserId,
        tempKey, // Flag for easy matching
        key: tempKey, // Temp key
        chatTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      // 🔹 Use WebSocket if available
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.publish({
          destination: "/app/chat.sendMessage",
          body: JSON.stringify({
            from: currentUserId,
            to: isAstrologer ? mobileNumber : astroId, // ✅ FIXED → astro sends to customer, customer sends to astro
            message,
          }),
        });
        // Add optimistic
        setChatDetails(prev => [...prev, optimisticMsg]);
        setMessage('');
      } else {
        // REST fallback: No optimistic (fetch will sync immediately)
        console.warn("⚠️ WebSocket not connected, falling back to REST API");
        const formData = new FormData();
        formData.append('chatMessage', message);
        formData.append('astroCode', astroId);
        formData.append('custCode', mobileNumber);
        formData.append('typedBy', currentUserId);
        await api.post(`${API_BASE_URL}/api/custastro/chats/${fromScreen}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setMessage('');
        await fetchData(); // Syncs full history with ID
      }
    } catch (err) {
      console.error('sendMessage err', err?.message || err);
      showPopup('error', 'Error', 'Failed to send message.');
    }
  };

  // ------------------------- RATING SUBMIT -------------------------
  const handleRatingSubmit = async () => {
    if (!rating || (!isFavYes && !isFavNo)) {
      setShowRatingAlertModal(true);
      return;
    }
    try {
      // ✅ 1️⃣ Save feedback
      await api.post(`${API_BASE_URL}/astro/api/feedbacks`, {
        custCode: mobileNumber,
        astroCode: astroId,
        givenStar: rating,
        remarks: feedback,
        isFavourite: isFavYes,
      });
      // ✅ 2️⃣ Update astrologer’s status back to “online”
      await api.put(`${API_BASE_URL}/api/astrologers/status`, { astroId: astroId, status: 'online' });
      // ✅ 4️⃣ Show thank you & navigate customer to Main screen
      setShowRatingModal(false);
      setShowThankYouModal(true);
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        //showPopup("success", "Thank you!", "Your feedback has been submitted successfully.");
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      }
    } catch (error) {
      console.error('Failed to submit feedback or update status:', error);
      showPopup('error', 'Error', 'Failed to submit your feedback.');
    }
  };

  // ------------------------- SESSION MODAL ACTIONS -------------------------
  const handleSessionEndNo = async () => {
    setShowSessionEndModal(false);
    setSessionEnded(true);
    setShowRatingModal(true); // customer feedback form
    try {
      // 1️⃣ End session in backend (this triggers FCM for offline astro)
      await api.post(`${API_BASE_URL}/api/session/end`, {
        astroId,
        custId: mobileNumber,
        endedBy: "CUSTOMER"
      });
      // 2️⃣ Emit WebSocket event for online astro
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.publish({
          destination: "/app/chat.endSession",
          body: JSON.stringify({
            type: "chat_end",
            astroId,
            custId: mobileNumber,
          }),
        });
      }
      // 3️⃣ Emit locally (optional safeguard)
      eventEmitter.emit("endSession", true);
    } catch (err) {
      console.error("❌ handleSessionEndNo error:", err?.message || err);
    }
  };

  const handleSessionEndYes = () => {
    setShowSessionEndModal(false);
    setSelectedPackage(null);
    setShowPackageModal(true);
    setSessionEnded(false);
  };

  const handleStartSession = async () => {
    if (selectedPackage) {
      try {
        await api.post(`${API_BASE_URL}/api/session/start`, {
          astroId: astroId,
          custId: mobileNumber,
          minutes: selectedPackage.mins,
        });
        setShowPackageModal(false);
        setSessionEnded(false);
        startTimer(selectedPackage.mins);
        eventEmitter.emit('sessionStarted', selectedPackage);
      } catch (error) {
        console.error("Failed to start session:", error);
        Alert.alert("Error", "Could not start session. Please try again.");
      }
    }
  };

  const formattedCustomerInfo = customerDetails ? {
    typedBy: mobileNumber,
    chatMessage:
      `Hi,\nBelow are my details:\n\n` +
      `Name: ${customerDetails.custName}\n` +
      `Gender: ${customerDetails.custGender}\n` +
      `Time of Birth: ${customerDetails.custTimeOfBirth}\n` +
      `Date of Birth: ${customerDetails.custDob}\n` +
      `Place of Birth: ${customerDetails.custPlaceOfBirth}\n`,
    chatTime: new Date().toLocaleString(),
  } : null;

  const chatData = formattedCustomerInfo ? [formattedCustomerInfo, ...chatDetails] : chatDetails;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // auto scroll to end but use requestAnimationFrame to avoid blocking main thread
  const handleScrollToEnd = () => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
  };

  // ------------------------- RENDER -------------------------
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} // ✅ FIXED: Use 'padding' for both iOS and Android for reliable bottom input push-up
        keyboardVerticalOffset={0} // ✅ FIXED: Set to 0 (removes top inset offset, which was unnecessary for bottom avoidance)
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <Text style={styles.title}>{name}</Text>
              {!isAstrologer && (selectedPackage?.mins > 0 || timeLeft > 0) && (
                <View style={styles.timerBox}>
                  <Ionicons name="time-outline" size={16} color="#FF6B00" />
                  <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                </View>
              )}
            </View>
            <View style={styles.encryptionBanner}>
              <Ionicons name="lock-closed-outline" size={16} color="#FFCC00" />
              <Text style={styles.encryptionBannerText}>All messages are encrypted.</Text>
            </View>
            <FlatList
              ref={flatListRef}
              data={chatData}
              keyExtractor={item => item.key || chatData.indexOf(item).toString()}
              contentContainerStyle={{ padding: 10, paddingBottom: 120 }} // ✅ FIXED: Increased paddingBottom to ~100-120 to account for inputRow + endButton height + keyboard buffer
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={handleScrollToEnd}
              renderItem={({ item, index }) => {
                const isMyMessage = item.typedBy === getCurrentUserId();
                const isDetailsMsg = typeof item.chatMessage === 'string' && item.chatMessage.includes('Below are my details:');
                return (
                  // 🔄 CHANGE: Added outer View with dynamic alignSelf for left/right alignment (own on right, others on left)
                  // Also added marginBottom for spacing; box length adapts via flex (no fixed width beyond maxWidth)
                  <View style={{ alignSelf: isMyMessage ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                    <View style={[
                      styles.messageContainer,
                      isMyMessage ? styles.userMessage : styles.otherMessage,
                      isDetailsMsg && styles.detailsMessage
                    ]}>
                      <Text style={{ color: isMyMessage ? '#333' : '#fff' }}>{item.chatMessage}</Text>
                      {item.chatTime && (
                        <Text style={styles.timeStamp}>{item.chatTime}</Text>
                      )}
                    </View>
                  </View>
                );
              }}
            />
            {twoMinWarning && (
              <View style={{
                backgroundColor: '#FFF3CD',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                margin: 10
              }}>
                <Text style={{ color: '#856404', fontWeight: '500' }}>⚠️ You have 2 mins left in this chat</Text>
              </View>
            )}
            {!sessionEnded && !viewOnly && (
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Type a message..."
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  onSubmitEditing={sendMessage}
                  blurOnSubmit={false} // ✅ FIXED: Prevents keyboard from dismissing on send (keeps focus for next message)
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            {!viewOnly && (
              <TouchableOpacity
                style={styles.endButton}
                onPress={() => {
                  // customer or astrologer ended manually
                  timerRef.current = null;
                  setSessionEnded(true);
                  // inform other side
                  eventEmitter.emit('endSession', true);
                  // Also call backend to end session & notify other side
                  api.post(`${API_BASE_URL}/api/session/end`, { astroId, custId: mobileNumber }).catch(e => console.log('end err', e?.message));
                  if (!hasNavigatedRef.current) {
                    hasNavigatedRef.current = true;
                    navigation.dispatch(
                      CommonActions.reset({ index: 0, routes: [{ name: isAstrologer ? 'AstroMainScreen' : 'Main' }] })
                    );
                  }
                }}
              >
                <Text style={styles.endText}>End Chat</Text>
              </TouchableOpacity>
            )}
            {/* Package / Rating Modals (kept your UI) */}
            <Modal visible={showPackageModal} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => setShowPackageModal(false)}>
                  <View style={{ flex: 1 }} />
                </TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Consultation Packages</Text>
                  <Text style={styles.modalDesc}>Your selected astrologer {name} is ready to chat with you.</Text>
                  {PACKAGE_OPTIONS.map((pkg, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.radioRow}
                      onPress={() => setSelectedPackage(pkg)}
                    >
                      <View style={[
                        styles.radioCircle,
                        selectedPackage?.mins === pkg.mins && styles.radioSelected
                      ]}>
                        {selectedPackage?.mins === pkg.mins && <View style={styles.radioDot} />}
                      </View>
                      <Text style={styles.radioLabel}>{`${pkg.mins} Minutes – ₹${pkg.price}`}</Text>
                    </TouchableOpacity>
                  ))}
                  {selectedPackage && (
                    <Text style={styles.confirmText}>
                      ✅ You've selected {selectedPackage.mins} min session for ₹{selectedPackage.price}
                    </Text>
                  )}
                  <TouchableOpacity style={styles.modalButton} onPress={handleStartSession}>
                    <Text style={styles.modalButtonText}>Start My Session</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowPackageModal(false)}>
                    <Text style={{ color: '#FF6B00', textAlign: 'center', marginTop: 10 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <Modal visible={showRatingModal} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => setShowRatingModal(false)}>
                  <View style={{ flex: 1 }} />
                </TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Rate "{name}"</Text>
                  <Text style={styles.modalDesc}>Please take a moment to evaluate and tell us what you think</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setRating(star)}>
                        <AntDesign
                          name={rating >= star ? 'star' : 'staro'}
                          size={30}
                          color="#FFD700"
                          style={{ marginHorizontal: 5 }}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 20, minHeight: 80 }}
                    placeholder="Optional feedback..."
                    multiline
                    value={feedback}
                    onChangeText={setFeedback}
                  />
                  <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Would you like to favorite this astrologer?</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
                    <TouchableOpacity
                      style={styles.radioRow}
                      onPress={() => { setIsFavYes(true); setIsFavNo(false); }}
                    >
                      <View style={[
                        styles.radioOuterSmall,
                        isFavYes && styles.radioSelected
                      ]}>
                        {isFavYes && <View style={styles.radioInnerSmall} />}
                      </View>
                      <Text style={styles.radioLabel}>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.radioRow}
                      onPress={() => { setIsFavYes(false); setIsFavNo(true); }}
                    >
                      <View style={[
                        styles.radioOuterSmall,
                        isFavNo && styles.radioSelected
                      ]}>
                        {isFavNo && <View style={styles.radioInnerSmall} />}
                      </View>
                      <Text style={styles.radioLabel}>No</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.modalButton} onPress={handleRatingSubmit}>
                    <Text style={styles.modalButtonText}>SUBMIT</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <Modal visible={showSessionEndModal} transparent>
              <View style={styles.modalOverlay1}>
                <View style={styles.modalBox}>
                  <View style={styles.contentWrapper}>
                    <View style={styles.iconWrapper}>
                      <Ionicons name="time-outline" size={40} color="#FF6B00" />
                    </View>
                    <Text style={styles.modalTitle}>Session Ended</Text>
                    <Text style={styles.modalMessage}>Do you want to continue the chat?</Text>
                  </View>
                  <View style={styles.separator} />
                  <LinearGradient
                    colors={['#FF6B00', '#FF8C00']}
                    style={styles.gradientBottom}
                  >
                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity
                        style={{ flex: 1, alignItems: 'center', paddingVertical: 15 }}
                        onPress={handleSessionEndNo}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>No</Text>
                      </TouchableOpacity>
                      <View style={styles.separator} />
                      <TouchableOpacity
                        style={{ flex: 1, alignItems: 'center', paddingVertical: 15 }}
                        onPress={handleSessionEndYes}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Yes</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            </Modal>
            <Modal visible={showRatingAlertModal} transparent>
              <View style={styles.modalOverlay1}>
                <View style={styles.modalBox}>
                  <View style={styles.contentWrapper}>
                    <View style={styles.iconWrapper}>
                      <Ionicons name="alert-circle-outline" size={40} color="#FF6B00" />
                    </View>
                    <Text style={styles.modalTitle}>Incomplete Rating</Text>
                    <Text style={styles.modalMessage}>Please rate and select your favorite option before submitting.</Text>
                  </View>
                  <View style={styles.separator} />
                  <TouchableOpacity
                    onPress={() => setShowRatingAlertModal(false)}
                    style={{ alignItems: 'center', paddingVertical: 15 }}
                  >
                    <Text style={styles.okButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <Modal visible={popupVisible} transparent>
              <View style={styles.modalOverlay1}>
                <View style={styles.modalBox}>
                  <View style={styles.contentWrapper}>
                    <View style={styles.iconWrapper}>
                      {popupType === "success" && <Ionicons name="checkmark-circle-outline" size={40} color="#4CAF50" />}
                      {popupType === "error" && <Ionicons name="close-circle-outline" size={40} color="#F44336" />}
                      {popupType === "offline" && <Ionicons name="airplane-outline" size={40} color="#FF9800" />}
                      {popupType === "busy" && <Ionicons name="hourglass-outline" size={40} color="#FF9800" />}
                      {popupType === "info" && <Ionicons name="information-circle-outline" size={40} color="#2196F3" />}
                    </View>
                    <Text style={styles.modalTitle}>{popupTitle}</Text>
                    <Text style={styles.modalMessage}>{popupMessage}</Text>
                  </View>
                  <View style={styles.separator} />
                  <TouchableOpacity
                    onPress={() => setPopupVisible(false)}
                    style={{ alignItems: 'center', paddingVertical: 15 }}
                  >
                    <Text style={styles.okButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  timerText: {
    marginLeft: 5,
    color: '#FF6B00',
    fontWeight: 'bold',
    fontSize: 13,
  },
  encryptionBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 8, borderRadius: 8, alignSelf: 'center', borderWidth: 1, borderColor: '#FFCC00' },
  encryptionBannerText: { color: '#FFCC00', fontSize: 13, marginLeft: 5 },
  messageContainer: {
    padding: 10,
    borderRadius: 12,
    maxWidth: '75%', // 🔄 NOTE: Retained maxWidth to prevent messages from spanning full screen; box adapts to content within this cap
  },
  userMessage: {
    backgroundColor: '#fff3e0',
  },
  otherMessage: {
    backgroundColor: '#FF6B00',
  },
  detailsMessage: {
    backgroundColor: '#FF6B00',
    maxWidth: '60%',
    padding: 8,
    borderRadius: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end', // ✅ FIXED: Align items to bottom for multiline TextInput consistency
    marginTop: 10,
    marginBottom: 10, // ✅ ADDED: Extra bottom margin for endButton separation
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
    minHeight: 40, // ✅ ADDED: Explicit minHeight to stabilize multiline input
    maxHeight: 100, // ✅ ADDED: Cap max height to prevent over-expansion
  },
  sendButton: {
    backgroundColor: '#FF6B00',
    padding: 10,
    borderRadius: 25,
  },
  endButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  endText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff8e1',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalDesc: {
    marginBottom: 10,
    color: '#555',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B00',
  },
  radioLabel: {
    fontSize: 15,
    color: '#333',
  },
  confirmText: {
    color: '#008000',
    marginBottom: 10,
  },
  modalButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay1: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '75%',
    backgroundColor: '#FFEFE5',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
  },
  contentWrapper: {
    padding: 25,
    alignItems: 'center',
  },
  iconWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 15,
    color: '#4F4F4F',
    textAlign: 'center',
    lineHeight: 22,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  gradientBottom: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  okButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  okButtonText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 16,
  },
  radioOuterSmall: {
    height: 14,
    width: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#ff9900',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerSmall: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: '#ff9900',
  },
  radioSelected: {
    borderColor: '#ff6600',
  },
  timeStamp: {
    fontSize: 11,
    marginTop: 6,
    color: '#666',
  }
});

export default ChatScreen;