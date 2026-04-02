import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { AntDesign } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useApi } from './ApiContext';
import { getOrCreateDeviceId } from './utils/deviceId';
import api from './api/apiClient';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from './RegisterPushNotification';

const AstrologerRegistration = ({ navigation, route }) => {
  const { astroMobile } = route.params;
  const { API_BASE_URL } = useApi();

  // ------------------- STATE -------------------
  const [astroName, setAstroName] = useState('');
  const [gender, setGender] = useState('Male');
  const [astroMailId, setAstroMailId] = useState('');
  
  const [astroDob, setAstroDob] = useState(null);
  const [astroPlaceOfBirth, setAstroPlaceOfBirth] = useState('');
  const [astroEduDtls, setAstroEduDtls] = useState('');
  const [astroDtls, setAstroDtls] = useState('');
  const [experience, setExperience] = useState('');

  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [tempDate, setTempDate] = useState(null);
const [errorDob, setErrorDob] = useState('');

  const initialPopup = route.params?.popup || null;
  const [popupVisible, setPopupVisible] = useState(!!initialPopup);
  const [popupTitle, setPopupTitle] = useState(initialPopup?.title || '');
  const [popupMessage, setPopupMessage] = useState(initialPopup?.message || '');

  const [langOpen, setLangOpen] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [languageItems, setLanguageItems] = useState([
    { label: 'Tamil', value: 'Tamil' },
    { label: 'Hindi', value: 'Hindi' },
    { label: 'English', value: 'English' },
    
  ]);

  const [expertOpen, setExpertOpen] = useState(false);
  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [expertiseItems, setExpertiseItems] = useState([
    { label: 'Top Astrologer', value: 'Top Astrologer' },
    { label: 'Vedic Astrology', value: 'Vedic Astrology' },
    { label: 'Tarot Expert', value: 'Tarot Expert' },
    { label: 'Numerology', value: 'Numerology' },
     { label: 'Naadi', value: 'Naadi' },
    { label: 'Prashna kundli', value: 'Prashna kundli' },
    { label: 'Love Astrology', value: 'Love Astrology' },
    { label: 'Healing', value: 'Healing' },
    { label: 'Palmistry', value: 'Palmistry' },
  ]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [openMonth, setOpenMonth] = useState(false);
  const [openYear, setOpenYear] = useState(false);

  const [showMonthList, setShowMonthList] = useState(false);
  const [showYearList, setShowYearList] = useState(false);

  useEffect(() => {
    if (route?.params?.popup) {
      navigation.setParams({ popup: undefined });
    }
  }, []);

  const [showAgeModal, setShowAgeModal] = useState(false);
  const [ageValidationMessage, setAgeValidationMessage] = useState('');
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [yearRangeStart, setYearRangeStart] = useState(
    Math.floor(new Date().getFullYear() / 10) * 10
  );

  // error states for inline format validation (shown onBlur)
  const [errorName, setErrorName] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPlace, setErrorPlace] = useState('');
  const [errorEdu, setErrorEdu] = useState('');
  const [errorDesc, setErrorDesc] = useState('');
  const [errorExp, setErrorExp] = useState('');

  // 📌 Calculate cutoff date (must be at least 18 years old)
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

  // ------------------- NOTIFICATIONS -------------------
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });
    return () => subscription.remove();
  }, []);

  // ------------------- Validation functions (onBlur) -------------------
  const validateName = () => {
    if (!astroName.trim()) {
      // required is handled by popup; do not show inline "required"
      setErrorName('');
      return;
    }
    const regex = /^[A-Za-z ]+$/;
    if (!regex.test(astroName.trim())) setErrorName('Enter a valid name');
    else setErrorName('');
  };

  const validateEmail = () => {
    if (!astroMailId.trim()) {
      setErrorEmail('');
      return;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(astroMailId.trim())) setErrorEmail('Enter a valid email address');
    else setErrorEmail('');
  };

  const validatePlace = () => {
  if (!astroPlaceOfBirth.trim()) {
    setErrorPlace('');
    return;
  }

  const value = astroPlaceOfBirth.trim();

  // Check minimum length
  if (value.length < 3) {
    setErrorPlace('Enter a valid place name');
    return;
  }

  // Only letters + spaces allowed
  const regex = /^[A-Za-z ]+$/;
  if (!regex.test(value)) {
    setErrorPlace('Enter a valid place name (letters only)');
  } else {
    setErrorPlace('');
  }
};


 const validateEdu = () => {
  if (!astroEduDtls.trim()) {
    setErrorEdu('');
    return;
  }

  const regex = /^[A-Za-z0-9 .-]+$/; // letters, numbers, dot, hyphen, space

  if (!regex.test(astroEduDtls.trim())) {
    setErrorEdu('Enter a valid education (letters, numbers, dot allowed)');
  } else {
    setErrorEdu('');
  }
};


  const validateDesc = () => {
  if (!astroDtls.trim()) {
    setErrorDesc('');
    return;
  }

  const regex = /^[A-Za-z ]+$/; // letters + spaces only

  if (!regex.test(astroDtls.trim())) {
    setErrorDesc('Enter letters only');
  } else {
    setErrorDesc('');
  }
};


  const validateExp = () => {
    if (!experience.trim()) {
      setErrorExp('');
      return;
    }
    const num = Number(experience);
    if (isNaN(num) || num < 0 || num > 80) setErrorExp('Enter a valid experience (0–60)');
    else setErrorExp('');
  };

  const get18YearsAgo = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today;
  };

  const openCalendar = () => {
  const fallbackDate = new Date();
  fallbackDate.setFullYear(fallbackDate.getFullYear() - 18);

  setTempDate(null);
  setSelectedMonth(fallbackDate.getMonth());
  setSelectedYear(fallbackDate.getFullYear());
  setShowCalendar(true);
};



  const confirmDate = () => {
  const today = new Date();
  const age = today.getFullYear() - tempDate.getFullYear();
  const monthDiff = today.getMonth() - tempDate.getMonth();
  const dayDiff = today.getDate() - tempDate.getDate();
  const finalAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

  if (finalAge < 18) {
    // ❌ Not eligible – clear date + show inline error
    setErrorDob('Above 18 years only eligible to register');
    setSelectedDate(null);
    setAstroDob(null);
    setShowCalendar(false);
    return;
  }

  // ✔ Valid age
  setErrorDob('');
  setSelectedDate(tempDate);
  setAstroDob(tempDate);
  setShowCalendar(false);
};


  // ------------------- FORM RESET -------------------
  const resetForm = () => {
    setAstroName('');
    setGender('Male');
    setAstroMailId('');
    setAstroDob(new Date());
    setSelectedDate(new Date());
    setAstroPlaceOfBirth('');
    setAstroEduDtls('');
    setAstroDtls('');
    setSelectedLanguages([]);
    setSelectedExpertise([]);
    setExperience('');

    // clear inline errors too
    setErrorName('');
    setErrorEmail('');
    setErrorPlace('');
    setErrorEdu('');
    setErrorDesc('');
    setErrorExp('');
  };

  // Synchronous validators used during final submit
