// AstroCustChatFlow.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from './api/apiClient';
import messaging from "@react-native-firebase/messaging";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign, Ionicons } from "@expo/vector-icons";



let triggerChatFlow = null;

export const startAstroChat = async (astro, navigation, API_BASE_URL) => {
  if (!triggerChatFlow) {
    Alert.alert("Error", "Chat flow not initialized properly. Please try again.");
    return;
  }
  triggerChatFlow({ astro, navigation, API_BASE_URL });
};

export const AstroCustChatFlowProvider = () => {
  const [visibleWait, setVisibleWait] = useState(false);
  const [visiblePackage, setVisiblePackage] = useState(false);
  const [astro, setAstro] = useState(null);
  const [API_BASE_URL, setApiBase] = useState(null);
  const [navigation, setNavigation] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
const [popupType, setPopupType] = useState("");
const [popupTitle, setPopupTitle] = useState("");
const [popupMessage, setPopupMessage] = useState("");

const showPopup = (type, title, message) => {
  setPopupType(type);
  setPopupTitle(title);
  setPopupMessage(message);
  setPopupVisible(true);
};


  useEffect(() => {
    triggerChatFlow = async ({ astro, navigation, API_BASE_URL }) => {
      try {
        const mobileNumber = await AsyncStorage.getItem("mobileNumber");
        const custName = await AsyncStorage.getItem("customerName");

        if (!mobileNumber) {
          Alert.alert("Login Required", "Please login to start chat.");
          return;
        }

        setAstro(astro);
        setApiBase(API_BASE_URL);
        setNavigation(navigation);

        // Show waiting popup
        setVisibleWait(true);

        await api.post(`${API_BASE_URL}/api/chat/request/start`, {
          custId: mobileNumber,
          custName,
          astroId: astro.astroId,
        });
      } catch (err) {
        console.error("Error sending chat request:", err?.message);
        Alert.alert("Error", "Failed to send chat request.");
      }
    };

    return () => {
      triggerChatFlow = null;
    };
  }, []);

  // 🔔 FCM listener for accept/reject
 // 🔔 FCM listener for accept/reject
useEffect(() => {
  // Check if we are on web
  if (Platform.OS === 'web') return; 

  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    const data = remoteMessage?.data || {};

    if (data.type === "chat_accepted") {
      setVisibleWait(false);
      setVisiblePackage(true);
    }

    if (data.type === "chat_rejected") {
      setVisibleWait(false);
      showPopup("error", "Request Rejected", "Astrologer rejected your request.");

      setTimeout(() => {
        setPopupVisible(false);
        if (navigation) navigation.navigate("Main");
      }, 2000);
    }
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}, [navigation]);

  const startSession = async () => {
    try {
      const mobile = await AsyncStorage.getItem("mobileNumber");

      await api.put(`${API_BASE_URL}/api/astrologers/status`, {
        astroId: astro?.astroId,
        status: "busy",
      });

      setVisiblePackage(false);

      navigation.navigate("ChatScreen", {
        astroId: astro?.astroId,
        name: astro?.astroName,
        mobileNumber: mobile,
        custId: mobile,
        custCode: mobile,
        fromScreen: "CUST",
        package: selectedPackage,
      });
    } catch (err) {
      console.error("Start session error:", err?.message);
      Alert.alert("Error", "Failed to start chat session.");
    }
  };

  return (
    <>
      {/* ⏳ Waiting Modal */}
      <Modal visible={visibleWait} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <AntDesign name="clockcircle" size={35} color="#FF9500" />
            <Text style={styles.title}>Waiting for astrologer to accept...</Text>
            <Text style={styles.message}>
              You can close this popup anytime.
            </Text>

            <LinearGradient
              colors={["#FC2A0D", "#FE9F5D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <TouchableOpacity
                onPress={() => {
                  setVisibleWait(false);
                  setVisiblePackage(false);
                  navigation.navigate("Main");
                }}
                style={styles.btn}
              >
                <Text style={styles.btnText}>Close</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* 💰 Package Modal */}
      <Modal visible={visiblePackage} transparent animationType="slide">
        <View style={styles.packageOverlay}>
          <View style={styles.packageBox}>
            <Text style={styles.pkgTitle}>Consultation Packages</Text>
            {[1, 5, 10, 15].map((m) => (
              <TouchableOpacity
                key={m}
                style={styles.pkgRow}
                onPress={() =>
                  setSelectedPackage({
                    mins: m,
                    total: (astro?.offerPrice || astro?.astroRatemin || 10) * m,
                  })
                }
              >
                <Ionicons
                  name={
                    selectedPackage?.mins === m
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={22}
                  color="#FF6B00"
                />
                <Text style={{ marginLeft: 10, fontSize: 16 }}>
                  {m} Minutes — ₹
                  {(astro?.offerPrice || astro?.astroRatemin || 10) * m}
                </Text>
              </TouchableOpacity>
            ))}

            {selectedPackage && (
              <TouchableOpacity
                onPress={startSession}
                style={styles.startBtn}
              >
                <Text style={styles.startText}>Start My Session</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setVisiblePackage(false)}
              style={{ alignItems: "center", marginTop: 10 }}
            >
              <Text style={{ color: "#999" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
  transparent
  animationType="fade"
  visible={popupVisible}
  onRequestClose={() => setPopupVisible(false)}
>
  <View style={styles.overlay}>
    <View style={styles.modalBox}>
      <AntDesign
        name={popupType === "error" ? "closecircle" : "infocirlce"}
        size={32}
        color={popupType === "error" ? "#FF3B30" : "#007AFF"}
      />
      <Text style={styles.title}>{popupTitle}</Text>
      <Text style={styles.message}>{popupMessage}</Text>

      <LinearGradient
        colors={["#FC2A0D", "#FE9F5D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <TouchableOpacity
          onPress={() => setPopupVisible(false)}
          style={styles.btn}
        >
          <Text style={styles.btnText}>OK</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>

    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#FFEFE5",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 25,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    color: "#555",
    fontSize: 14,
    marginVertical: 8,
  },
  gradient: {
    width: "100%",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: 10,
  },
  btn: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  btnText: { color: "red", fontWeight: "bold", fontSize: 16 },
  packageOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  packageBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    height: "60%",
  },
  pkgTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    backgroundColor: "#fff3e0",
  },
  pkgRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  startBtn: {
    backgroundColor: "#FF6B00",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  startText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
