import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  Linking,
  Image,
  Animated,
  Dimensions,
  SafeAreaView,
  AppState,
   Platform, 
     TextInput,
     ScrollView, 
} from "react-native";
import api from './api/apiClient';


import { useApi } from "./ApiContext";
import { useNavigation, CommonActions } from "@react-navigation/native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from 'expo-linear-gradient';
import AntDesign from '@expo/vector-icons/AntDesign';
import { FontAwesome, Ionicons, MaterialIcons, Entypo, MaterialCommunityIcons, } from '@expo/vector-icons';
import messaging from '@react-native-firebase/messaging';
import eventEmitter from './EventEmitter';  // ✅ already used in customer side




const { width } = Dimensions.get("window");

const AstroMainScreen = ({ navigation, route }) => {
  const { API_BASE_URL } = useApi();
  const routeAstroId = route.params?.astroId; // 🟢 From route
  const [astroDetails, setAstroDetails] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-width))[0];
  const [counsellorModalVisible, setCounsellorModalVisible] = useState(false);
const [eligibleCounsellors, setEligibleCounsellors] = useState([]);
const [selectedCustomer, setSelectedCustomer] = useState(null);

const [successModalVisible, setSuccessModalVisible] = useState(false);

 const [uploading, setUploading] = useState(false);
const [videoTitle, setVideoTitle] = useState("");
const [videoDesc, setVideoDesc] = useState("");
const [videoModalVisible, setVideoModalVisible] = useState(false);
const [selectedFile, setSelectedFile] = useState(null);
const [showSuccessModal, setShowSuccessModal] = useState(false);

 const [astroImageUri, setAstroImageUri] = useState(null);

 // Filters state
const [selectedSkills, setSelectedSkills] = useState([]);
const [selectedLanguages, setSelectedLanguages] = useState([]);
const [sortBy, setSortBy] = useState('Relevance');
const [searchQuery, setSearchQuery] = useState('');
const [filteredCounsellors, setFilteredCounsellors] = useState([]);

const [popupVisible, setPopupVisible] = useState(false);
const [popupType, setPopupType] = useState("");     // 'success' | 'error' | 'offline' | 'busy' | 'info'
const [popupTitle, setPopupTitle] = useState("");
const [popupMessage, setPopupMessage] = useState("");
const [chatRequestVisible, setChatRequestVisible] = useState(false);
const [incomingChat, setIncomingChat] = useState(null);


const showPopup = (type, title, message) => {
  setPopupType(type);
  setPopupTitle(title);
  setPopupMessage(message);
  setPopupVisible(true);
};



const skills = [ 'Vedic astrology', 'Tarot expert', 'Numerology', 'Naadi', 'Prashna kundli', 'Love astrology', 'Healing', 'Palmistry'];
const languages = ['Tamil','English', 'Telungu', 'Malayalam', 'Kannada', 'Hindi'];
const sortOptions = ['Relevance', 'Experience (High to Low)', 'Name (A-Z)', 'Name (Z-A)'];

const [showSkills, setShowSkills] = useState(false);
const [showLanguages, setShowLanguages] = useState(false);
const [showRelevance, setShowRelevance] = useState(false);

const [logoutVisible, setLogoutVisible] = useState(false);

// Track assigned states per customer (local, per session)
const [sessionAssignments, setSessionAssignments] = useState({});

// inside your component's state
const [openDropdown, setOpenDropdown] = useState(null);

const toggleDropdown = (type) => {
  setOpenDropdown(openDropdown === type ? null : type);
};



 


useEffect(() => {
  const loadMobile = async () => {
    try {
      const mobile =
        (await AsyncStorage.getItem("mobileNumber")) || 
        (await AsyncStorage.getItem("userMobile"));

      if (mobile) {
        await AsyncStorage.setItem("mobileNumber", mobile);
        await AsyncStorage.removeItem("userMobile");
      }
    } catch (error) {
      console.log("Error fetching mobile from storage", error);
    }
  };
  loadMobile();
}, []);


useEffect(() => {
  if (Platform.OS === 'web') return;
  // 🟢 Listen for new chat requests sent from customers
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('📩 Incoming FCM (Astro side):', remoteMessage);

    if (remoteMessage.data?.type === 'chat_request') {
      const { custId, custName, astroId } = remoteMessage.data;

     setIncomingChat({ custId, custName, astroId });
     setChatRequestVisible(true);

    }
  });

  return unsubscribe;
}, [astroDetails]);



