import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { useApi } from './ApiContext';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from "@expo/vector-icons";
import { Modal } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import AntDesign from '@expo/vector-icons/AntDesign';


const TABS = ['Call/Chat History', 'Remedy', 'Counselling'];

const AstrologerChatHistoryScreen = () => {
  const { API_BASE_URL } = useApi();
  const navigation = useNavigation();

  const [history, setHistory] = useState([]);
  const [remedies, setRemedies] = useState([]); // 🆕 Remedy data
  const [loading, setLoading] = useState(true);
  const [loadingRemedies, setLoadingRemedies] = useState(false); // 🆕 Remedy loader
  const [selectedTab, setSelectedTab] = useState('Call/Chat History');
  const [myCounsellors, setMyCounsellors] = useState([]);
const [loadingCounselling, setLoadingCounselling] = useState(false);

const [packageModalVisible, setPackageModalVisible] = useState(false);
const [selectedAstro, setSelectedAstro] = useState(null);
const [selectedPackage, setSelectedPackage] = useState(null);
const [currentSessionId, setCurrentSessionId] = useState(null);
const [isSessionActive, setIsSessionActive] = useState(false);
const [countdown, setCountdown] = useState(0);

const [showPopup, setShowPopup] = useState(false);
const [popupMessage, setPopupMessage] = useState('');
const [popupType, setPopupType] = useState('info'); // 'info', 'success', 'error'


  // Fetch chat history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const custMobile = await AsyncStorage.getItem('mobileNumber');
        if (!custMobile) {
setPopupMessage("Customer mobile not found.");
setPopupType("error");
setShowPopup(true);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/custastro/chat-history/${custMobile}`);
        setHistory(response.data);
      } catch (error) {
        console.error('Fetch error:', error);
setPopupMessage("Unable to load chat history.");
setPopupType("error");
setShowPopup(true);


      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Fetch remedies when Remedy tab is selected
  useEffect(() => {
    const fetchRemedies = async () => {
      setLoadingRemedies(true);
      try {
        const custMobile = await AsyncStorage.getItem('mobileNumber');
        if (!custMobile) {
        setPopupMessage("Customer mobile not found.");
        setPopupType("error");
        setShowPopup(true);

          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/astrocust/remedies/by-cust/${custMobile}`);
        setRemedies(response.data);
        console.log('✅ Remedies fetched:', response.data);
      } catch (error) {
        console.error('Remedy fetch error:', error);
      setPopupMessage("Unable to load remedies.");
      setPopupType("error");
      setShowPopup(true);
        
      } finally {
        setLoadingRemedies(false);
      }
    };

    if (selectedTab === 'Remedy') {
      fetchRemedies();
    }
  }, [selectedTab]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${item.base64Photo}` }}
            style={styles.photo}
          />
          <Text style={styles.name}>{item.astroName}</Text>
        </View>
        <Text style={styles.status}>Completed</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.label}>Mode of Communication:</Text>
        <View style={styles.iconLabelRow}>
          {item.mode?.toLowerCase() === 'call' ? (
            <>
              <FontAwesome name="phone" size={18} color="#FF6633" />
              <Text style={styles.mode}>  Call</Text>
            </>
          ) : (
            <TouchableOpacity
              onPress={async () => {
                const custCode = await AsyncStorage.getItem('mobileNumber');
                navigation.navigate('ChatDetailScreen', {
                  astroCode: item.astroCode,
                  custCode: custCode,
                  astroName: item.astroName,
                  astroPhoto: item.base64Photo,
                });
              }}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <FontAwesome name="comment" size={18} color="#FF6633" />
              <Text style={styles.mode}>  Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <MaterialCommunityIcons name="calendar" size={16} color="#FF6633" />
        <Text style={styles.datetime}>  {formatDate(item.chatDate)}</Text>
        <View style={{ flex: 1 }} />
        <MaterialCommunityIcons name="clock-time-four" size={16} color="#FF6633" />
        <Text style={styles.datetime}>  {formatTime(item.chatDate)}</Text>
      </View>
    </View>
  );

 const renderRemedyItem = ({ item }) => (
  <View style={[styles.card, { padding: 12 }]}>
    {/* 🟠 Remedy Category as heading */}
    <Text style={styles.remedyHeading}>{item.remedyCat || 'Remedy'}</Text>

    {/* Remedy Type */}
    <Text style={styles.remedyText}>Type: <Text style={styles.remedyValue}>{item.remedyType}</Text></Text>

    {/* Remedy Details */}
    <Text style={styles.remedyText}>
      Details: <Text style={styles.remedyDtl}>{item.remedyDtl || 'No details provided.'}</Text>
    </Text>

    <View style={{ marginTop: 6 }} /> {/* 👈 Add space before time */}
    <View style={styles.row}>
      <MaterialCommunityIcons name="calendar" size={16} color="#FF6633" />
      <Text style={styles.datetime}>  {formatDate(item.remedyTime)}</Text>
      <View style={{ flex: 1 }} />
      <MaterialCommunityIcons name="clock-time-four" size={16} color="#FF6633" />
      <Text style={styles.datetime}>  {formatTime(item.remedyTime)}</Text>
    </View>
  </View>
);


  const renderTabContent = () => {
    if (selectedTab === 'Call/Chat History') {
  if (loading) {
    return <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 30 }} />;
  }

  if (!history || history.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No call/chats found.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={history}
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={{ padding: 10 }}
    />
  );


    } else if (selectedTab === 'Remedy') {
      if (loadingRemedies) {
        return <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 30 }} />;
      }
      if (remedies.length === 0) {
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No remedies found.</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={remedies}
          renderItem={renderRemedyItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ padding: 10 }}
        />
      );
    } else if (selectedTab === 'Counselling') {
  if (loadingCounselling) {
    return <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 30 }} />;
  }

  if (myCounsellors.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No counselling history found.</Text>
      </View>
    );
  }
const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

  return (
    <>
      {/* ✅ Active Session Box */}
      {isSessionActive && (
        <View style={styles.activeSessionBox}>
          <Text style={{ color: "red", fontWeight: "bold" }}>
          Session is running... {formatCountdown(countdown)} left

          </Text>
          <TouchableOpacity
            style={styles.endSessionBtn}
            onPress={() => handleEndSession()}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>End Session</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={myCounsellors}
        keyExtractor={(item) => item.astroId}
        renderItem={renderAstroCard}
        contentContainerStyle={{ padding: 10 }}
      />
    </>
  );
};
  }
 

  const fetchMyCounselling = async () => {
  try {
    setLoadingCounselling(true);
    const mobile = await AsyncStorage.getItem("mobileNumber");
    if (!mobile) return;

    const res = await axios.get(`${API_BASE_URL}/api/counselling/my/${mobile}`);
    setMyCounsellors(res.data);
    setLoadingCounselling(false);
  } catch (err) {
    console.error("❌ My Counselling fetch failed:", err);
    setMyCounsellors([]);
    setLoadingCounselling(false);
  }
};

useEffect(() => {
  fetchMyCounselling();
}, []);


const renderAstroCard = ({ item }) => (
  <View style={[styles.card, { flexDirection: "row", alignItems: "center", padding: 12, overflow:'hidden'}]}>
    {/* Left: Astro Photo with OFFER badge */}
    <View style={{ marginRight: 12, marginTop: -8, position: "relative" }}>
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

      
      <Image
        source={
          item.astroPhoto || item.astroPhotoBase64
            ? { uri: `data:image/jpeg;base64,${item.astroPhoto || item.astroPhotoBase64}` }
            : require("./assets/Astroicon.jpg")
        }
        style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#eee" }}
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
  setPopupMessage("Astrologer is currently busy.");
  setPopupType("busy");
  setShowPopup(true);
            return;
          }
          if (item.astroStatus === "offline") {
  setPopupMessage("Astrologer is currently offline.");
  setPopupType("offline");
  setShowPopup(true);

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




// --- START CALL ---
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

    setTimeout(() => {
      handleEndSession(sessionId);
    }, selectedPackage.mins * 60 * 1000);
  } catch (err) {
    console.error("❌ Call start failed:", err);
                setPopupMessage("Could not initiate the call.");
setPopupType("Error"); // or "error" if you want red
setShowPopup(true);

  }
};

// --- END SESSION ---
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

    setIsSessionActive(false);
    setCurrentSessionId(null);
    setCountdown(0);
  } catch (err) {
    console.error("❌ End session failed:", err);
                setPopupMessage("Could not end the session.");
setPopupType("Error"); // or "error" if you want red
setShowPopup(true);

  }
};

// --- TIMER ---
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

// --- FORMAT TIME (add if not already) ---



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTabContent()}
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
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Start Call</Text>
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
{/* ✅ Shared Info/Error/Success/Offline/Busy Popup */}
{showPopup && (
  <Modal animationType="fade" transparent visible={showPopup}>
    <View style={styles.successOverlay}>
      <View style={styles.modalBox}>
        <View style={styles.contentWrapper}>
          <View style={styles.iconWrapper}>
            <AntDesign
              name={
                popupType === "success"
                  ? "checkcircle"
                  : popupType === "error"
                  ? "closecircle"
                  : popupType === "offline"
                  ? "closecircle"
                  : popupType === "busy"
                  ? "clockcircle"
                  : "infocirlce"
              }
              size={30}
              color={
                popupType === "success"
                  ? "#4BB543" // green
                  : popupType === "error"
                  ? "#FF3B30" // red
                  : popupType === "offline"
                  ? "#FF3B30" // red for offline too
                  : popupType === "busy"
                  ? "#FF9500" // orange for busy
                  : "#007BFF" // blue for info
              }
            />
          </View>

          <Text style={styles.modalTitle}>
            {popupType === "success"
              ? "Success"
              : popupType === "error"
              ? "Error"
              : popupType === "offline"
              ? "Offline"
              : popupType === "busy"
              ? "Busy"
              : "Info"}
          </Text>

          <Text style={styles.modalMessage}>{popupMessage}</Text>
        </View>

        <View style={styles.separator} />

        <LinearGradient
          colors={["#FC2A0D", "#FE9F5D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBottom}
        >
          <TouchableOpacity
            onPress={() => setShowPopup(false)}
            style={styles.okButton}
          >
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  </Modal>
)}


    </SafeAreaView>
    
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#FF6633',
  },
  tabText: {
    fontSize: 14,
    color: '#444',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
 
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  name: { fontWeight: 'bold', fontSize: 16 },
  status: { color: '#555', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontWeight: 'bold', color: '#444' },
  iconLabelRow: { flexDirection: 'row', alignItems: 'center' },
  mode: { fontWeight: 'bold', color: '#333' },
  datetime: { color: '#333' },
  remedyTitle: { fontSize: 16, fontWeight: 'bold', color: '#FF6633', marginBottom: 4 },
  remedyType: { fontSize: 14,fontWeight: 'bold', color: '#444', marginBottom: 2 },
 remedyDtl: {
  fontWeight: 'bold',
  fontSize: 14,
  color: '#333', // grey for label
  marginBottom: 2,
},
remedyHeading: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#FF6633', // 🟠 category in orange
  marginBottom: 6, // 👈 spacing below heading
},

remedyText: {
  fontSize: 14,
  color: '#444',
  marginBottom: 4, // 👈 space between lines
},

remedyDtl: {
  color: '#FF6633', // only details in orange
  fontSize: 14,
},

card: {
  backgroundColor: '#fff3e0',
  borderRadius: 10,
  padding: 10,
  marginBottom: 15,  // 👈 more space between remedy cards
  elevation: 2,
},


  remedyDate: { fontSize: 12, color: '#777' },

placeholder: {
flex: 1, 
justifyContent: "center",
 alignItems: "center", 
},
placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
},

  image: { width: 60, height: 60, borderRadius: 30, marginRight: 10 },
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
  // ✅  Modal Popup
   successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
 modalOverlay: {
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
  borderRadius: 20,        // makes the wrapper round (small)
  padding: 5,              // reduce padding to shrink gap
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 10,        // optional spacing below icon
},
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E1E1E',
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

});

export default AstrologerChatHistoryScreen;
