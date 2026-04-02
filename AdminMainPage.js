import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import axios from 'axios';
import { useApi } from './ApiContext';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import AntDesign from '@expo/vector-icons/AntDesign';

// ==========================================
// AXIOS INTERCEPTORS (CLEANED)
// ==========================================
axios.interceptors.request.use(
  (request) => {
    console.log('➡️ Admin Outgoing Request:', request.url);
    // Explicitly ensuring no invalid auth tokens are attached for admin public paths
    return request;
  },
  (error) => {
    console.log('❌ Request Error:', error.message);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log('✅ Admin Response Status:', response.status);
    return response;
  },
  (error) => {
    console.log('❌ Admin Response Error:', error.response?.status || error.message);
    return Promise.reject(error);
  }
);

// ==========================================
// HELPER COMPONENTS
// ==========================================
const InfoRow = ({ label, value, multiline = false }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    {multiline ? (
      <Text style={styles.infoValueMultiline}>{value || 'N/A'}</Text>
    ) : (
      <Text style={styles.infoValue}>{value || 'N/A'}</Text>
    )}
  </View>
);

// --- PENDING DETAILS MODAL COMPONENT ---
const AstroPendingDetailsModal = ({
  docData,
  onClose,
  onApprove,
  onReject,
  ratePerMinute,
  setRatePerMinute,
  handleSubmitRate,
}) => {
  if (!docData) return null;

  const convert = (b64) =>
    b64 && b64.trim() !== "" ? `data:image/jpeg;base64,${b64}` : null;

  const renderImage = (b64, fallback) => {
    const uri = convert(b64);
    if (!uri) return <Text style={styles.noFileText}>{fallback}</Text>;
    return (
      <Image
        source={{ uri }}
        style={styles.previewImage}
        resizeMode="contain"
      />
    );
  };

  return (
    <Modal animationType="fade" transparent visible={!!docData}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { width: "92%" }]}>
          <View style={[styles.contentWrapper, { padding: 16 }]}>
            <AntDesign name="filetext1" size={30} color="#f76b00" style={{ marginBottom: 10 }} />
            <Text style={[styles.modalTitle, { color: "#f76b00" }]}>
              Second Registration Details
            </Text>

            <ScrollView style={styles.infoScroll} contentContainerStyle={{ paddingBottom: 10 }}>
              <InfoRow label="Mobile" value={docData.astroId} />
              <View style={styles.separatorThin} />

              <Text style={styles.previewTitle}>Astrologer Photo</Text>
              {renderImage(docData.astroPhoto, "No photo uploaded")}

              <Text style={styles.previewTitle}>PAN Card</Text>
              {renderImage(docData.astroCert1, "No PAN uploaded")}

              <Text style={styles.previewTitle}>Aadhar Card</Text>
              {renderImage(docData.astroCert2, "No Aadhar uploaded")}

              <Text style={styles.previewTitle}>Certificate</Text>
              {renderImage(docData.astroCert5, "No certificate uploaded")}
            </ScrollView>

            <View style={[styles.rateInputContainer, { marginTop: 8 }]}>
              <TextInput
                style={styles.rateInput}
                placeholder="Enter rate per minute"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={ratePerMinute}
                onChangeText={setRatePerMinute}
              />
            </View>

            <View style={styles.initiateActionRow}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.submitButton, { backgroundColor: "#808080", flex: 1, marginRight: 10 }]}
              >
                <Text style={styles.submitButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSubmitRate()}
                style={[styles.submitButton, { backgroundColor: "#4BB543", flex: 1, marginRight: 10 }]}
              >
                <Text style={styles.submitButtonText}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onReject(docData.astroId)}
                style={[styles.submitButton, { backgroundColor: "#FF4C4C", flex: 1 }]}
              >
                <Text style={styles.submitButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const AdminMainPage = ({ navigation }) => {
  const { API_BASE_URL } = useApi();

  // --- COMPONENT STATES ---
  const [loading, setLoading] = useState(true);
  const [astrologers, setAstrologers] = useState([]);
  const [selectedAstro, setSelectedAstro] = useState(null);
  const [ratePerMinute, setRatePerMinute] = useState('');
  const [popupData, setPopupData] = useState(null);
  const [docData, setDocData] = useState(null);
  const [showStatusSuccess, setShowStatusSuccess] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [showDocPopup, setShowDocPopup] = useState(false);
  const [popupType, setPopupType] = useState('info');

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    if (API_BASE_URL) {
      fetchData();
    }
  }, [API_BASE_URL]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/api/astrologers/notStatus/APPROVED`;
      console.log("📡 Fetching Astrologers from URL:", url);
      
      const response = await axios.get(url, {
        headers: {
          'X-DEVICE-ID': 'ADMIN-WEB-BROWSER',
          'Accept': 'application/json'
        }
      });

      if (response.data) {
        console.log("📥 Data Loaded, Count:", response.data.length);
        setAstrologers(response.data);
      } else {
        setAstrologers([]);
      }
    } catch (error) {
      console.error('❌ Data Fetching Failed:', error.message);
      setPopupMessage('Failed to connect to the server. Check Java backend logs.');
      setPopupType('error');
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTION: MOVE TO PROGRESS ---
  const updateStatusToProgress = async (mobileNumber) => {
    try {
      const apiUrl = `${API_BASE_URL}/api/astrologers/moveToProgress/${mobileNumber}`;
      const response = await axios.post(apiUrl, {}, {
        headers: { 'X-DEVICE-ID': 'ADMIN-WEB-BROWSER' }
      });
      
      if (response.status === 200) {
        setPopupMessage('Status updated to In-progress');
        setShowStatusSuccess(true);
        setPopupData(null);
        setShowPopup(false);
        fetchData();
      }
    } catch (err) {
      console.error('❌ Status Transition Error:', err);
      Alert.alert('Error', 'Status update failed (Check CORS/Filter)');
    }
  };

  // --- ACTION: APPROVE / REJECT ---
  const approveReject = async (action, mobileNumber, rate) => {
    try {
      let apiUrl = '';
      let successMsg = '';
      let currentStatus = docData?.astroVerifyStatus || popupData?.astroVerifyStatus;

      if (!currentStatus) {
        const astro = astrologers.find((a) => a.astroMobile === mobileNumber);
        currentStatus = astro?.astroVerifyStatus;
      }

      if (currentStatus === 'INITIATE') {
        apiUrl = `${API_BASE_URL}/api/astrologers/moveToProgress/${mobileNumber}`;
        successMsg = 'Status set to In-progress';
      } else if (currentStatus === 'PENDING') {
        if (action === 'A' && (!rate || isNaN(rate))) {
          setPopupMessage('Please enter a valid numeric rate.');
          setPopupType('error');
          setShowPopup(true);
          return;
        }
        apiUrl = `${API_BASE_URL}/api/astrologers/approve/${mobileNumber}/${action}/${rate || 0}`;
        successMsg = action === 'A' ? 'Astrologer Accepted' : 'Astrologer Rejected';
      }

      await axios.post(apiUrl, {}, {
        headers: { 'X-DEVICE-ID': 'ADMIN-WEB-BROWSER' }
      });

      setPopupMessage(successMsg);
      setShowStatusSuccess(true);
      setShowPopup(false);
      setShowDocPopup(false);
      setPopupData(null);
      setDocData(null);
      setSelectedAstro(null);
      setRatePerMinute('');
      fetchData();
    } catch (error) {
      console.error(`❌ Approval Logic Error:`, error.message);
      Alert.alert('Error', 'Connection to server lost or access denied (403)');
    }
  };

  // --- UI TRIGGERS ---
  const handleTickClick = async (astro) => {
    if (astro.astroVerifyStatus === 'INITIATE') {
      await updateStatusToProgress(astro.astroMobile);
    } else if (astro.astroVerifyStatus === 'PENDING') {
      setSelectedAstro(astro.astroMobile);
    }
  };

  const handleSubmitRate = () => {
    if (docData && docData.astroId) {
      approveReject('A', docData.astroId, ratePerMinute);
    } else if (selectedAstro) {
      approveReject('A', selectedAstro, ratePerMinute);
    }
  };

  const openStatusPopup = async (astro) => {
    if (astro.astroVerifyStatus === 'INITIATE') {
      setPopupData(astro);
      setShowPopup(true);
    } else if (astro.astroVerifyStatus === 'PENDING') {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/astro/latest/${astro.astroMobile}`, {
          headers: { 'X-DEVICE-ID': 'ADMIN-WEB-BROWSER' }
        });
        setDocData(res.data);
        setShowDocPopup(true);
      } catch (err) {
        console.error('❌ Document Load Error:', err);
        Alert.alert('Error', 'Could not load uploaded documents');
      }
    }
  };

  // --- RENDER LIST ITEM ---
  const renderAstrologerItem = ({ item }) => (
    <View key={item.astroId}>
      <View style={styles.tableRow}>
        <View style={styles.tableCell}><Text style={styles.cellText}>{item.astroName || 'N/A'}</Text></View>
        <View style={styles.tableCell}><Text style={styles.cellText}>{item.astroMobile}</Text></View>
        <View style={styles.tableCell}><Text style={styles.cellText}>{item.astroMailId || '-'}</Text></View>
        <View style={styles.tableCell}>
          <TouchableOpacity onPress={() => openStatusPopup(item)}>
            <Text style={styles.statusLink}>{item.astroVerifyStatus}</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.tableCell, { flexDirection: 'column', alignItems: 'center' }]}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('AstrologerOthDetRO', { mobileNumber: item.astroMobile })}
          >
            <Text style={[styles.actionText, { color: 'blue' }]}>?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleTickClick(item)}>
            <Text style={[styles.actionText, { color: 'green' }]}>✔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => approveReject('R', item.astroMobile)}>
            <Text style={[styles.actionText, { color: 'red' }]}>✘</Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectedAstro === item.astroMobile && item.astroVerifyStatus === 'PENDING' && (
        <View style={styles.rateInputContainer}>
          <TextInput
            style={styles.rateInput}
            placeholder="Enter rate per minute"
            keyboardType="numeric"
            value={ratePerMinute}
            onChangeText={setRatePerMinute}
          />
          <TouchableOpacity style={styles.submitButton} onPress={() => handleSubmitRate()}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f76b00" />
        <Text style={{marginTop: 10, color: '#f76b00'}}>Initializing Admin Panel...</Text>
      </View>
    );
  }

  // --- MAIN SCREEN RETURN ---
  return (
    <View style={styles.container}>
      <View style={styles.topButtons}>
        <TouchableOpacity style={styles.editApprovedButton} onPress={() => navigation.navigate('AdminAstroEditPage')}>
          <FontAwesome name="pencil" size={20} color="white" />
        </TouchableOpacity>
        <Text style={[styles.editApprovedButtonText, { marginLeft: 10, alignSelf: 'center', color: 'black' }]}>
          Approved Astrologers
        </Text>
        <TouchableOpacity 
          style={[styles.editApprovedButton, { marginLeft: 15, backgroundColor: '#007bff' }]} 
          onPress={() => navigation.navigate('AdminSupportScreen')}
        >
          <FontAwesome name="support" size={20} color="white" />
        </TouchableOpacity>
        <Text style={[styles.editApprovedButtonText, { marginLeft: 10, alignSelf: 'center', color: 'black' }]}>
          Support
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Astrologers List (Pending Approval)</Text>

      <View style={styles.tableHeader}>
        <View style={styles.headerCell}><Text style={styles.headerText}>Name</Text></View>
        <View style={styles.headerCell}><Text style={styles.headerText}>Mobile</Text></View>
        <View style={styles.headerCell}><Text style={styles.headerText}>Email</Text></View>
        <View style={styles.headerCell}><Text style={styles.headerText}>Status</Text></View>
        <View style={[styles.headerCell, { borderRightWidth: 0 }]}><Text style={styles.headerText}>Actions</Text></View>
      </View>

      <FlatList
        data={astrologers}
        renderItem={renderAstrologerItem}
        keyExtractor={(item) => item.astroId.toString()}
        contentContainerStyle={styles.tableBody}
        ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 50}}>No data available in DB.</Text>}
      />

      {/* MODAL: SUCCESS POPUP */}
      {showStatusSuccess && (
        <Modal animationType="fade" transparent visible={showStatusSuccess}>
          <View style={styles.successOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.contentWrapper}>
                <View style={styles.iconWrapper}>
                  <AntDesign name="checkcircle" size={30} color="#4BB543" />
                </View>
                <Text style={styles.modalTitle}>{popupMessage.includes('In-progress') ? 'Success' : 'Approved'}</Text>
                <Text style={styles.modalMessage}>{popupMessage}</Text>
              </View>
              <View style={styles.separator} />
              <LinearGradient colors={['#FC2A0D', '#FE9F5D']} style={styles.gradientBottom}>
                <TouchableOpacity onPress={() => setShowStatusSuccess(false)} style={styles.okButton}>
                  <Text style={styles.okButtonText}>OK</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      )}

      {/* MODAL: STEP 1 INITIATE POPUP */}
      {showPopup && popupData && popupData.astroVerifyStatus === 'INITIATE' && (
        <Modal animationType="fade" transparent visible={showPopup}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { width: '90%' }]}>
              <View style={[styles.contentWrapper, { padding: 15 }]}>
                <AntDesign name="infocirlce" size={30} color="#f76b00" style={{ marginBottom: 10 }} />
                <Text style={[styles.modalTitle, { color: '#f76b00' }]}>Registration Details (Step 1)</Text>
                <ScrollView style={styles.infoScroll}>
                  <InfoRow label="Name" value={popupData.astroName} />
                  <InfoRow label="Mobile" value={popupData.astroMobile} />
                  <InfoRow label="Email" value={popupData.astroMailId} />
                  <InfoRow label="Exp" value={`${popupData.astroExp} Yrs`} />
                  <InfoRow label="Spec" value={popupData.astroSpec} />
                  <InfoRow label="Bio" value={popupData.astroDtls} multiline />
                </ScrollView>
                <View style={styles.initiateActionRow}>
                  <TouchableOpacity 
                    onPress={() => { setShowPopup(false); setPopupData(null); }} 
                    style={[styles.submitButton, { backgroundColor: '#808080', flex: 1, marginRight: 10 }]}
                  >
                    <Text style={styles.submitButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => updateStatusToProgress(popupData.astroMobile)} 
                    style={[styles.submitButton, { backgroundColor: '#f76b00', flex: 1 }]}
                  >
                    <Text style={styles.submitButtonText}>Move to Progress</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* MODAL: STEP 2 PENDING DOCS POPUP */}
      <AstroPendingDetailsModal
        docData={docData}
        onClose={() => setDocData(null)}
        onReject={(id) => approveReject('R', id)}
        ratePerMinute={ratePerMinute}
        setRatePerMinute={setRatePerMinute}
        handleSubmitRate={handleSubmitRate}
      />
    </View>
  );
};
  const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  topButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    margin: 10,
  },
  editApprovedButton: {
    backgroundColor: '#f76b00',
    padding: 8,
    borderRadius: 5,
  },
  editApprovedButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
 tableHeader: {
  flexDirection: 'row',
  backgroundColor: '#f76b00',
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderColor: 'darkgrey',
},