// astro photo  and and astrologer dtails 
const fetchAndMergeAstroDetails = async (id) => {
  try {
    // 1️⃣ Fetch basic info (photo, name, mobile)
    const basicRes = await api.get(`${API_BASE_URL}/api/astrologers/basic/${id}`);
    let mergedData = { ...basicRes.data };

    if (basicRes.data.astroPhotoBase64?.trim()) {
      const uri = `data:image/png;base64,${basicRes.data.astroPhotoBase64}`;
      setAstroImageUri(uri);
      await AsyncStorage.setItem("astroProfileImage", uri);
    }

    // 2️⃣ Fetch full details
    const fullRes = await api.get(`${API_BASE_URL}/api/astrologers/${id}`);
    mergedData = { ...mergedData, ...fullRes.data }; // merge full data

    setAstroDetails(mergedData);
    await AsyncStorage.setItem("loggedInAstro", JSON.stringify(mergedData));

  } catch (err) {
    console.warn("⚠ Failed to load astrologer details:", err);

    const stored = await AsyncStorage.getItem("loggedInAstro");
    if (stored) {
      const parsed = JSON.parse(stored);
      setAstroDetails(parsed);

      const uri = await AsyncStorage.getItem("astroProfileImage");
      if (uri) setAstroImageUri(uri);
    }
  }
};

useEffect(() => {
  const loadAstro = async () => {
    // ✅ Try route param first, fallback to AsyncStorage
    const finalId = routeAstroId || await AsyncStorage.getItem("activeAstroCode");
    if (finalId) {
      fetchAndMergeAstroDetails(finalId);
    } else {
      console.warn("⚠️ No astroId found in route or AsyncStorage");
    }
  };
  loadAstro();
}, [routeAstroId]);



  // ✅ Fetch customer list
 const fetchCustomerList = async (id) => {
  try {
    const response = await api.get(`${API_BASE_URL}/api/astro/chatcust/${id}`);
    const list = Array.isArray(response.data) ? response.data : [];

    let savedAssignments = {};
    // Use for...of to ensure AsyncStorage completes before setting state
    for (const item of list) {
      const dateKey = item.chatDate ? item.chatDate.split("T")[0] : "date";
      const sessionKey = `${item.custCode}_${dateKey}`;
      const stored = await AsyncStorage.getItem(sessionKey);
      if (stored) {
        savedAssignments[sessionKey] = JSON.parse(stored);
      }
    }

    setSessionAssignments(savedAssignments);
    setCustomers(list);
  } catch (err) {
    console.error("❌ Web Fetch Error:", err);
  } finally {
    setLoading(false); // 👈 Ensure this is called so the spinner stops
  }
};


  useEffect(() => {
    if (routeAstroId) {
      fetchCustomerList(routeAstroId);
    } else {
      // Fallback to stored astroId
      const loadAstroFromStorage = async () => {
        const storedAstro = await AsyncStorage.getItem("loggedInAstro");
        if (storedAstro) {
          const parsedAstro = JSON.parse(storedAstro);
          console.log("✅ Using astroId from AsyncStorage:", parsedAstro.astroId);
          fetchCustomerList(parsedAstro.astroId);
        } else {
          console.error("❌ No astroId available in route or AsyncStorage");
        }
      };
      loadAstroFromStorage();
    }
  }, [routeAstroId]);

  // FOR FILTERING OPTIONS
  useEffect(() => {
  applyFilters();
}, [eligibleCounsellors, selectedSkills, selectedLanguages, sortBy, searchQuery]);


  // ✅ Handle App going to background
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextAppState) => {
      if (nextAppState === "background" && astroDetails?.astroId) {
        await api.put(`${API_BASE_URL}/api/astrologers/status`, {
          astroId: astroDetails.astroId,
          status: "online",
        });
      }
    });
    return () => sub.remove();
  }, [astroDetails]);

  // ✅ Handle menu animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: menuVisible ? 0 : -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [menuVisible]);

const fetchEligibleCounsellors = async () => {
  try {
    const res = await api.get(`${API_BASE_URL}/api/astrologers/eligible-counsellors`);
    setEligibleCounsellors(res.data);
    setCounsellorModalVisible(true);
  } catch (err) {
    console.error("❌ Error fetching counsellors:", err);
    showPopup("error", "Error", "Could not load eligible counsellors.");

  }
};
const assignCounsellor = async (recommendedAstroId) => {
 

  if (!selectedCustomer || !astroDetails?.astroId) return;

  try {
    await api.post(`${API_BASE_URL}/api/astrologers/assign-counsellor`, {
      custCode: selectedCustomer.custCode,
      recommendedByAstro: astroDetails.astroId,
      recommendedAstro: recommendedAstroId,
    });

  // Show custom success modal instead of Alert
const dateKey = selectedCustomer.chatDate.split("T")[0];
const sessionKey = `${selectedCustomer.custCode}_${dateKey}`;

setSessionAssignments(prev => {
  const updated = {
    ...prev,
    [sessionKey]: {
      ...prev[sessionKey],
      counselling: true,
      remedy: prev[sessionKey]?.remedy ?? false
    },
  };

  AsyncStorage.setItem(
    sessionKey,
    JSON.stringify(updated[sessionKey])
  );

  return updated;
});



setSuccessModalVisible(true);
  setCounsellorModalVisible(false);


  } catch (err) {
    console.error("❌ Error assigning counsellor:", err);
    showPopup("error", "Error", "Could not assign counsellor.");

  }
};    


  // ✅ Format date & time
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

