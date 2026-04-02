// ✅ CustProfileScreen (Read-only) that loads customer details filled during registration

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const CustProfileScreen = () => {
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [amPm, setAmPm] = useState('AM');

  useEffect(() => {
    const loadDetails = async () => {
      setCustomerName(await AsyncStorage.getItem('customerName') || '');
      setMobileNumber(await AsyncStorage.getItem('mobileNumber') || '');
      setEmail(await AsyncStorage.getItem('customerEmail') || '');
      setDob(await AsyncStorage.getItem('customerDob') || '');
      setPlaceOfBirth(await AsyncStorage.getItem('customerPlace') || '');
      setGender(await AsyncStorage.getItem('customerGender') || '');
      setHours(await AsyncStorage.getItem('customerHour') || '');
      setMinutes(await AsyncStorage.getItem('customerMin') || '');
      setAmPm(await AsyncStorage.getItem('customerAmPm') || 'AM');
    };
    loadDetails();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Image source={require('./assets/Appicon.jpeg')} style={styles.logoImage} />
            <Text style={styles.headerText}>My Profile</Text>
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={customerName} editable={false} placeholderTextColor="#999" />

          <Text style={styles.label}>Gender</Text>
          <TextInput style={styles.input} value={gender} editable={false} placeholderTextColor="#999" />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} value={mobileNumber} editable={false} placeholderTextColor="#999" />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} editable={false} placeholderTextColor="#999" />

          <Text style={styles.label}>Date of Birth</Text>
          <TextInput style={styles.input} value={dob} editable={false} placeholderTextColor="#999" />

          <Text style={styles.label}>Time of Birth</Text>
          <View style={styles.timeRowEven}>
            <TextInput style={styles.timeInput} value={hours} editable={false} placeholderTextColor="#999" />
            <Text style={styles.colon}>:</Text>
            <TextInput style={styles.timeInput} value={minutes} editable={false} placeholderTextColor="#999" />
            <TextInput style={styles.timeInput} value={amPm} editable={false} placeholderTextColor="#999" />
          </View>

          <Text style={styles.label}>Place of Birth</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput style={styles.placeInput} value={placeOfBirth} editable={false} placeholderTextColor="#999" />
          </View>

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
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    height: 40,
    fontSize: 16,
    marginBottom: 12,
    color: '#999',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  timeRowEven: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    height: 40,
    fontSize: 16,
    color: '#999',
    width: 60,
    marginHorizontal: 5,
    textAlign: 'center',
  },
  colon: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  placeInput: { flex: 1, fontSize: 16, color: '#999', marginLeft: 8 },
});

export default CustProfileScreen;
