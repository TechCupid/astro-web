import React, { useState ,useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/FontAwesome';
import api from './api/apiClient';
import { useApi } from './ApiContext';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';


const SessionCourseScreen = ({ route }) => {
  const { API_BASE_URL } = useApi();
  const { astroDetails } = route.params;
  const astroId = astroDetails?.astroId;

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseAmount, setCourseAmount] = useState('');
  const [offerPercent, setOfferPercent] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
const [hasActiveOffer, setHasActiveOffer] = useState(false);


const [errorModalVisible, setErrorModalVisible] = useState(false);
const [errorMessage, setErrorMessage] = useState('');

  const formatDateDB = (date) => date.toISOString().split('T')[0];
  const formatDateDisplay = (date) => date.toDateString(); // Thu Jul 31 2025
  const storageKey = `offerPercent_${astroId}`;

  // Load saved offer for this astrologer
useEffect(() => {
  const loadOffer = async () => {
    const savedOffer = await AsyncStorage.getItem(storageKey);
    if (savedOffer !== null) {
      const savedValue = Number(savedOffer);
      setOfferPercent(savedValue);
      setHasActiveOffer(savedValue > 0); // show "No Offer" if something was picked
    }
  };
  loadOffer();
}, [astroId]);

  const handleOfferSelect = async (p) => {
    setOfferPercent(p);
    setHasActiveOffer(true);
    await AsyncStorage.setItem(storageKey, String(p));
  };

const handleNoOffer = async () => {
  setOfferPercent(null); // clears selection
  setHasActiveOffer(false); // hides "No Offer" button
  await AsyncStorage.removeItem(storageKey);
};



  const calculateOfferAmount = () => {
    const amount = parseFloat(courseAmount);
    return offerPercent > 0 && amount
      ? (amount - (amount * offerPercent) / 100).toFixed(2)
      : '';
  };

  const offerAmount = calculateOfferAmount();
  
  const resetForm = () => {
    setCourseTitle('');
    setCourseDescription('');
    setCourseAmount('');
    setOfferPercent(0);
    setStartDate(new Date());
    setEndDate(new Date());
  };
  
  const handleSubmit = async () => {

    
    if (!courseTitle || !courseDescription || !courseAmount || !offerAmount || !astroId) {
      setErrorMessage('Please fill all fields and ensure astrologer ID exists.');
      setErrorModalVisible(true);
      return;
    }

    const payload = {
      astroId,
      courseTitle,
      courseDescription,
      courseAmount: parseFloat(courseAmount),
      offerAmount: parseFloat(offerAmount),
      startDate: formatDateDB(startDate),
      endDate: formatDateDB(endDate),
    };

    try {
      await api.post(`${API_BASE_URL}/api/course-session/create`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      
       setShowSuccessModal(true);
       resetForm();
      
    } catch (err) {
      console.error('❌ Submission error:', err);
      setErrorMessage('Failed to submit session.');
      setErrorModalVisible(true);
    }
  };

  const openCalendar = (type) => {
    if (type === 'start') {
      setTempDate(startDate);
      setShowStartCalendar(true);
    } else {
      setTempDate(endDate);
      setShowEndCalendar(true);
    }
  };

  const confirmDate = () => {
    if (showStartCalendar) setStartDate(tempDate);
    if (showEndCalendar) setEndDate(tempDate);
    setShowStartCalendar(false);
    setShowEndCalendar(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.header}>
        <Image source={require('./assets/Appicon.jpeg')} style={styles.logoImage} />
        <Text style={styles.headerText}>Session Course Entry</Text>
      </View>

      <Text style={styles.label}>Start Date</Text>
      <TouchableOpacity style={styles.datePicker} onPress={() => openCalendar('start')}>
        <Text style={styles.dateText}>{formatDateDisplay(startDate)}</Text>
        <Icon name="calendar" size={20} color="#FF6B00" />
      </TouchableOpacity>

      <Text style={styles.label}>End Date</Text>
      <TouchableOpacity style={styles.datePicker} onPress={() => openCalendar('end')}>
        <Text style={styles.dateText}>{formatDateDisplay(endDate)}</Text>
        <Icon name="calendar" size={20} color="#FF6B00" />
      </TouchableOpacity>

      <Text style={styles.label}>Course Title</Text>
      <TextInput
        style={styles.input}
        value={courseTitle}
        onChangeText={setCourseTitle}
        placeholder="Enter course title"
      />

      <Text style={styles.label}>Course Description</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        multiline
        value={courseDescription}
        onChangeText={setCourseDescription}
        placeholder="Enter course description"
      />

      <Text style={styles.label}>Course Amount (₹)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={courseAmount}
        onChangeText={setCourseAmount}
        placeholder="e.g. 2000"
      />

<Text style={styles.label}>Select Offer %</Text>
    <View style={styles.offerRow}>
      {[10, 25, 50, 75].map((p) => (
        <TouchableOpacity
          key={p}
          style={[
            styles.offerButton,
            offerPercent === p && styles.selectedOffer
          ]}
          onPress={() => handleOfferSelect(p)}
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
            { backgroundColor: "#c0b8b2ff" }
          ]}
          onPress={handleNoOffer}
        >
          <Text style={[styles.offerText, { color: "#fff" }]}>
            No Offer
          </Text>
        </TouchableOpacity>
      )}
    </View>
  
<Text style={styles.label}>Final Offer Amount (₹)</Text>
<TextInput
  style={[styles.input, { backgroundColor: '#f0f0f0' }]}
  value={offerAmount}
  editable={false}
/>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>

      {(showStartCalendar || showEndCalendar) && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.calendarOverlay}>
            <View style={styles.calendarContainer}>
              <View style={styles.customCalendarHeader}>
                <Text style={styles.yearHeader}>{tempDate.getFullYear()}</Text>
                <Text style={styles.dateTextHeader}>{tempDate.toDateString()}</Text>
              </View>

              <Calendar
                current={formatDateDB(tempDate)}
                onDayPress={(day) => setTempDate(new Date(day.dateString))}
                markedDates={{
                  [formatDateDB(tempDate)]: {
                    selected: true,
                    selectedColor: '#FF6B00',
                  },
                }}
                theme={{
                  selectedDayBackgroundColor: '#FF6B00',
                  arrowColor: '#FF6B00',
                  todayTextColor: '#FF6B00',
                  monthTextColor: '#FF6B00',
                  textSectionTitleColor: '#FF6B00',
                }}
              />

              <View style={styles.calendarButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setShowStartCalendar(false);
                    setShowEndCalendar(false);
                  }}
                  style={styles.btnOutline}
                >
                  <Text style={styles.btnOutlineText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmDate} style={styles.btnOutline}>
                  <Text style={styles.btnOutlineText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        
        
      )}

      <Modal transparent visible={errorModalVisible} animationType="fade"
  onRequestClose={() => setErrorModalVisible(false)}