const renderCustomersItem = ({ item }) => {

  // Generate unique key for this session

const sessionKey = `${item.custCode}_${item.chatDate.split("T")[0]}`;



  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{item.custName}</Text>
        <Text style={styles.status}>completed</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.label}>Mode of Communication:</Text>
        <View style={{ flex: 1 }} />
        <View style={styles.iconLabelRow}>
          {item.mode?.toLowerCase() === "call" ? (
            <>
              <FontAwesome name="phone" size={18} color="#FF6633" />
              <Text style={styles.mode}> Call</Text>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("ChatScreen", {
                  astroId: astroDetails?.astroId || routeAstroId,
                  name: item.custName,
                  fromScreen: "ASTRO",
                  custId: item.custCode,
                  custCode: item.custCode,
                  mobileNumber: item.custCode,
                  viewOnly: true,
                });
              }}
              style={[styles.iconBtn, { flexDirection: "row", alignItems: "center" }]}
            >
              <FontAwesome name="comment" size={18} color="#FF6633" />
              <Text style={styles.mode}> Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.smallLabel}>Date</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.smallLabel}>Time</Text>
      </View>

      <View style={styles.row}>
        <MaterialCommunityIcons name="calendar" size={16} color="#FF6633" />
        <Text style={styles.datetime}> {formatDate(item.chatDate)}</Text>
        <View style={{ flex: 1 }} />
        <MaterialCommunityIcons name="clock-time-four" size={16} color="#FF6633" />
        <Text style={styles.datetime}> {formatTime(item.chatDate)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.earningRow}>
        <Text style={styles.earningLabel}>Total Earning:</Text>
        <Text style={styles.earningAmount}>₹{item.earning || 0}.00</Text>
      </View>

      <View style={styles.divider} />

     {/* Buttons */}
<View style={styles.buttonRow}>

  {/* Counselling Button */}
  <TouchableOpacity
    style={{
      backgroundColor:
        sessionAssignments[sessionKey]?.counselling ? "#ccc" : "#FF6633",
      padding: 10,
      borderRadius: 8,
      marginRight: 6,
      minWidth: 140,
      opacity: sessionAssignments[sessionKey]?.counselling ? 0.6 : 1,
      alignItems: "center",
      justifyContent: "center",
    }}
    disabled={sessionAssignments[sessionKey]?.counselling}
    onPress={() => {
      setSelectedCustomer(item);
      fetchEligibleCounsellors();
    }}
  >
    <Text
      style={{
        color: sessionAssignments[sessionKey]?.counselling ? "#000" : "#fff",
        fontWeight: "600",
      }}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {sessionAssignments[sessionKey]?.counselling
        ? "Counselling Assigned"
        : "Assign Counselling"}
    </Text>
  </TouchableOpacity>

  {/* Remedy Button */}
 
<TouchableOpacity
  style={{
    backgroundColor:
      sessionAssignments[sessionKey]?.remedy ? "#ccc" : "#FF6633",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    opacity: sessionAssignments[sessionKey]?.remedy ? 0.6 : 1,
    alignItems: "center",
  }}
  disabled={sessionAssignments[sessionKey]?.remedy}
  onPress={() => {
    navigation.navigate("RemedyScreen", {
      astroDetails: astroDetails,
      custCode: item.custCode,

     onAssigned: async () => {
  // 1️⃣ Update the state first using functional update
  setSessionAssignments(prev => {
    const updated = {
      ...prev,
      [sessionKey]: {
        ...prev[sessionKey],
        remedy: true,
      },
    };

    // 2️⃣ Save the UPDATED object into AsyncStorage
    AsyncStorage.setItem(
      sessionKey,
      JSON.stringify(updated[sessionKey])
    );

    return updated;
  });

  console.log("🔥 Remedy saved locally for session:", sessionKey);
}

    });
  }}
>
  <Text
    style={{
      color: sessionAssignments[sessionKey]?.remedy ? "#000" : "#fff",
      fontWeight: "600",
    }}
  >
    {sessionAssignments[sessionKey]?.remedy
      ? "Remedy Assigned"
      : "Assign Remedy"}
  </Text>
</TouchableOpacity>


