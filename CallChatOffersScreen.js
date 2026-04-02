import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  
  Linking,
  Modal,
} from 'react-native';
import api from './api/apiClient';
import { useApi } from './ApiContext';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
  import { AntDesign } from '@expo/vector-icons';
  import { startAstroChat } from "./AstroCustChatFlow";

  

export default function CallChatOffersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { API_BASE_URL } = useApi();
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);
 
const [showCustomAlert, setShowCustomAlert] = useState(false);
const [customAlertData, setCustomAlertData] = useState('');
const [thankYouModalVisible, setThankYouModalVisible] = useState(false);
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

const [showThankYouModal, setShowThankYouModal] = useState(false);

  useEffect(() => {
    fetchOfferAstrologers();
  }, []);

  const fetchOfferAstrologers = async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/api/offer/active/details`);
      setAstrologers(response.data || []);
    } catch (error) {
      console.error('❌ Failed to fetch offer astrologers:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAstrologer = ({ item }) => {
    console.log(`🔍 ${item.astroName} — Offer: ₹${item.offerRate}, RateMin: ₹${item.astroRatemin}`);

const oldPrice = item?.originalRate ?? item?.astroRatemin ?? 10;
const finalPrice = item?.offerRate ?? item?.astroRatemin ?? 10;
    const status = item?.astroStatus || 'offline';

return (
<View style={styles.card}>
  {item.offerRate && item.offerRate > 0 && (
    <View style={styles.offerRibbon}>
      <Text style={styles.offerRibbonText}>OFFER</Text>
    </View>
  )}
<Image
          source={
            item.astroPhotoBase64
              ? { uri: `data:image/jpeg;base64,${item.astroPhotoBase64}` }
              : require('./assets/Astroicon.jpg')
          }
          style={styles.image}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.astroName || 'Astrologer'}</Text>

          {/* Newly added fields */}
          {item?.astroSpec && <Text style={styles.meta}>Spec: {item.astroSpec}</Text>}
          {item?.astroSpeakLang && <Text style={styles.meta}>Lang: {item.astroSpeakLang}</Text>}
          {item?.astroExp !== undefined && <Text style={styles.meta}>Exp: {item.astroExp} yrs</Text>}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.callPriceButton, { backgroundColor: '#FF0000' }]}
              onPress={() => {
                if (item?.astroMobile) {
                  Linking.openURL(`tel:${item.astroMobile}`);
                } else {
  showPopup("error", "Error", "Mobile number not available");
                }
              }}
            >
              <Text style={styles.buttonTitle}>Call per min</Text>
              <View style={{ flexDirection: 'row', marginTop: 2 }}>
                <Text style={styles.strike}>₹{Math.round(oldPrice)}</Text>
                <Text style={styles.offerRate}> ₹{Math.round(finalPrice)}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.callPriceButton, 
                {
                  backgroundColor:
                    status === 'online' ? 'green' : status === 'busy' ? 'orange' : 'red',
                },
              ]}
              onPress={async () => {
  if (!item?.astroId) {
    showPopup("error", "Error", "Astrologer ID is missing.");
    return;
  }

  try {
    if (status === "online") {
      // ✅ Use centralized chat flow
      startAstroChat(item, navigation, API_BASE_URL);
    } else if (status === "busy") {
      setCustomAlertData({
        icon: "time-outline",
        title: "Wait in Queue",
        iconColor: "#FFA500",
        message: "Astrologer is currently busy. Please wait.",
      });
      setShowCustomAlert(true);
    } else {
      setCustomAlertData({
        icon: "close-circle-outline",
        title: "Offline",
        iconColor: "#FF3B30",
        message: "Astrologer is currently offline.",
      });
      setShowCustomAlert(true);
    }
  } catch (error) {
    console.error("Chat init error:", error);
    showPopup("error", "Error", "Unable to initiate chat.");
  }
}}

            >
              <Text style={styles.buttonTitle}>
                {status === 'online'
                  ? 'Chat per min'
                  : status === 'busy'
                  ? 'Busy, Please Wait'
                  : 'Astrologer is Offline'}
              </Text>
              {status === 'online' && (
                <View style={{ flexDirection: 'row', marginTop: 2 }}>
                  <Text style={styles.strike}>₹{Math.round(oldPrice)}</Text>
                  <Text style={styles.offerRate}> ₹{Math.round(finalPrice)}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#FF7300" style={{ marginTop: 40 }} />;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Text style={styles.header}>Astrologers with Call/Chat Offers</Text>
        <FlatList
          data={astrologers}
          keyExtractor={(item, index) => item?.astroId?.toString() || index.toString()}
          renderItem={renderAstrologer}
        />

       
      </View>

<Modal visible={showCustomAlert} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <View style={styles.contentWrapper}>
        <View style={styles.iconWrapper}>
          <Ionicons
            name={customAlertData.icon}
            size={30}
            color={customAlertData.iconColor || '#4BB543'}
          />
        </View>
        <Text style={styles.modalTitle}>{customAlertData.title}</Text>
        <Text style={styles.modalMessage}>{customAlertData.message}</Text>
      </View>

      <View style={styles.separator} />
      <LinearGradient
        colors={['#FC2A0D', '#FE9F5D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBottom}
      >
        <TouchableOpacity
          onPress={() => setShowCustomAlert(false)}
          style={styles.okButton}
        >
          <Text style={styles.okButtonText}>OK</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>

<Modal visible={thankYouModalVisible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalBox}>
        <View style={styles.contentWrapper}>
          <View style={styles.iconWrapper}>
            <AntDesign name="smileo" size={30} color="#4CAF50" />
          </View>
          <Text style={styles.modalTitle}>Thank You!</Text>
          <Text style={styles.modalMessage}>Your feedback has been submitted successfully.</Text>
        </View>
  
        <View style={styles.separator} />
        <LinearGradient
          colors={['#FC2A0D', '#FE9F5D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBottom}
        >
          <TouchableOpacity
            onPress={() => setThankYouModalVisible(false)}
            style={styles.okButton}
          >
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
                      
  
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 12 },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    borderRadius: 10,
    marginBottom: 12,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
      overflow: 'hidden',    // ✅ Ensure ribbon is visible outside bounds

  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 14,
    alignSelf:'center',  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  metaCenter: {
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
    marginBottom: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  callPriceButton: {
    flex: 1,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTitle: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
  strike: {
    textDecorationLine: 'line-through',
    color: 'yellow',
    fontSize: 14,
  },
  offerRate: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
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

offerRibbon: {
  position: 'absolute',
  top: 10,
  left: -30,
  backgroundColor: '#FFD700',
  paddingHorizontal: 40,
  paddingVertical: 4,
  transform: [{ rotate: '-45deg' }],
  zIndex: 10,
  height:20,
  alignItems: 'center',
  justifyContent: 'center',
},
offerRibbonText: {
  color: 'red',
  fontWeight: 'bold',
  fontSize: 7,
  textAlign: 'center',
},


});