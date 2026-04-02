import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,

  Modal,
  Dimensions,
} from 'react-native';
import api from './api/apiClient';
import { useApi } from './ApiContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
// 1️⃣ Import missing dependencies at top
import { AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { startAstroChat } from "./AstroCustChatFlow"; 




const { width } = Dimensions.get('window');

const MyAstrologersScreen = () => {
  const { API_BASE_URL } = useApi();
  const navigation = useNavigation();
  const [favourites, setFavourites] = useState([]);
  const [customerId, setCustomerId] = useState('');
 
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
    const fetchFavourites = async () => {
      const custCode = await AsyncStorage.getItem('mobileNumber');
      setCustomerId(custCode);

      try {
        const res = await api.get(`${API_BASE_URL}/api/astro/favourites/${custCode}`);
        setFavourites(res.data || []);
      } catch (err) {
        console.error('Failed to fetch favourites:', err);
      }
    };

    fetchFavourites();
  }, []);

  const handleCall = (astro) => {
    navigation.navigate('CallScreen', {
      astroId: astro.astroId,
      customerId,
      astroName: astro.astrologierInfo?.astroName || 'Astrologer',
    });
  };


const handleChat = (astro) => {
  const info = astro?.astrologierInfo;
  const status = info?.astroStatus || "offline";

  if (status === "online") {
    startAstroChat(info, navigation, API_BASE_URL); // ✅ pass astrologierInfo only
  } else if (status === "busy") {
    showPopup("busy", "Wait in Queue", "Astrologer is currently busy. Please wait.");
  } else {
    showPopup("offline", "Offline", "Astrologer is currently offline.");
  }
};


  const renderItem = ({ item }) => {
    const astro = item.astrologierInfo;
    const status = astro?.astroStatus || 'offline';
    const astroName = astro?.astroName || 'Astrologer';
    const oldPrice = astro?.astroRatemin || 10;
    const hasOffer = astro?.offerActive && astro?.offerPrice > 0;
    const newPrice = hasOffer ? astro.offerPrice : oldPrice;

    return (
      <View style={styles.cardWrapper}>
        <View style={styles.card}>
          {hasOffer && (
            <View style={styles.offerRibbon}>
              <Text style={styles.offerRibbonText}>OFFER</Text>
            </View>
          )}

          <Image
            source={{ uri: `data:image/jpeg;base64,${item.astroPhoto}` }}
            style={styles.image}
          />

          <View style={styles.info}>
            <Text style={styles.name}>{astroName}</Text>
            <Text style={styles.detail}>Exp: {item.astroExp} yrs</Text>
            <Text style={styles.detail}>Lang: {item.astroSpeakLang}</Text>
            <Text style={styles.detail}>Spec: {item.astroSpec}</Text>

            <View style={styles.buttonRow}>
              {/* Call Button */}
              <TouchableOpacity
                style={[
                  styles.callBtn,
                  {
                    backgroundColor:
                      status === 'online'
                        ? 'green'
                        : status === 'busy'
                        ? 'orange'
                        : 'red',
                  },
                ]}
                onPress={() => handleCall(item)}
              >
                {hasOffer ? (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.callText}>Call per min</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Text style={styles.oldPrice}>₹{Math.round(oldPrice)}</Text>
                      <Text style={styles.newPrice}>₹{Math.round(newPrice)}</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.callText}>
                    Call per min{'\n'}₹{Math.round(newPrice)}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Chat Button */}
              <TouchableOpacity
                style={[
                  styles.chatBtn,
                  {
                    backgroundColor:
                      status === 'online'
                        ? 'green'
                        : status === 'busy'
                        ? 'orange'
                        : 'red',
                  },
                ]}
                onPress={() => handleChat(item)}
              >
                {hasOffer ? (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.chatText}>Chat per min</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Text style={styles.oldPrice}>₹{Math.round(oldPrice)}</Text>
                      <Text style={styles.newPrice}>₹{Math.round(newPrice)}</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.chatText}>
                    {status === 'online' && `Chat per min\n₹${Math.round(newPrice)}`}
                    {status === 'busy' && 'Busy\nPlease wait'}
                    {status === 'offline' && 'Offline'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        My Favourite Astrologers ({favourites.length})
      </Text>
      <FlatList
        data={favourites}
        renderItem={renderItem}
        keyExtractor={(item) => item.astroId}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No favourites yet.</Text>}
      />

   
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
};

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff8e1',
    marginBottom: 12,
    elevation: 2,
  },
  card: {
    flexDirection: 'row',
    padding: 10,
    position: 'relative',
  },
  image: {
    top:30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ddd',
    
  },
  info: {
    marginLeft: 10,
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  detail: {
    fontSize: 13,
    color: '#555',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  callBtn: {
    padding: 6,
    borderRadius: 6,
    width: 100,
    marginRight: 10,
  },
  chatBtn: {
    padding: 6,
    borderRadius: 6,
    width: 100,
  },
  chatText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 12,
  },
  callText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 12,
  },
  oldPrice: {
    textDecorationLine: 'line-through',
    color: 'gold',
    marginRight: 6,
    fontWeight: 'bold',
    fontSize: 12,
  },
  newPrice: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  offerRibbon: {
    position: 'absolute',
    top: 20,
    left: -35,
    backgroundColor: '#FFD700',
    paddingHorizontal: 50,
    paddingVertical: 4,
    transform: [{ rotate: '-45deg' }],
    zIndex: 1,
    minWidth:15,
    
  },
  offerRibbonText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 6,
    textAlign: 'center',
   
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 24,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  confirmBtn: {
    backgroundColor: '#FF6B00',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
   successOverlay: {
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

export default MyAstrologersScreen;