</View>
    </View>
  );
};


  // Menu & Navigation remains unchanged...
  const menuItems = [
    { icon: "person", label: "My Profile Info" },
    { icon: "email", label: "Contact Us" },
    { icon: "contacts", label: "Astro TIS Contacts" },
     { icon: "rss-feed", label: "Blog" }, // ✅ THIS ONE
    { icon: "book", label: "Spiritual Shopping" },
    { icon: "event-note", label: "Notice Board" },
    { icon: "description", label: "Terms And Conditions" },
    { icon: "security", label: "Privacy Policy" },
    { icon: "business", label: "About Us" },
     { icon: "settings", label: "Setting" },
     {icon: "event", label: "Organize an Event" },  // ✅ NEW EVENT SCREEN
  ];


// ✅ Pick & Upload Video
const handleFinalUpload = async (selectedFile) => {
  if (!selectedFile) return;

  try {
    setUploading(true);
    const formData = new FormData();
    
    formData.append("astroId", astroDetails?.astroId || routeAstroId);
    formData.append("astroName", astroDetails?.astroName || "Astrologer");
    formData.append("title", videoTitle);
    formData.append("description", videoDesc);

    if (Platform.OS === 'web') {
      // ✅ WEB FIX: Web requires the actual blob/file object
      // selectedFile.file is provided by expo-document-picker on web
      formData.append("file", selectedFile.file);
    } else {
      // ✅ MOBILE FIX:
      const uri = Platform.OS === "ios" ? selectedFile.uri.replace("file://", "") : selectedFile.uri;
      formData.append("file", {
        uri: uri,
        name: selectedFile.name || "video.mp4",
        type: selectedFile.mimeType || "video/mp4",
      });
    }

    await api.post(`${API_BASE_URL}/api/counselling-videos/upload`, formData, {
      headers: { 
        "Content-Type": "multipart/form-data",
      },
      // Important for large video files:
      transformRequest: (data, headers) => {
        return data; 
      },
    });

    setShowSuccessModal(true);
    setVideoModalVisible(false);
    setVideoTitle("");
    setVideoDesc("");
    setSelectedFile(null);
  } catch (err) {
    console.error("❌ Upload failed:", err);
    Alert.alert("Upload Error", err.response?.data?.message || "Failed to upload video. Check file size.");
  } finally {
    setUploading(false);
  }
};
// ✅ Open picker first
const pickAndOpenModal = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "video/*",
    });

    if (!result.canceled && result.assets?.length > 0) {
      setSelectedFile(result.assets[0]); // ✅ Save the selected video
      setVideoModalVisible(true);        // ✅ Open Title + Description modal
    }
  } catch (err) {
    console.error("❌ File selection failed:", err);
  }
};

// FILTERING 