>
  <View style={styles.modalOverlay}>
   <View style={styles.modalBox}>
       <View style={styles.contentWrapper}>
        <View style={styles.iconWrapper}>
          <AntDesign name="exclamationcircle" size={30} color="#FF3B30" />
          </View>
      <Text style={styles.modalTitle}>Error</Text>
      <Text style={styles.modalText}>{errorMessage}</Text>
      </View>
        <View style={styles.separator} />
      <LinearGradient
        colors={['#FC2A0D', '#FE9F5D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBottom}
      >
      
       <TouchableOpacity
          onPress={() => setErrorModalVisible(false)}
          style={styles.okButton}
        >
          <Text style={styles.okButtonText}>OK</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>

{/* ✅ Success Modal */}
<Modal visible={showSuccessModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
       <View style={styles.modalBox}>
       <View style={styles.contentWrapper}>
        <View style={styles.iconWrapper}>
          <AntDesign name="checkcircle" size={30} color="#4CAF50"/>
          </View>

      <Text style={styles.modalTitle}>Success</Text>
      <Text style={styles.modalText}>Session course saved successfully!</Text>
      </View>
       <View style={styles.separator} />
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

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    padding: 10,
    marginBottom: 10,
  },
  logoImage: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  headerText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'Calibri',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#FF6B00',
    borderRadius: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#FF6B00',
    borderWidth: 1,
    borderRadius: 1,
    padding: 10,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    flex: 1,
  },
offerRow: { 
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: 8,
},
offerButton: {
  borderWidth: 1,
  borderColor: '#FF6B00',
  borderRadius: 1, // make it look smoother
  paddingVertical: 4,  // reduced from 8
  paddingHorizontal: 8, // reduced from 14
  marginRight: 8,       // slightly smaller gap
  marginTop: 4,
  minWidth: 60,         // optional: smaller width
  height: 35,           // optional: fixed smaller height
  justifyContent: 'center',
  alignItems: 'center',
},
selectedOffer: {
  backgroundColor: '#FF6B00',
},
offerText: {
  color: '#333',
  fontWeight: 'bold',
  fontSize: 12, // reduced font size for smaller button
},
  submitBtn: {
    backgroundColor: '#FF6B00',
    padding: 15,
    borderRadius: 1,
    marginTop: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 8,
    paddingBottom: 10,
  },
  customCalendarHeader: {
    backgroundColor: '#FF6B00',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'left',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  yearHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  dateTextHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  calendarButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 16,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#FF6B00',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  btnOutlineText: {
    color: '#FF6B00',
    fontWeight: 'bold',
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
  modalText: {
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

export default SessionCourseScreen;
