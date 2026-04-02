import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from './ApiContext';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import { registerForPushNotificationsAsync } from './RegisterPushNotification';

const CustRegisterScreen = ({ navigation, route }) => {
  const { mobileNumber } = route.params;
  const { API_BASE_URL } = useApi();

  const [customerName, setCustomerName] = useState('');
  const [dob, setDob] = useState(new Date());
  const [email, setEmail] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState(null);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [amPm, setAmPm] = useState('AM');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDob(selectedDate);
  };

  const handlePostRequest = async () => {
  if (!customerName || !dob || !email || !placeOfBirth || !gender || !hours || !minutes) {
    setValidationMessage('Please fill in all required fields');
    setShowValidationModal(true);
    return;
  }

  // ✅ Format time of birth properly
  const formattedTimeOfBirth = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')} ${amPm}`;

  const requestBody = {
    custCode: mobileNumber,
    custName: customerName,
    custDob: dob.toISOString().split('T')[0],
    custMailId: email,
    custPlaceOfBirth: placeOfBirth,
    custVerifyStatus: 'Verified',
    custMobileNo: mobileNumber,
    custGender: gender,
    custTimeOfBirth: formattedTimeOfBirth,
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/api/customers`, requestBody, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 200 || response.status === 201) {
      // ✅ Save local info
      await AsyncStorage.setItem('isCustomerRegistered', 'true');
      await AsyncStorage.setItem('mobileNumber', mobileNumber);
      await AsyncStorage.setItem('customerName', customerName);
      await AsyncStorage.setItem('customerEmail', email);
      await AsyncStorage.setItem('customerDob', dob.toISOString().split('T')[0]);
      await AsyncStorage.setItem('customerPlace', placeOfBirth);
      await AsyncStorage.setItem('customerGender', gender || '');
      await AsyncStorage.setItem('customerHour', hours || '');
      await AsyncStorage.setItem('customerMin', minutes || '');
      await AsyncStorage.setItem('customerAmPm', amPm || 'AM');

     
      await registerForPushNotificationsAsync(API_BASE_URL);

      // ✅ POPUP DEBUG HERE
  setValidationMessage(`Registration Success 🎉\nSaved mobileNumber: ${mobileNumber}`);
  setShowValidationModal(true);

      navigation.navigate('Main', { mobileNumber });
    }
  {/* catch (error) {
    if (error.response?.status === 404) {
      setValidationMessage('Not able to register.');
    } else {
      setValidationMessage('Something went wrong. Please try again.');
    }
    setShowValidationModal(true);
  }*/}


  } catch (error) {
  if (error.response?.status === 404) {
    setValidationMessage(`Not able to register. Mobile: ${mobileNumber}`);
  } else {
    setValidationMessage(`Something went wrong. Mobile: ${mobileNumber || 'NULL'}`);
  }
  setShowValidationModal(true);
}

};


  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image source={require('./assets/Appicon.jpeg')} style={styles.logoImage} />
            <Text style={styles.headerText}>Customer Registration</Text>
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#aaa"
            value={customerName}
            onChangeText={setCustomerName}
          />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {['Male', 'Female'].map((g) => (
              <TouchableOpacity key={g} style={styles.genderOption} onPress={() => setGender(g)}>
                <View style={styles.radio}>{gender === g && <View style={styles.innerCircle} />}</View>
                <Text style={styles.genderText}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={mobileNumber}
            editable={false}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your Email ID"
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Date of Birth</Text>
          <View style={styles.inputWithIcon}>
            <Text style={styles.dateText}>{dob.toDateString()}</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={22} color="#363737" />
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker value={dob} mode="date" display="default" onChange={handleDateChange} />
          )}

          <Text style={styles.label}>Time of Birth</Text>
          <View style={styles.timeRowEven}>
            <View style={styles.timeFieldEven}>
              <TextInput
                style={styles.timeInput}
                placeholder="HH"
                value={hours}
                onChangeText={setHours}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.fixedLabel}>(Hrs)</Text>
            </View>
            <Text style={styles.colon}>:</Text>
            <View style={styles.timeFieldEven}>
              <TextInput
                style={styles.timeInput}
                placeholder="MM"
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.fixedLabel}>(Mins)</Text>
            </View>
            <View style={styles.dropdownWrapperEven}>
              <TouchableOpacity onPress={() => setDropdownOpen(!dropdownOpen)} style={styles.dropdownToggle}>
                <Text style={styles.dropdownText}>{amPm}</Text>
                <Text style={styles.unicodeArrow}>▼</Text>
              </TouchableOpacity>
              {dropdownOpen && (
                <View style={styles.amPmDropdownBox}>
                  {['AM', 'PM'].map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        setAmPm(item);
                        setDropdownOpen(false);
                      }}
                      style={styles.amPmOption}
                    >
                      <Text style={styles.amPmText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <Text style={styles.label}>Place of Birth</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.placeInput}
              placeholder="Type place..."
              value={placeOfBirth}
              onChangeText={setPlaceOfBirth}
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handlePostRequest}>
            <Text style={styles.submitText}>Register</Text>
          </TouchableOpacity>

          <Modal visible={showValidationModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <View style={styles.contentWrapper}>
        <View style={styles.iconWrapper}>
          <AntDesign name="exclamationcircle" size={30} color="#FF3B30" />
        </View>
        <Text style={styles.modalTitle}>Error</Text>
        <Text style={styles.modalMessage}>{validationMessage}</Text>
      </View>

      <View style={styles.separator} />
      <LinearGradient
        colors={['#FC2A0D', '#FE9F5D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBottom}
      >
        <TouchableOpacity
          onPress={() => setShowValidationModal(false)}
          style={styles.okButton}
        >
          <Text style={styles.okButtonText}>OK</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>



        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', paddingTop: StatusBar.currentHeight || 0 },
  flex: { flex: 1 },
  container: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ff9900', padding: 10, marginBottom: 30 },
  logoImage: { width: 30, height: 30, marginRight: 10 },
  headerText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  label: { marginBottom: 6, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ff9900',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    height: 40,
    fontSize: 16,
    marginBottom: 12,
  },
  genderRow: { flexDirection: 'row', marginBottom: 12 },
  genderOption: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  genderText: { marginLeft: 6 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#000' },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff9900',
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 12,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  dateText: { fontSize: 16, color: '#333' },
  timeRowEven: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeFieldEven: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff9900',
    backgroundColor: '#fff',
    height: 40,
    width: '30%',
    paddingHorizontal: 5,
    justifyContent: 'space-between',
  },
  colon: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  fixedLabel: { fontSize: 14, color: '#000', marginLeft: 6, marginRight: 4 },
  timeInput: { flex: 1, fontSize: 16, textAlign: 'center', color: '#000' },
  dropdownWrapperEven: { position: 'relative', width: '30%', zIndex: 10 },
  dropdownToggle: {
    borderWidth: 1,
    borderColor: '#ff9900',
    height: 40,
    flexDirection: 'row',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  dropdownText: { fontSize: 16, color: '#000' },
  unicodeArrow: { fontSize: 18, color: '#363737' },
  amPmDropdownBox: {
    position: 'absolute',
    top: 40,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ff9900',
    backgroundColor: '#fff',
    elevation: 5,
    zIndex: 9999,
  },
  amPmOption: { padding: 10, alignItems: 'center' },
  amPmText: { fontSize: 16, color: '#000' },
  placeInput: { flex: 1, fontSize: 16, color: '#000', marginLeft: 8 },
  submitBtn: {
    backgroundColor: '#ff6600',
    padding: 15,
    alignItems: 'center',
    borderRadius: 6,
    marginTop: 20,
  },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  
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

export default CustRegisterScreen;