const applyFilters = () => {
  let result = [...eligibleCounsellors];

  // Filter by skills
  if (selectedSkills.length > 0) {
    result = result.filter((astro) =>
      selectedSkills.some(skill =>
        astro.astroSpec?.toLowerCase().includes(skill.toLowerCase())
      )
    );
  }

  // Filter by languages
  if (selectedLanguages.length > 0) {
    result = result.filter((astro) =>
      selectedLanguages.some(lang =>
        astro.astroSpeakLang?.toLowerCase().includes(lang.toLowerCase())
      )
    );
  }

  // Search filter
  if (searchQuery.trim() !== '') {
    result = result.filter((astro) =>
      astro.astroName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Sorting
  switch (sortBy) {
    case 'Experience (High to Low)':
      result.sort((a, b) => (b.astroExp || 0) - (a.astroExp || 0));
      break;
    case 'Name (A-Z)':
      result.sort((a, b) => a.astroName?.localeCompare(b.astroName));
      break;
    case 'Name (Z-A)':
      result.sort((a, b) => b.astroName?.localeCompare(a.astroName));
      break;
    default:
      break; // Relevance = no change
  }

  setFilteredCounsellors(result);
};


const handleLogout = async () => {
  try {
    setLogoutVisible(false);

    await AsyncStorage.clear();

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'AstromobileFlow' }],
      })
    );

  } catch (error) {
    console.error("Logout process failed:", error);
    navigation.navigate('AstromobileFlow');
  }
};



 return (
  <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
    {/* ✅ FIX: Use minHeight/maxHeight for Web stability */}
    <View style={{ flex: 1, maxHeight: Platform.OS === 'web' ? '100vh' : '100%' }}>
      
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={30} color="white" />
        </TouchableOpacity>
        <View>
          <Text style={styles.greeting}>Hello</Text>
  <Text style={styles.astroName}>
    {astroDetails?.astroName || 'Astrologer'}
  </Text>
        </View>
           
           {/*LOGOUT */}
           
       <TouchableOpacity onPress={handleLogout}>
      <Ionicons name="log-out" size={30} color="white" />
    </TouchableOpacity>

{/* Custom Logout Modal */}
<Modal
  visible={logoutVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setLogoutVisible(false)}
>
  <View style={{
    flex: 1, height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  }}>
    <View style={{
       backgroundColor: '#FFEFE6',
      borderRadius: 16,
      width: '80%',
      overflow: 'hidden',
      alignItems: 'center',
    }}>
      
      {/* Icon */}
      <View style={{
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FF6B00',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
      }}>
        <Ionicons name="log-out" size={28} color="#fff" />
      </View>

      {/* Title */}
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#222' }}>
        Confirm Logout
      </Text>

      {/* Message */}
      <Text style={{
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginVertical: 10,
        paddingHorizontal: 20,
        paddingVertical:7,
      }}>
        Are you sure you want to logout?
      </Text>

      {/* Bottom Gradient Section */}
      <LinearGradient
        colors={['#FC2A0D', '#FE9F5D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'center',
          padding: 10,
        }}
      >
        {/* Cancel Button */}
        <TouchableOpacity
          onPress={() => setLogoutVisible(false)}
          style={{
             width: 100,
            backgroundColor: '#fff',
             paddingHorizontal: 20,
            paddingVertical: 10,
            marginHorizontal: 4,
            borderRadius: 20, 
            alignItems: 'center',
             justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FC2A0D', fontWeight: 'bold', fontSize: 16 }}>
            Cancel
          </Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
      onPress={async () => {
  try {
    // 1️⃣ Set astro offline
    await api.put(`${API_BASE_URL}/api/astrologers/status`, {
      astroId: astroDetails?.astroId,
      status: "offline",
    });

    // 2️⃣ CLEAR SESSION DATA
    await AsyncStorage.multiRemove([
      "ASTRO_JWT",        // 🔐 VERY IMPORTANT
      "loggedInAstro",
      "activeAstroCode",
    ]);

    setLogoutVisible(false);

   navigation.goBack();    // 🔥 go back to AstromobileFlow

  } catch (error) {
    Alert.alert("Error", "Logout failed.");
  }
}}

          style={{
             width: 100,
            backgroundColor: '#fff',
            paddingVertical: 10,
            paddingHorizontal: 20,
            marginHorizontal: 4,
            borderRadius: 20,
            alignItems: 'center',
             justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FC2A0D', fontWeight: 'bold', fontSize: 16 }}>
            Logout
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>

      </View>

      <FlatList
  data={customers}
  renderItem={renderCustomersItem}
  keyExtractor={(item) => item.custCode.toString()}
  style={{ flex: 1, height: 0 }} // ✅ height: 0 forces it to use flex logic on Web
  contentContainerStyle={{ 
    padding: 10, 
    paddingBottom: 150 // ✅ Large padding so the footer doesn't cover the last card
  }} 
/>

      {/* ✅ Footer Fixed at Bottom */}
    
<View style={styles.footer}>
  <TouchableOpacity
    style={styles.footerItem}
    onPress={() => {
      fetchCustomerList(astroDetails?.astroId);
    }}
  >
    <Ionicons name="home" size={18} color="#FF6633" />  {/* 🔽 reduced from 22 to 18 */}
    <Text style={styles.footerText}>Home</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.footerItem}
    onPress={() => {
      navigation.navigate("RemedyCategory", {
        astroDetails: astroDetails,
      });
    }}
  >
    <MaterialCommunityIcons name="leaf" size={18} color="#FF6633" /> {/* 🔽 reduced */}
    <Text style={styles.footerText}>Remedy</Text>
  </TouchableOpacity>
   {/* ✅ New Counselling Button */}
        <TouchableOpacity
  style={styles.footerItem}
  onPress={pickAndOpenModal}
  disabled={uploading}
>
  <Ionicons name="videocam" size={26} color={uploading ? "gray" : "#FF6100"} />
  <Text style={styles.footerText}>{uploading ? "Uploading..." : "Counselling"}</Text>
</TouchableOpacity>


</View>

    </View>
    <Modal visible={videoModalVisible} transparent animationType="slide">
  <View style={{ flex: 1, height: '100%', justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
    <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 10, width: "80%" }}>
      <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Upload Counselling Video</Text>
      <TextInput
        placeholder="Enter Title"
        value={videoTitle}
        onChangeText={setVideoTitle}
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 8, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Enter Description"
        value={videoDesc}
        onChangeText={setVideoDesc}
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 8, marginBottom: 10 }}
      />
      <TouchableOpacity
        style={{ backgroundColor: "#FF6100", padding: 10, borderRadius: 5, alignItems: "center" }}
        onPress={() => handleFinalUpload(selectedFile)}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Upload</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setVideoModalVisible(false)} style={{ marginTop: 10, alignItems: "center" }}>
        <Text style={{ color: "#555" }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>



    {/* Menu Modal (unchanged) */}
    <Modal visible={menuVisible} transparent animationType="none">
      <TouchableOpacity
        activeOpacity={1}
        style={styles.modalOverlay1}
        onPress={() => setMenuVisible(false)}
      >
        <Animated.View
          style={[styles.menu, { transform: [{ translateX: slideAnim }] }]}
        >
          <View style={styles.profileContainer}>
           <Image
            source={astroImageUri ? { uri: astroImageUri } : require("./assets/Astroicon.jpg")}
            style={styles.profileImage}
          />


            <Text style={styles.profileName}>
              {astroDetails ? astroDetails.astroName : "Astrologer"}
            </Text>
            <Text style={styles.profilePhone}>
              {astroDetails ? astroDetails.astroMobile : "Mobile"}
            </Text>
          </View>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                if (item.label === "My Profile Info")
                  navigation.navigate("AstroProfileInfo");
                else if (item.label === "Contact Us")
                  navigation.navigate("ContactUs");
                else if (item.label === "Astro TIS Contacts")
                  navigation.navigate("AstroTISContacts");
                 else if (item.label === "Blog")
                  navigation.navigate("AstroBlogScreen",{astroDetails});
                else if (item.label === "Spiritual Shopping")
                  navigation.navigate("SpiritualBooks");
                else if (item.label === "About Us")
                  navigation.navigate("AboutUs");
                else if (item.label === "Setting")
                  navigation.navigate("AstroSettingScreen", { astroDetails });
                else if (item.label === "Terms And Conditions")
                  navigation.navigate("AstroTermsAndConditionScreen");
                else if (item.label === "Privacy Policy")
                 navigation.navigate("AstroPrivacyPolicyScreen");
                else if (item.label === "Organize an Event")
                  navigation.navigate("AstroEventScreen",{ astroDetails });
              }}
            >
              <MaterialIcons
                name={item.icon}
                size={20}
                style={styles.menuIcon}
              />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Entypo name="chevron-right" size={20} color="#888" />
            </TouchableOpacity>
          ))}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
    

    {/* SLEECT COUNSELLOR MODAL*/}