const isValidName = (name) => /^[A-Za-z ]+$/.test(name.trim());
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const isValidPlace = (place) => /^[A-Za-z ]+$/.test(place.trim()) && place.trim().length >= 3;
const isValidEdu = (edu) => /^[A-Za-z0-9 .-]+$/.test(edu.trim());
const isValidDesc = (desc) => /^[A-Za-z ]+$/.test(desc.trim());
const isValidExp = (exp) => !isNaN(Number(exp)) && Number(exp) >= 0 && Number(exp) <= 80;


// ------------------- FORM SUBMIT -------------------
const handleSubmit = async () => {


  const deviceId = await getOrCreateDeviceId();
  console.log('📱 DEVICE ID (register-first):', deviceId);
  // Collect missing required fields
  let missingFields = [];

  if (!astroName.trim()) missingFields.push("Name");
  if (!astroDob) missingFields.push("Date of Birth");
  if (!astroMailId.trim()) missingFields.push("Email");
  if (selectedLanguages.length === 0) missingFields.push("Languages");
  if (selectedExpertise.length === 0) missingFields.push("Expertise");
  if (!experience.trim()) missingFields.push("Experience");
  if (!astroPlaceOfBirth.trim()) missingFields.push("Place of Birth");
  if (!astroEduDtls.trim()) missingFields.push("Educational Details");
  if (!astroDtls.trim()) missingFields.push("Profile Description");

  // Only 1 field missing -> show field name
  if (missingFields.length === 1) {
    setValidationMessage(`Please enter ${missingFields[0]}`);
    setShowValidationModal(true);
    return;
  }

  // Multiple fields missing -> show generic message
  if (missingFields.length > 1) {
    setValidationMessage("Please fill all required fields.");
    setShowValidationModal(true);
    return;
  }

 

 // -------------------- FORMAT VALIDATION CHECK --------------------

let formatErrors = [];

if (!isValidName(astroName)) formatErrors.push("name");
if (!isValidPlace(astroPlaceOfBirth)) formatErrors.push("place");
if (!isValidEmail(astroMailId)) formatErrors.push("email");
if (!isValidEdu(astroEduDtls)) formatErrors.push("education");
if (!isValidDesc(astroDtls)) formatErrors.push("description");
if (!isValidExp(experience)) formatErrors.push("experience");

// ❌ MULTIPLE FORMAT ERRORS → show only ONE COMMON popup
if (formatErrors.length > 1) {
  setValidationMessage("Please update the highlighted fields with correct format.");
  setShowValidationModal(true);
  return;
}

// ❌ SINGLE FORMAT ERROR → show exact message
if (formatErrors.length === 1) {
  const field = formatErrors[0];

  const messages = {
    name: "Invalid name format",
    place: "Invalid place of birth",
     email: "Invalid email format",
    education: "Invalid education details",
    description: "Invalid description format",
    experience: "Invalid experience value"
  };

  setValidationMessage(messages[field]);
  setShowValidationModal(true);
  return;
}

  // ----------------------- SUBMISSION START -----------------------
  let tokenString = await AsyncStorage.getItem('genToken');
  if (!tokenString) {
    tokenString = await registerForPushNotificationsAsync(API_BASE_URL);
  }

  const payload = {
    astroId: astroMobile,
    astroMobile: astroMobile,
    astroName,
    astroGender: gender,
    astroMailId,
    astroDob: astroDob.toISOString().split('T')[0],
    astroPlaceOfBirth,
    astroEduDtls,
    astroDtls,
    astroVerifyStatus: 'INITIATE',
    astroSpec: selectedExpertise.join(','),
    astroExp: parseFloat(experience),
    astroSpeakLang: selectedLanguages.join(','),
    astroWriteLang: selectedLanguages.join(','),
  };

  try {
    console.log('Sending payload:', payload);

    const response = await api.post(
      `${API_BASE_URL}/api/astrologers/register-first`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-DEVICE-ID': deviceId, // 🔥 REQUIRED
        },
      }
    );

    if (response.status === 200) {
      await AsyncStorage.setItem('astroLanguages', JSON.stringify({
        speakLang: selectedLanguages.join(','),
        writeLang: selectedLanguages.join(','),
        exp: experience,
        spec: selectedExpertise.join(','),
      }));

      await AsyncStorage.setItem('astroMobile', astroMobile);

      const preGenToken = await AsyncStorage.getItem('preGenToken');
      if (preGenToken) {
        await registerForPushNotificationsAsync(API_BASE_URL, preGenToken);
        await AsyncStorage.removeItem('preGenToken');
      } else {
        await registerForPushNotificationsAsync(API_BASE_URL);
      }

      setShowSuccessModal(true);
    } else {
      alert('Registration failed.');
    }
  } 
    catch (err) {
    console.error('❌ Registration error:', err?.response || err);
    alert('Something went wrong while submitting.');
  }
};



  const generateDisabledDates = () => {
  const disabled = {};
  const today = new Date();
  const cutoff = eighteenYearsAgo;

  // Loop from cutoff+1 day to today → disable all
  let date = new Date(cutoff);
  date.setDate(date.getDate() + 1);

  while (date <= today) {
    const key = date.toISOString().split("T")[0];
    disabled[key] = { disabled: true, disableTouchEvent: true };
    date.setDate(date.getDate() + 1);
  }

  return disabled;
};


  // ------------------- UI -------------------
  // ------------------- UI -------------------
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* 🧩 FIXED SCROLLVIEW FOR WEB */}
      <ScrollView 
        contentContainerStyle={[styles.container, { paddingBottom: 100 }]} 
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        style={Platform.OS === 'web' ? { height: '100vh' } : { flex: 1 }}
      >

        {/* Header */}
        <View style={styles.header}>
          <Image source={require('./assets/Appicon.jpeg')} style={styles.logoImage} />
          <Text style={styles.headerText}>Astrologer Registration</Text>
        </View>

        {/* Name */}
        <Text style={styles.label}>Name <Text style={{ color: 'red' }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={astroName}
          onChangeText={(t) => { setAstroName(t); if (errorName) setErrorName(''); }}
          onBlur={validateName}
          returnKeyType="done"
        />
        {errorName ? <Text style={styles.errorText}>{errorName}</Text> : null}

        {/* Gender */}
        <Text style={styles.label}>Gender <Text style={{ color: 'red' }}>*</Text></Text>
        <View style={styles.genderRow}>
          {['Male', 'Female'].map((g) => (
            <TouchableOpacity key={g} onPress={() => setGender(g)} style={styles.genderOption}>
              <View style={styles.radioOuter}>{gender === g && <View style={styles.radioInner} />}</View>
              <Text style={styles.genderText}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date of Birth */}
        <Text style={styles.label}>Date of Birth <Text style={{ color: 'red' }}>*</Text></Text>
        <TouchableOpacity style={styles.datePicker} onPress={openCalendar}>
          <Text style={styles.dateText}>
            {selectedDate ? selectedDate.toDateString() : "Select Date of Birth"}
          </Text>
          <Icon name="calendar" size={20} color="#FF6B00" />
        </TouchableOpacity>
        {errorDob ? <Text style={styles.errorText}>{errorDob}</Text> : null}


        {/* Place of Birth */}
        <Text style={styles.label}>Place of Birth <Text style={{ color: 'red' }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={astroPlaceOfBirth}
          onChangeText={(t) => { setAstroPlaceOfBirth(t); if (errorPlace) setErrorPlace(''); }}
          onBlur={validatePlace}
        />
        {errorPlace ? <Text style={styles.errorText}>{errorPlace}</Text> : null}

        {/* Email */}
        <Text style={styles.label}>Email <Text style={{ color: 'red' }}>*</Text></Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          value={astroMailId}
          onChangeText={(t) => { setAstroMailId(t); if (errorEmail) setErrorEmail(''); }}
          onBlur={validateEmail}
          autoCapitalize="none"
        />
        {errorEmail ? <Text style={styles.errorText}>{errorEmail}</Text> : null}

        {/* Education */}
        <Text style={styles.label}>Educational Details <Text style={{ color: 'red' }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={astroEduDtls}
          onChangeText={(t) => { setAstroEduDtls(t); if (errorEdu) setErrorEdu(''); }}
          onBlur={validateEdu}
        />
        {errorEdu ? <Text style={styles.errorText}>{errorEdu}</Text> : null}

        {/* Profile Description */}
        <Text style={styles.label}>Profile Description <Text style={{ color: 'red' }}>*</Text></Text>
        <TextInput
          style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
          value={astroDtls}
          onChangeText={(t) => { setAstroDtls(t); if (errorDesc) setErrorDesc(''); }}
          onBlur={validateDesc}
          multiline
        />
        {errorDesc ? <Text style={styles.errorText}>{errorDesc}</Text> : null}

        {/* Languages - Overlapping fix */}
        <Text style={styles.label}>Languages <Text style={{ color: 'red' }}>*</Text></Text>
        <View style={{ zIndex: expertOpen ? 1000 : 3000, marginBottom: langOpen ? 150 : 12 }}>
          <DropDownPicker
            open={langOpen}
            setOpen={setLangOpen}
            multiple
            value={selectedLanguages}
            setValue={setSelectedLanguages}
            items={languageItems}
            setItems={setLanguageItems}
            mode="BADGE"
            placeholder="Select Languages"
            listMode="SCROLLVIEW"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
          />
        </View>

        {/* Expertise */}
        <Text style={styles.label}>Expertise <Text style={{ color: 'red' }}>*</Text></Text>
        <View style={{ zIndex: langOpen ? 1000 : 2000, marginBottom: expertOpen ? 250 : 12 }}>
          <DropDownPicker
            open={expertOpen}
            setOpen={setExpertOpen}
            multiple
            value={selectedExpertise}
            setValue={setSelectedExpertise}
            items={expertiseItems}
            setItems={setExpertiseItems}
            mode="BADGE"
            placeholder="Select Expertise"
            listMode="SCROLLVIEW"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
          />
        </View>

        {/* Experience */}
        <Text style={styles.label}>Experience (in Years) <Text style={{ color: 'red' }}>*</Text></Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={experience}
          onChangeText={(t) => { setExperience(t); if (errorExp) setErrorExp(''); }}
          onBlur={validateExp}
        />
        {errorExp ? <Text style={styles.errorText}>{errorExp}</Text> : null}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 📅 CALENDAR MODAL */}
      <Modal transparent animationType="fade" visible={showCalendar}>
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.monthYearRow}>
              <TouchableOpacity style={styles.monthYearButton} onPress={() => setShowMonthList(true)}>
                <View style={styles.rowInside}>
                  <Text style={styles.monthYearText}>{[
                    "January","February","March","April","May","June",
                    "July","August","September","October","November","December"
                  ][selectedMonth]}</Text>
                  <AntDesign name="caretdown" size={14} color="#FF6B00" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.monthYearButton} onPress={() => setShowYearList(true)}>
                <View style={styles.rowInside}>
                  <Text style={styles.monthYearText}>{selectedYear}</Text>
                  <AntDesign name="caretdown" size={14} color="#FF6B00" />
                </View>
              </TouchableOpacity>
            </View>

            <Calendar
              key={`${selectedYear}-${selectedMonth}`}
              current={`${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`}
              maxDate={eighteenYearsAgo.toISOString().split("T")[0]}
              onDayPress={(day) => {
                const chosen = new Date(day.dateString);
                if (chosen > eighteenYearsAgo) {
                  setErrorDob("Above 18 years only");
                  setTempDate(null);
                } else {
                  setErrorDob("");
                  setTempDate(chosen);
                }
              }}
              markedDates={{
                ...(tempDate ? { [tempDate.toISOString().split("T")[0]]: { selected: true, selectedColor: "#FF6B00" } } : {}),
                ...generateDisabledDates()
              }}
              theme={{ selectedDayBackgroundColor: "#FF6B00", arrowColor: "#FF6B00" }}
            />

            <View style={styles.calendarButtons}>
              <TouchableOpacity onPress={() => setShowCalendar(false)} style={styles.btnOutline}>
                <Text style={styles.btnOutlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDate} style={styles.btnOutline}>
                <Text style={styles.btnOutlineText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🚀 FIXED: MONTH/YEAR MODALS MOVED TO THE BOTTOM FOR Z-INDEX HIERARCHY */}
      <Modal visible={showMonthList} transparent animationType="fade">
        <View style={[styles.overlay, { zIndex: 9999 }]}>
          <View style={styles.listBox}>
            <ScrollView>
              {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                <TouchableOpacity key={i} onPress={() => { setSelectedMonth(i); setShowMonthList(false); }} style={styles.listItem}>
                  <Text style={styles.listItemText}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showYearList} transparent animationType="fade">
        <View style={[styles.overlay, { zIndex: 9999 }]}>
          <View style={styles.listBox}>
            <ScrollView>
              {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 18 - i).map(y => (
                <TouchableOpacity key={y} onPress={() => { setSelectedYear(y); setShowYearList(false); }} style={styles.listItem}>
                  <Text style={styles.listItemText}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SUCCESS/VALIDATION MODALS */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.contentWrapper}>
              <AntDesign name="checkcircle" size={30} color="#4BB543" />
              <Text style={styles.modalTitle}>Registered Successfully</Text>
              <Text style={styles.modalMessage}>Wait for admin approval.</Text>
              <TouchableOpacity onPress={() => { setShowSuccessModal(false); resetForm(); navigation.goBack(); }} style={styles.okButton}>
                <Text style={styles.okText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showValidationModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.contentWrapper}>
              <AntDesign name="exclamationcircle" size={30} color="#FF3B30" />
              <Text style={styles.modalTitle}>Error</Text>
              <Text style={styles.modalMessage}>{validationMessage}</Text>
              <TouchableOpacity onPress={() => setShowValidationModal(false)} style={styles.okButton}>
                <Text style={styles.okText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10, backgroundColor: '#fff', paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ff9900', padding: 10, marginBottom: 10 },
  logoImage: { width: 30, height: 30, marginRight: 10 },
  headerText: { fontSize: 20, color: '#fff', fontWeight: 'bold', fontFamily: 'Calibri' },
  label: { fontWeight: 'bold', marginTop: 8, marginBottom: 4, fontSize: 14, fontFamily: 'Calibri' },
  input: {
    borderWidth: 1,
    borderColor: '#ff9900',
    borderRadius: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Calibri',
  },
  errorText: {
    color: '#FF3B30', // simple red text as requested (Option 1)
    marginBottom: 6,
    fontSize: 13,
  },
  genderRow: { flexDirection: 'row', marginBottom: 8 },
  genderOption: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  radioInner: { height: 10, width: 10, borderRadius: 5, backgroundColor: '#000' },
  genderText: { fontSize: 14, fontFamily: 'Calibri' },
  dropdown: { borderColor: '#ff9900', borderRadius: 1,
  paddingVertical: 6, paddingHorizontal: 8, minHeight: 40 },
  dropdownContainer: { 
    borderColor: '#ff9900', 
    padding: 8 ,
    borderRadius: 1,
    maxHeight: 400 // Increased maxHeight to show all 9 items
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
    fontSize: 14,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#ff6600',
    padding: 10,
    borderRadius: 1,
    marginTop: 16,
  },
  submitText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 15, fontFamily: 'Calibri' },
  
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
  alignItems: 'flex-start',
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
yearPickerContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "center",
  padding: 10,
},
yearItem: {
  width: "25%",
  padding: 10,
  alignItems: "center",
  borderRadius: 4,
},
yearItemSelected: {
  backgroundColor: "#FF6B00",
},
yearText: {
  fontSize: 16,
  color: "#333",
},
yearTextSelected: {
  color: "#fff",
  fontWeight: "bold",
},
yearPickerWrapper: {
  padding: 15,
  alignItems: "center",
},
yearGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "center",
},
yearNav: {
  flexDirection: "row",
  justifyContent: "space-between",
  width: "100%",
  marginTop: 15,
},
navButton: {
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderWidth: 1,
  borderColor: "#FF6B00",
  borderRadius: 4,
},
navText: {
  color: "#FF6B00",
  fontWeight: "bold",
},
headerRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  paddingHorizontal: 10,
  marginVertical: 10,
  position: "relative",
  zIndex: 5000, 
},
dropContainerHalf: {
  width: "48%",
  zIndex: 3000, 
},
dropSmall: {
  borderColor: "#FF6B00",
  minHeight: 42,
  zIndex: 9999,
  elevation: 9999,
},
dropSmallContainer: {
  borderColor: "#FF6B00",
  zIndex: 9999,
  elevation: 9999,
},
monthYearRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  paddingHorizontal: 15,
  marginBottom: 10,
  marginTop: 10,
},
monthYearButton: {
  width: "48%",
  paddingVertical: 10,
  borderWidth: 1,
  borderColor: "#FF6B00",
  borderRadius: 6,
  alignItems: "center",
},
monthYearText: {
  fontSize: 16,
  color: "#FF6B00",
  fontWeight: "bold",
},
overlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
},
listBox: {
  width: "70%",
  backgroundColor: "#FFF",
  borderRadius: 8,
  paddingVertical: 10,
  maxHeight: "70%",
  borderWidth: 1,
  borderColor: "#FF6B00",
},
listItem: {
  paddingVertical: 12,
  paddingHorizontal: 15,
  borderBottomWidth: 1,
  borderColor: "#ddd",
},
listItemText: {
  fontSize: 16,
  color: "#333",
},
rowInside: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
}
});

export default AstrologerRegistration;