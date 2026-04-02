import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useApi } from "./ApiContext";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons'; // or MaterialIcons
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');



const CustomerCounsellingScreen = () => {
  const { API_BASE_URL } = useApi();
  const [activeTab, setActiveTab] = useState("MyCounselling");
  const [myCounsellors, setMyCounsellors] = useState([]);
  const [videos, setVideos] = useState([]);
  const [packageModalVisible, setPackageModalVisible] = useState(false);
  const [selectedAstro, setSelectedAstro] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
const [loadingMyCounsellors, setLoadingMyCounsellors] = useState(true); // ✅ NEW

const [showStatusModal, setShowStatusModal] = useState(false);
const [statusModalData, setStatusModalData] = useState({ title: '', message: '' });
const [popupVisible, setPopupVisible] = useState(false);
const [popupType, setPopupType] = useState("");     // 'success' | 'error' | 'offline' | 'busy' | 'info'
const [popupTitle, setPopupTitle] = useState("");
const [popupMessage, setPopupMessage] = useState("");
const showPopup = (type, title, message) => {
  setPopupType(type);
  setPopupTitle(title);
  setPopupMessage(message);
  setPopupVisible(true);
};

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertData, setCustomAlertData] = useState({
    icon: "",
    title: "",
    message: "",
  });

  const videoRef = useRef(null);


  useEffect(() => {
    fetchMyCounselling();
    fetchCommonVideos();
  }, []);

  // ✅ Fetch My Counselling
  const fetchMyCounselling = async () => {
  try {
    setLoadingMyCounsellors(true); // ✅ Start loading
    const mobile = await AsyncStorage.getItem("mobileNumber");
    if (!mobile) return;
    const res = await axios.get(`${API_BASE_URL}/api/counselling/my/${mobile}`);
    setMyCounsellors(res.data);
  } catch (err) {
    console.error("❌ Error fetching My Counsellors:", err);
    setMyCounsellors([]);
  } finally {
    setLoadingMyCounsellors(false); // ✅ Stop loading
  }
};


  // ✅ Fetch Common Videos
  const fetchCommonVideos = async () => {
    try {
      setLoadingVideos(true);
      const res = await axios.get(`${API_BASE_URL}/api/counselling-videos/all`);
      setVideos(res.data || []);
      setLoadingVideos(false);
    } catch (err) {
      console.error("❌ Common Videos fetch failed:", err);
      setVideos([]);
      setLoadingVideos(false);
    }
  };

  // ✅ Start Call

  const handleCall = async () => {
    if (!selectedAstro || !selectedPackage) return;
    try {
      const mobile = await AsyncStorage.getItem("mobileNumber");
      const payload = {
        fromCust: mobile,
        toAstro: selectedAstro.astroId,
        startTime: new Date().toISOString(),
        duration: selectedPackage.mins,
      };

      const res = await axios.post(`${API_BASE_URL}/api/call/session/start`, payload);
      const sessionId = res.data.id || new Date().getTime();

      await axios.put(`${API_BASE_URL}/api/astrologers/status`, {
        astroId: selectedAstro.astroId,
        status: "busy",
      });

      setMyCounsellors((prev) =>
        prev.map((a) =>
          a.astroId === selectedAstro.astroId ? { ...a, astroStatus: "busy" } : a
        )
      );

      setCurrentSessionId(sessionId);
      setIsSessionActive(true);
      setCountdown(selectedPackage.mins * 60);
      setPackageModalVisible(false);
      setSelectedPackage(null);


      setCustomAlertData({
        icon: "checkmark-circle",
        title: "Call Started",

        message: `Session will last ${selectedPackage.mins} mins`,
      });
      setShowCustomAlert(true);

      setTimeout(() => {
        handleEndSession(sessionId);
      }, selectedPackage.mins * 60 * 1000);

    } catch (err) {
      console.error("❌ Call start failed:", err);
showPopup("error", "Error", "Could not initiate the call.");
    }
  };


  // ✅ End Session

  const handleEndSession = async (sessionId = currentSessionId) => {
    if (!sessionId) return;
    try {
      await axios.put(`${API_BASE_URL}/api/call/session/end/${sessionId}`);

      if (selectedAstro) {
        await axios.put(`${API_BASE_URL}/api/astrologers/status`, {
          astroId: selectedAstro.astroId,
          status: "online",
        });

        setMyCounsellors((prev) =>
          prev.map((a) =>
            a.astroId === selectedAstro.astroId ? { ...a, astroStatus: "online" } : a
          )
        );
      }

      setCustomAlertData({

        icon: "time-outline",
        title: "Session Ended",
        message: "Your counselling session has ended.",

      });
      setShowCustomAlert(true);

      setIsSessionActive(false);
      setCurrentSessionId(null);
      setCountdown(0);
    } catch (err) {
      console.error("❌ End session failed:", err);
showPopup("error", "Error", "Could not end the session.");
    }
    
  };


  // ✅ Countdown Timer

  useEffect(() => {
    let timer;
    if (isSessionActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    if (countdown === 0 && isSessionActive) {
      handleEndSession();
    }
    return () => clearInterval(timer);
  }, [isSessionActive, countdown]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };


  // ✅ My Counselling Card

  const renderAstroCard = ({ item }) => (
   <View style={[styles.card, { flexDirection: "row", alignItems: "center", padding: 12 , }]}>
  {/* ✅ Wrap image and ribbon inside a clipped View */}
  <View style={{ marginRight: 12, position: "relative", width: 80, height: 80, }}>
    {/* ✅ Diagonal OFFER Ribbon */}
    {item.offerActive && item.offerPrice && (
      <View
        style={{
      top: -20,
      left: -35,
      backgroundColor: '#FFD700',
      transform: [{ rotate: '-45deg' }],
      width: 100,
      height: 15,
      justifyContent: 'center', 
      alignItems: 'center',
      zIndex: 2,
      elevation: 2,
        }}
      >
        <Text style={{
          color: 'red',
          fontSize: 7,
          fontWeight: 'bold',
        }}>
          OFFER
        </Text>
      </View>
    )}

    {/* ✅ Astrologer Image */}
    <Image
      source={
        item.astroPhoto || item.astroPhotoBase64
          ? { uri: `data:image/jpeg;base64,${item.astroPhoto || item.astroPhotoBase64}` }
          : require("./assets/Astroicon.jpg")
      }
      style={{ width: 80, height: 80, borderRadius: 40,  backgroundColor: "#eee" }}
    />
  </View>
  
      {/* Right: Details */}
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { fontSize: 16 }]}>{item.astroName}</Text>
        <Text style={styles.detail}>⭐ {item.astroExp} yrs</Text>
        <Text style={styles.detail}>🔮 {item.astroSpec}</Text>
        <Text style={styles.detail}>🌐 {item.astroSpeakLang}</Text>

  
        {/* Call Button */}
        <TouchableOpacity
          style={[
            styles.callBtn,
            {
              width: 110, // reduced button width
              marginTop: 6,
              backgroundColor:
                item.astroStatus === "online"
                  ? "green"
                  : item.astroStatus === "busy"
                  ? "orange"
                  : "red",
            },
          ]}

     onPress={() => {
  if (item.astroStatus === "busy") {
    setStatusModalData({
      title: "Wait in Queue",
      message: "Astrologer is currently busy. Please wait.",
      icon: "time-outline",
      iconColor: '#FFA500'
    });
    setShowStatusModal(true);
    return;
  }

  if (item.astroStatus === "offline") {
    setStatusModalData({
      title: "Offline",
      message: "Astrologer is currently offline.",
      icon: "close-circle-outline",
      iconColor: '#FF4444'
    });
    setShowStatusModal(true);
    return;
  }

  setSelectedAstro(item);
  setPackageModalVisible(true);
}}


        >
          {item.offerActive && item.offerPrice ? (
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.callText, { color: "#fff" }]}>Call per min</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                <Text style={{
                  color: "gold",
                  textDecorationLine: "line-through",
                  fontWeight: "bold",
                  marginRight: 8,
                }}>
                  ₹{Math.round(item.astroRatemin)}
                </Text>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  ₹{Math.round(item.offerPrice)}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.callText, { color: "#fff", textAlign: "center" }]}>
              Call per min{"\n"}₹{Math.round(item.astroRatemin || 10)}

            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
  

  // ✅ Common Videos Card
 const renderVideoCard = ({ item }) => {
  const fullUrl = `${API_BASE_URL}${item.videoUrl}`;
  const uploadedDate = new Date(item.uploadedAt).toLocaleString();
  return (
    <TouchableOpacity style={styles.videoCard} onPress={() => setSelectedVideo(fullUrl)}>
      <Ionicons name="videocam" size={40} color="#FF6100" />
      <Text style={styles.videoTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={{ fontSize: 12, color: "#555" }} numberOfLines={2}>{item.description}</Text>
      <Text style={{ fontSize: 11, color: "#333", marginTop: 2 }}>By: {item.astroName}</Text>
      <Text style={{ fontSize: 11, color: "#777" }}>{uploadedDate}</Text>
    </TouchableOpacity>
  );
};


  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* ✅ Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "MyCounselling" && styles.activeTab]}
          onPress={() => setActiveTab("MyCounselling")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "MyCounselling" && styles.activeTabText,
            ]}
          >
            My Counselling
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "Common" && styles.activeTab]}
          onPress={() => setActiveTab("Common")}
        >
          <Text
            style={[styles.tabText, activeTab === "Common" && styles.activeTabText]}
          >
            Common Counselling
          </Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Active Session Info */}
      {isSessionActive && (
        <View style={styles.activeSessionBox}>
          <Text style={{ color: "red", fontWeight: "bold" }}>
            Session is running... {formatTime(countdown)} left
          </Text>
          <TouchableOpacity
            style={styles.endSessionBtn}
            onPress={() => handleEndSession()}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>End Session</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ✅ Content */}


     {activeTab === "MyCounselling" ? (
     loadingMyCounsellors ? (
    <ActivityIndicator size="large" color="#FF6100" style={{ marginTop: 40 }} />
  ) : myCounsellors.length > 0 ? (
    <FlatList
      data={myCounsellors}
      keyExtractor={(item) => item.astroId}
      renderItem={renderAstroCard}
      contentContainerStyle={{ padding: 10 }}
    />
  ) : ( 
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center",  }}>
      <Text style={{  fontSize: 16, color: "#666" }}>
        No Data found
      </Text>
    </View>)
) : loadingVideos ? (
  <ActivityIndicator size="large" color="#FF6100" style={{ marginTop: 20 }} />
) : videos.length > 0 ? (
  <FlatList
    data={videos}
    keyExtractor={(item) => item.id.toString()}
    renderItem={renderVideoCard}
    contentContainerStyle={{ padding: 10 }}
  />
) : (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text style={{ fontSize: 16, color: "#666" }}>
      No Data found
    </Text>
  </View>
)
      }

      {/* ✅ Video Player Modal */}
      <Modal visible={!!selectedVideo} transparent={false} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "black" }}>
          <TouchableOpacity
            onPress={() => setSelectedVideo(null)}
            style={{
              position: "absolute",
              top: 40,
              right: 20,
              zIndex: 10,
              backgroundColor: "rgba(255,255,255,0.3)",
              padding: 8,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: "white", fontSize: 15 }}>✖</Text>
          </TouchableOpacity>
          {selectedVideo && (
            <Video
              source={{ uri: selectedVideo }}
              style={{ width: "100%", height: "100%" }}
              useNativeControls
              resizeMode="contain"
              shouldPlay
            />
          )}
        </View>
      </Modal>

  
{/* ✅ Custom Alert Modal with Gradient Bottom */}
<Modal visible={showCustomAlert} transparent animationType="fade">
  <View
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <View
      style={{
        width: "80%",
        backgroundColor: "#FFEFE5",
        borderRadius: 20,
        overflow: "hidden",
        elevation: 10,
      }}
    >
      <View
        style={{
          padding: 25,
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "#FFF",
            borderRadius: 20,
            padding: 5,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <Ionicons
            name={customAlertData.icon}
            size={30}
            color={
              customAlertData.title === "Session Ended"
                ? "#FF3B30"
                : "#4BB543"
            }
          />
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: "#1E1E1E",
            marginBottom: 10,
          }}
        >
          {customAlertData.title}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: "#4F4F4F",
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          {customAlertData.message}
        </Text>
      </View>

      <View style={{ height: 1, backgroundColor: "#E0E0E0" }} />

      <LinearGradient
        colors={['#FC2A0D', '#FE9F5D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: 60,
          justifyContent: "center",
          alignItems: "center",
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => setShowCustomAlert(false)}
          style={{
            backgroundColor: "#fff",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 25,
          }}
        >
          <Text style={{ color: "#FC2A0D", fontWeight: "bold", fontSize: 16 }}>
            OK
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>




      {/* ✅ Package Modal */}
      <Modal visible={packageModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select Package for {selectedAstro?.astroName}
            </Text>
            {[30, 60, 90].map((mins) => {
              const total = (selectedAstro?.astroRatemin || 10) * mins;
              return (
                <TouchableOpacity
                  key={mins}
                  style={styles.packageOption}
                  onPress={() => setSelectedPackage({ mins, total })}
                >
                  <Ionicons
                    name={
                      selectedPackage?.mins === mins
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={22}
                    color="#FF6100"
                  />
                  <Text style={{ marginLeft: 8 }}>
                    {mins} min — ₹{total}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {selectedPackage && (
              <TouchableOpacity style={styles.confirmBtn} onPress={handleCall}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Start Call
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setPackageModalVisible(false)}
              style={{ alignItems: "center", marginTop: 10 }}
            >
              <Text style={{ color: "#888" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

{/* wait in queue*/}
    <Modal
  visible={showStatusModal}
  animationType="fade"
  transparent={true}
  onRequestClose={() => setShowStatusModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <View style={styles.iconWrapper}>
        <Icon name={statusModalData.icon} size={30} color={statusModalData.iconColor} />
      </View>
      <Text style={styles.modalTitle}>{statusModalData.title}</Text>
      <Text style={styles.modalMessage}>{statusModalData.message}</Text>

      <LinearGradient
         colors={['#FC2A0D', '#FE9F5D']}
         start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        style={styles.gradientFooter}
      >
        <TouchableOpacity onPress={() => setShowStatusModal(false)} style={styles.okButton}>
          <Text style={styles.okText}>OK</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>
              {/* 🔹 Shared Popup Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={popupVisible}
          onRequestClose={() => setPopupVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              
              {/* ✅ Icon + Text */}
              <View style={styles.contentWrapper}>
                <View style={styles.iconWrapper}>
                  {popupType === "success" && <AntDesign name="checkcircle" size={30} color="#4BB543" />}
                  {popupType === "error" && <AntDesign name="closecircle" size={30} color="#FF3B30" />}
                  {popupType === "offline" && <AntDesign name="closecircle" size={30} color="#FF3B30" />}
                  {popupType === "busy" && <AntDesign name="clockcircle" size={30} color="#FF9500" />}
                  {popupType === "info" && <AntDesign name="infocirlce" size={30} color="#007AFF" />}
                </View>
        
                <Text style={styles.modalTitle}>{popupTitle}</Text>
                <Text style={styles.modalMessage}>{popupMessage}</Text>
              </View>
        
              {/* ✅ Separator */}
              <View style={styles.separator} />
        
              {/* ✅ Gradient Bottom */}
              <LinearGradient
                colors={["#FC2A0D", "#FE9F5D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBottom}
              >
                <TouchableOpacity
                  onPress={() => setPopupVisible(false)}
                  style={styles.okButton}
                >
                  <Text style={styles.okButtonText}>OK</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </Modal>
        

    </View>
  );
};

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 8,
    backgroundColor: "#f6f6f6",
    borderRadius: 30,
    margin: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#FF6100",
  },
  tabText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 14,
  },
  activeTabText: {
    color: "#fff",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff3e0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    overflow: 'hidden', // ✅ this clips the OFFER ribbon

  },
  image: { width: 60, height: 60, borderRadius: 30, marginRight: 10 },
  name: { fontWeight: "bold", fontSize: 16, color: "#333" },
  detail: { fontSize: 12, color: "#555" },
  callBtn: {
    marginTop: 6,
    paddingVertical: 6,
    borderRadius: 5,
    alignItems: "center",
    width: 150,
  },
  callText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  activeSessionBox: {
    backgroundColor: "#fff3e0",
    padding: 10,
    margin: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  endSessionBtn: {
    backgroundColor: "red",
    marginTop: 5,
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  videoCard: {
    backgroundColor: "#fff3e0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  videoTitle: {
    marginTop: 5,
    color: "#FF6100",
    fontSize: 13,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  packageOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  confirmBtn: {
    marginTop: 15,
    backgroundColor: "#FF6100",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
 
   modalButton: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#ff6600',
    fontWeight: 'bold',
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: width * 0.8,
    backgroundColor: "#FFEFE5",
    borderRadius: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconWrapper: {
    marginTop:10,
    backgroundColor: '#FFF',
  borderRadius: 20,        // makes the wrapper round (small)
  padding: 5,              // reduce padding to shrink gap
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 10,        // optional spacing below icon
},
 
  modalMessage: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  gradientFooter: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  okText: {
    color: '#FF2B00',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


export default CustomerCounsellingScreen;