<Modal visible={counsellorModalVisible} transparent animationType="slide">
  <View style={{ flex: 1, height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
    <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 15, maxHeight: '80%' }}>
      
      <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10, textAlign: "center", color: "#0B0B45" }}>
        Select a Counsellor
      </Text>

      <ScrollView>

         {/* Search Bar */}
        <TextInput
          placeholder="Search astrologer..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 8,
            borderRadius: 8,
            marginTop: 10,
            marginBottom: 10
          }}
        />

        {/* Filter Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <TouchableOpacity style={styles.filterButton} onPress={() => toggleDropdown('skills')}>
            <Text style={styles.filterText}>Skills</Text>
            <Ionicons name={openDropdown === 'skills' ? "chevron-up" : "chevron-down"} size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={() => toggleDropdown('languages')}>
            <Text style={styles.filterText}>Languages</Text>
            <Ionicons name={openDropdown === 'languages' ? "chevron-up" : "chevron-down"} size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={() => toggleDropdown('relevance')}>
            <Text style={styles.filterText}>Relevance</Text>
            <Ionicons name={openDropdown === 'relevance' ? "chevron-up" : "chevron-down"} size={18} />
          </TouchableOpacity>

            {/* Reset All Button */}
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: '#ccc' }]}
            onPress={() => {
              setSelectedSkills([]);
              setSelectedLanguages([]);
              setSortBy(null);
            }}
          >
            <Text style={[styles.filterText, { color: '#000' }]}>Reset</Text>
          </TouchableOpacity>

        </View>

        {/* Skills Dropdown */}
        {openDropdown === 'skills' && (
          <View style={styles.dropdownContainer}>
            {skills.map((skill) => (
              <TouchableOpacity
  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}
  onPress={() =>
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }
>
  <Ionicons
    name={selectedSkills.includes(skill) ? 'checkbox' : 'square-outline'}
    size={20}
    color={selectedSkills.includes(skill) ? '#FF6633' : '#ccc'}
  />
  <Text style={{ marginLeft: 8 }}>{skill}</Text>
</TouchableOpacity>
            ))}
          </View>
        )}

        {/* Languages Dropdown */}
        {openDropdown === 'languages' && (
          <View style={styles.dropdownContainer}>
            {languages.map((lang) => (
              <TouchableOpacity
  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}
  onPress={() =>
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }
>
  <Ionicons
    name={selectedLanguages.includes(lang) ? 'checkbox' : 'square-outline'}
    size={20}
    color={selectedLanguages.includes(lang) ? '#FF6633' : '#ccc'}
  />
  <Text style={{ marginLeft: 8 }}>{lang}</Text>
</TouchableOpacity>

            ))}
          </View>
        )}

        {/* Relevance Dropdown */}
        {openDropdown === 'relevance' && (
          <View style={styles.dropdownContainer}>
            {sortOptions.map((option) => (
             <TouchableOpacity
  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}
  onPress={() => setSortBy(option)}
>
  <Ionicons
    name={sortBy === option ? 'checkbox' : 'square-outline'}
    size={20}
    color={sortBy === option ? '#FF6633' : '#ccc'}
  />
  <Text style={{ marginLeft: 8 }}>{option}</Text>
</TouchableOpacity>

            ))}
          </View>
        )}

       

        {/* Counsellor List */}
        <FlatList
          data={filteredCounsellors}
          keyExtractor={(item) => item.astroId}
          renderItem={({ item }) => (
            <View style={{ flexDirection: "row", backgroundColor: "#F9F9F9", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 10, alignItems: "center" }}>
              <Image
                source={item.astroPhotoBase64 ? { uri: `data:image/jpeg;base64,${item.astroPhotoBase64}` } : require("./assets/Astroicon.jpg")}
                style={{ width: 60, height: 60, borderRadius: 30, marginRight: 12, borderWidth: 1, borderColor: "#ccc" }}
              />
              <View style={{ flex: 1, height: '100%', justifyContent: 'center' }}>
                <Text style={{ fontWeight: "bold", fontSize: 16, color: "#333" }}>{item.astroName}</Text>
                <Text style={{ color: "#555" }}>🌐 {item.astroSpeakLang || "N/A"}</Text>
                <Text style={{ color: "#555" }}>🔮 {item.astroSpec || "N/A"}</Text>
                <Text style={{ color: "#555" }}>⭐ {item.astroExp || 0} yrs</Text>
                <TouchableOpacity
                  style={{ backgroundColor: "#FF6633", marginTop: 8, paddingVertical: 6, borderRadius: 5, alignItems: "center", width: 90 }}
                  onPress={() => assignCounsellor(item.astroId)}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Assign</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        <TouchableOpacity
        style={{
          marginTop: 10,
          backgroundColor: "#A9A9A9",
          padding: 10,
          borderRadius: 5,
          alignItems: "center",
        }}
        onPress={() => setCounsellorModalVisible(false)}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
      </TouchableOpacity>

      </ScrollView>

     

    </View>
  </View>
</Modal>





{/* COUNSELLING VIDEO POP UP*/}
<Modal visible={showSuccessModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          
          {/* ✅ Icon + Text */}
          <View style={styles.contentWrapper}>
            <View style={styles.iconWrapper}>
            <AntDesign name="checkcircle" size={30} color="#4BB543"  />
            </View>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalMessage}>Video uploaded successfully!</Text>
          </View>

          {/* ✅ Separator */}
          <View style={styles.separator} />

          {/* ✅ Gradient Bottom */}
          <LinearGradient
           colors={['#FC2A0D', '#FE9F5D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBottom}
          >
      <TouchableOpacity onPress={() => setShowSuccessModal(false)} style={styles.okButton}>
        <Text style={styles.okButtonText}>OK</Text>
      </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>

{/* MODAL POP UP*/}
<Modal
  animationType="fade"
  transparent={true}
  visible={successModalVisible}
  onRequestClose={() => setSuccessModalVisible(false)}
>
  <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          
          {/* ✅ Icon + Text */}
          <View style={styles.contentWrapper}>
            <View style={styles.iconWrapper}>
            <AntDesign name="checkcircle" size={30} color="#4BB543"  />
            </View>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalMessage}>Counsellor assigned successfully.</Text>
          </View>

          {/* ✅ Separator */}
          <View style={styles.separator} />

          {/* ✅ Gradient Bottom */}
          <LinearGradient
           colors={['#FC2A0D', '#FE9F5D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBottom}
          >
        <TouchableOpacity onPress={() => setSuccessModalVisible(false)} style={styles.okButton}>
          <Text style={styles.okButtonText}>OK</Text>
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
          {popupType === "success" && <AntDesign name="checkcircle" size={40} color="#4BB543" />}
          {popupType === "error" && <AntDesign name="closecircle" size={40} color="#FF3B30" />}
          {popupType === "offline" && <AntDesign name="closecircle" size={40} color="#FF3B30" />}
          {popupType === "busy" && <AntDesign name="clockcircle" size={40} color="#FF9500" />}
          {popupType === "info" && <AntDesign name="infocirlce" size={40} color="#007AFF" />}
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
{/* 🟠 New Chat Request Modal (Styled like other modals) */}
<Modal visible={chatRequestVisible} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={[styles.modalBox, { backgroundColor: "#FFEFE5" }]}>
      {/* 🟢 Header Content */}
      <View style={styles.contentWrapper}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name="message-text" size={35} color="#FF6B00" />
        </View>
        <Text style={[styles.modalTitle, { color: "#1E1E1E" }]}>New Chat Request</Text>
        <Text style={[styles.modalMessage, { marginTop: 5 }]}>
          {incomingChat?.custName
            ? `${incomingChat.custName} wants to chat with you.`
            : "You have a new chat request."}
        </Text>
      </View>

      {/* 🟢 Divider */}
      <View style={styles.separator} />

      {/* 🟠 Gradient Buttons */}
      <LinearGradient
        colors={["#FC2A0D", "#FE9F5D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradientBottom,
          { flexDirection: "row", justifyContent: "center" },
        ]}
      >
        {/* ❌ Reject */}
        <TouchableOpacity
          style={[styles.okButton, { marginHorizontal: 10, width: 100 }]}
          onPress={async () => {
            try {
              await api.post(`${API_BASE_URL}/api/chat/request/reject`, {
                custId: incomingChat.custId,
                astroId: incomingChat.astroId,
              });
              console.log("❌ Chat request rejected.");
            } catch (err) {
              console.error("❌ Reject failed:", err);
            } finally {
              setChatRequestVisible(false); // close popup
              showPopup("info", "Chat Rejected", "You rejected the chat request.");
            }
          }}
        >
          <Text style={{ color: "#FC2A0D", fontWeight: "bold", fontSize: 16 }}>
            Reject
          </Text>
        </TouchableOpacity>

        {/* ✅ Accept */}
        <TouchableOpacity
          style={[styles.okButton, { marginHorizontal: 10, width: 100 }]}
          onPress={async () => {
            try {
              setChatRequestVisible(false); // close popup immediately

              await api.post(`${API_BASE_URL}/api/chat/request/accept`, {
                custId: incomingChat.custId,
                astroId: incomingChat.astroId,
                astroName: astroDetails?.astroName || "Astrologer",
              });

              await api.put(`${API_BASE_URL}/api/astrologers/status`, {
                astroId: incomingChat.astroId,
                status: "busy",
              });

              console.log("✅ Chat accepted. Waiting for customer...");
              showPopup(
                "success",
                "Chat Accepted",
                "Waiting for customer to start chat..."
              );
            } catch (err) {
              console.error("❌ Accept failed:", err);
              showPopup("error", "Error", "Could not accept chat request.");
            }
          }}
        >
          <Text style={{ color: "#FC2A0D", fontWeight: "bold", fontSize: 16 }}>
            Accept
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>

  </SafeAreaView>

);

};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FF6600", // Orange
    padding: 15,
  },

  greeting: { color: "white", fontSize: 16, fontWeight:'bold' },
  astroName: {alignItems: 'flex-start',fontSize: 16, fontWeight:'bold', color: '#fff',marginTop: 2},

  card: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "lightgrey",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 8,
    marginHorizontal: 12,
  },
  name: { fontWeight: "bold", fontSize: 16 },
  status: { color: "black", fontWeight: "bold" },
  label: {
    color: "#666",
    fontWeight: "bold",
    marginTop: 2,
    paddingHorizontal: 12,
  },
  smallLabel: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 4,
  },
  iconLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  datetime: { color: "#333" },
  mode: { fontWeight: "bold", color: "#333" },
  earningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  earningLabel: { fontWeight: "bold", color: "#000" },
  earningAmount: { fontWeight: "bold", color: "#000" },
  buttonRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  buttonOrange: {
    flex: 1, 
    backgroundColor: "#FF6633",
    padding: 10,
    marginRight: 6,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonGray: {
    flex: 1, 
    backgroundColor: "#A9A9A9",
    padding: 10,
    marginLeft: 6,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  menu: {
    width: width * 0.75,
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingHorizontal: 15,
    shadowColor: "#000",
    elevation: 10,
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 20,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    paddingBottom: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },
  profileName: { fontSize: 16, fontWeight: "bold" },
  profilePhone: { fontSize: 12, color: "#888" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  menuIcon: { marginRight: 10, color: "#444" },
  menuLabel: { flex: 1, fontSize: 14, color: "#333" },
  modalOverlay1: {
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-start",
  },

footer: {
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
  backgroundColor: "#fff",
  borderTopWidth: 1,
  borderColor: "#ccc",
  paddingVertical: 10,
  position: "absolute",
  bottom: Platform.OS === 'web' ? 75 : 30, // 👈 Lowered for web stability
  left: 10,
  right: 10,
  borderRadius: 15,
  elevation: 5,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  zIndex: 100, // 👈 Ensures footer stays above the list
},

footerItem: {
  alignItems: "center",
  justifyContent: "center",
},
footerText: {
  fontSize: 12,
  color: "#555",
  marginTop: 2,
},
filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#eee',
    borderRadius: 8,
    flex: 1, 
    justifyContent: 'space-between',
    marginHorizontal: 3
  },
  filterText: {
    fontWeight: 'bold',
    color: '#000'
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5
  },
searchBar: {
  borderWidth: 1,
  borderColor: '#ccc',
  padding: 8,
  borderRadius: 8,
  marginBottom: 10,
},
filterSection: {
  marginBottom: 10,
},

//new modal 

 modalOverlay: {
    flex: 1, height: '100%',
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

export default AstroMainScreen;