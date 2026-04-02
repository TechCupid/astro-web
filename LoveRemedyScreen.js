import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert,
  KeyboardAvoidingView, Platform, ScrollView, Modal
} from 'react-native';

import api from './api/apiClient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useApi } from './ApiContext';
import { LinearGradient } from 'expo-linear-gradient';

const remedies = [
  'motivation',
  'relationship',
  'health',
  'sleep',
  'workstress',
  'Confidence',
  'General Remedy Plan (Basic)',
];

export default function LoveRemedyScreen({ navigation, route }) {
  const { API_BASE_URL } = useApi();

  // ✅ Extract astroDetails and custCode safely from params
  const { astroDetails, custCode, remedyCat } = route.params || {};
  console.log("✅ LoveRemedy received astroDetails:", astroDetails);

  // ✅ If astroDetails is available, use astroId
  const astroCode = astroDetails?.astroId || '';
  console.log("✅ Using astroCode:", astroCode);

  const [selected, setSelected] = useState('motivation');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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


  const handleSubmit = async () => {
    if (!selected) {
   showPopup("error", "Error", "Please select a remedy.");
      return;
    }

    if (!astroCode) {
      console.warn('🚨 Missing astroCode!');
showPopup("error", "Error", "Astrologer details are missing.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
  astroCode: astroDetails?.astroId, 
  custCode: custCode,
  remedyCat: remedyCat,
  remedyType: selected,
  remedyDtl: comment,
};

      console.log('📦 Submitting payload:', payload);

      const response = await api.post(
        `${API_BASE_URL}/api/astrocust/remedies`,
        payload
      );

      console.log('✅ Remedy submitted successfully:', response.data);
      
      // ✅ Trigger the callback before going back
    if (route.params?.onGoBack) {
      route.params.onGoBack();
    }

    navigation.goBack(); // Go back to existing RemedyCategoryScreen

    } catch (error) {
      console.error('❌ Error submitting remedy:', error);
 showPopup("error", "Error", "Failed to send remedy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

   const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigation.goBack(); // ✅ go back only after user presses OK
  };

return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={80} // adjust if header height differs
  >
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Love Remedy</Text>
        <View style={{ width: 24 }} /> {/* Spacer */}
      </View>

      {/* Wrap the list in ScrollView to allow scrolling when keyboard opens */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <FlatList
          data={remedies}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => setSelected(item)}
            >
              <View style={styles.radioCircle}>
                {selected === item && <View style={styles.selectedRb} />}
              </View>
              <Text style={styles.itemText}>{item}</Text>
              <Text style={styles.remediesCount}>21 Remedies</Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <View style={{ paddingBottom: 20 }}>
              <Text style={styles.commentLabel}>Your Comment</Text>
              <TextInput
                placeholder="Enter any custom remedy comment"
                style={styles.commentBox}
                value={comment}
                onChangeText={setComment}
                multiline
              />
            </View>
          
          }
        />
      </ScrollView>

      {/* Submit Button at Bottom */}
      <TouchableOpacity
        style={[styles.button, loading && { backgroundColor: '#aaa' }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Submitting...' : 'Submit Remedy'}
        </Text>
      </TouchableOpacity>
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
  </KeyboardAvoidingView>
);

}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: { fontSize: 18, fontWeight: 'bold' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  selectedRb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
  },
  itemText: { flex: 1, fontSize: 16, textTransform: 'capitalize' },
  remediesCount: { fontSize: 14, color: '#555' },
  commentLabel: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  commentBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 100,
    padding: 10,
    marginHorizontal: 16,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#FF7300',
    padding: 16,
    margin: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 40,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
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
