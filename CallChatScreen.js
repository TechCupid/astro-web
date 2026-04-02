import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert,Modal,} from "react-native";
import api from './api/apiClient';
import { useApi } from "./ApiContext";
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';


const CallChatScreen = ({ route }) => {
  const { API_BASE_URL } = useApi();
  const { astroDetails } = route.params;
    const [successModalVisible, setSuccessModalVisible] = useState(false);
const [errorModalVisible, setErrorModalVisible] = useState(false);
const [message, setMessage] = useState('');
const [modalType, setModalType] = useState('success'); // or 'error'



  const [originalRate, setOriginalRate] = useState(astroDetails?.astroRatemin || 0);
  const [offerPercent, setOfferPercent] = useState(
    astroDetails?.offerActive ? astroDetails?.discountPercentage || 0 : 0
  );
  const [offerRate, setOfferRate] = useState(
    astroDetails?.offerActive ? astroDetails?.offerPrice : originalRate
  );
  const [hasActiveOffer, setHasActiveOffer] = useState(astroDetails?.offerActive || false);

  useEffect(() => {
  const loadSavedOffer = async () => {
    try {
      const savedData = await AsyncStorage.getItem(`offer_${astroDetails.astroId}`);
      if (savedData) {
        const { offerPercent: savedPercent } = JSON.parse(savedData);
        if (savedPercent === 0) {
          setOfferPercent(0);
          setOfferRate(originalRate);
          setHasActiveOffer(false);
        } else {
          setOfferPercent(savedPercent);
          const rate = (originalRate - (originalRate * savedPercent) / 100).toFixed(2);
          setOfferRate(rate);
          setHasActiveOffer(true);
        }
      }
    } catch (e) {
      console.log('Error loading saved offer:', e);
    }
  };

  loadSavedOffer();
}, []);


  useEffect(() => {
    if (offerPercent > 0) {
      setOfferRate((originalRate - (originalRate * offerPercent) / 100).toFixed(2));
    } else {
      setOfferRate(originalRate);
    }
  }, [offerPercent, originalRate]);

  /** ✅ Submit Offer (Activate or Update Offer) */
  const handleSubmit = async () => {
  try {
    if (offerPercent === 0) {
      await api.put(`${API_BASE_URL}/api/offer/reset/${astroDetails.astroId}`);
      setHasActiveOffer(false);
      setOfferRate(originalRate);

      // Save "no offer" to AsyncStorage
      await AsyncStorage.setItem(
        `offer_${astroDetails.astroId}`,
        JSON.stringify({ offerPercent: 0 })
      );

      setModalType('success');
      setMessage('Offer removed successfully.');
      setSuccessModalVisible(true);
      return;
    }

    await api.post(`${API_BASE_URL}/api/offer/activate`, {
      astroId: astroDetails.astroId,
      discountPercentage: offerPercent,
      offerRate: parseFloat(offerRate),
      endDate: null,
    });

    setHasActiveOffer(true);

    // Save selected offer % to AsyncStorage
    await AsyncStorage.setItem(
      `offer_${astroDetails.astroId}`,
      JSON.stringify({ offerPercent })
    );

    setModalType('success');
    setMessage('Offer activated successfully!');
    setSuccessModalVisible(true);
  } catch (err) {
    console.error("Offer activation error:", err);
    setModalType('error');
    setMessage('Failed to activate offer.');
    setErrorModalVisible(true);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.label}>Current Rate (₹)</Text>
      <TextInput
        value={String(originalRate)}
        editable={false}
        style={styles.readOnlyInput}
      />

      <Text style={styles.label}>Offer %</Text>
      <View style={styles.buttonRow}>
        {[10, 25, 50, 75].map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.offerButton,
              offerPercent === p && styles.selectedButton
            ]}
            onPress={() => setOfferPercent(p)}
          >
            <Text
              style={[
                styles.offerText,
                offerPercent === p && { color: "#fff" }
              ]}
            >
              {p}%
            </Text>
          </TouchableOpacity>
        ))}

        {hasActiveOffer && (
          <TouchableOpacity
            style={[
              styles.offerButton,
              offerPercent === 0 && styles.selectedButton,
              { backgroundColor: "#ccc" }
            ]}
            onPress={() => setOfferPercent(0)}
          >
            <Text style={styles.offerText}>No Offer</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.label}>Offer Rate (₹)</Text>
      <TextInput
        value={String(offerRate)}
        editable={false}
        style={styles.readOnlyInput}
      />

      {/* ✅ Submit Button */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={successModalVisible} animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <View style={styles.contentWrapper}>
                  <View style={styles.iconWrapper}>
      <AntDesign name="checkcircle" size={30} color="green" />
      </View>
      <Text style={styles.modalTitle}>Success</Text>
      <Text style={styles.modalMessage}>{message}</Text>
      </View>
      <View style={styles.separator} />

      <LinearGradient  colors={['#FC2A0D', '#FE9F5D']}  start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }} style={styles.gradientBottom}>
        <TouchableOpacity
          style={styles.okButton}
          onPress={() => setSuccessModalVisible(false)}
        >
          <Text style={styles.okText}>OK</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>

<Modal transparent visible={errorModalVisible} animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <View style={styles.contentWrapper}>
                  <View style={styles.iconWrapper}>
      <Ionicons name="close-circle" size={50} color="red" />
      </View>
      <Text style={styles.modalTitle}>Error</Text>
      <Text style={styles.modalMessage}>{message}</Text>
      </View>

  {/* ✅ Separator */}
          <View style={styles.separator} />
      <LinearGradient
                  colors={['#FC2A0D', '#FE9F5D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }} style={styles.gradientBottom}>
        <TouchableOpacity
          style={styles.okButton}
          onPress={() => setErrorModalVisible(false)}
        >
          <Text style={styles.okText}>OK</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1 },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 15 },
  readOnlyInput: {
    borderWidth: 1,
    borderColor: "#FF6633",
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: "#f0f0f0"
  },
  buttonRow: { flexDirection: "row", marginTop: 10 },
  offerButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FF6633",
    marginRight: 5,
    borderRadius: 5,
    alignItems: "center"
  },
  selectedButton: { backgroundColor: "#FF6633" },
  offerText: { color: "#333" },
  submitBtn: {
    flex: 1,
    backgroundColor: "#FF6633",
    padding: 12,
    marginTop: 15,
    borderRadius: 5,
    alignItems: "center"
  },
  submitText: { color: "#fff", fontWeight: "bold" },
    modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
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
  okText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CallChatScreen;