headerCell: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: 10,
  borderRightWidth: 1,
  borderColor: 'darkgrey',
},

headerText: {
  color: 'white',
  fontWeight: 'bold',
  textAlign: 'center',
},

  tableRow: {
    flexDirection: 'row',
    backgroundColor: 
'white',
    borderBottomWidth: 1,
    borderColor: 'darkgrey',
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRightWidth: 1,
    borderColor: 'darkgrey',
  },
  cellText: {
    textAlign: 'center',
    color: '#000',
  },
  actionButton: {
    backgroundColor: 'darkgrey',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginVertical: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusLink: {
    color: '#f76b00',
    textDecorationLine: 'underline',
  },
  rateInputContainer: {
    backgroundColor: '#f5f5ff',
    padding: 10,
    marginHorizontal: 5,
    marginBottom: 10,
    borderRadius: 8,
  },
  rateInput: {
    backgroundColor: '#fff',
  
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    color: '#000',
  },
  submitButton: {
    backgroundColor: '#f76b00',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
    tableBody: { paddingBottom: 20 },
  // ✅  Modal Popup Styles
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
    borderRadius: 20,        
    padding: 5,              
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,        
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
    borderBottomRightRadius: 
20,
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

// --- NEW STYLES for Info Modal ---
infoScroll: { 
    maxHeight: 400, 
    width: '100%', 
    marginBottom: 15,
    paddingHorizontal: 10,
},
infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0D4BB',
    alignItems: 'flex-start',
    width: '100%',
},
infoLabel: {
    fontWeight: 'bold',
    color: '#333',
    width: 120, // Adjusted width for more space
    fontSize: 14,
},
infoValue: {
    flex: 1,
    color: '#000',
    fontSize: 14,
  
    textAlign: 'right', // Align single line data to the right
},
infoValueMultiline: {
    flex: 1,
    color: '#000',
    fontSize: 14,
    paddingTop: 0, 
    paddingBottom: 5,
    textAlign: 'left',
},
initiateActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 5,
},
});
export default AdminMainPage;