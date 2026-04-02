import React, { useState, useEffect } from 'react';
import { useApi } from './ApiContext'; 
import { StyleSheet, View, Text, TouchableOpacity,Modal,Alert} from 'react-native';
import axios from 'axios';
import { AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const AstroRegistrationComplete = ({ navigation, route }) => {
  const { API_BASE_URL } = useApi();
  const { astroMobile } = route.params;
  const [loading, setLoading] = useState(true);
  const [astrologer, setAstrologer] = useState(null);
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/astrologers/${astroMobile}`);
      setAstrologer(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showPopup("error", "Error", "Failed to fetch data from the server.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Navigate when astrologer is loaded and APPROVED
  useEffect(() => {
    if (!loading && astrologer?.astroVerifyStatus === 'APPROVED') {
        navigation.navigate('AstroMainScreen', { astroId: astroMobile });
      //console.log("Test");
    }
  }, [loading, astrologer]);

  if (loading || !astrologer) {
    return null; // or a loading spinner
  }

  if (astrologer.astroVerifyStatus !== 'APPROVED') {
    return (
     
      <View style={styles.container}>
        <Text style={styles.title}>
          Registration Completed. A new page will arrive soon.
        </Text>
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
{popupType === "info" && <AntDesign name="infocircle" size={30} color="#007AFF" />}
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
  }

  return null; // nothing to render, since we navigated
};

const styles = StyleSheet.create({
  
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0f0a0aff',
    textAlign: 'center',
  },
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

export default AstroRegistrationComplete;
