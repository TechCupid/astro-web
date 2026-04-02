import React, { useState ,useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Button, Alert} from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import api from './api/apiClient';
import { useApi } from './ApiContext'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const AstroOtpPage = ({ navigation, route }) => {
  const { API_BASE_URL } = useApi();
  const { astroMobile } = route.params; // Mobile number passed from the previous page
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60); // Timer for resend OTP
  const [astrologer, setAstrologer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulate a countdown timer
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (timer > 0) {
        setTimer((prev) => prev - 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpVerification = async () => {
  if (otp.length !== 4) {
    Alert.alert('Invalid OTP', 'Please enter a valid 4-digit OTP.');
    return;
  }

  try {
    const response = await api.get(`${API_BASE_URL}/api/astrologers/details/verifyOtp`, {
      params: { astroMobileNo: astroMobile, otp }
    });

    if (response.status === 200) {
  const data = response.data;
  console.log('✅ OTP Verified. Response Data:', data);

  if (!data.astroId) {
    Alert.alert('Error', 'astroId missing in backend response.');
    return;
  }

  if (data.astroVerifyStatus === 'APPROVED') {
    // ✅ Update astro status to online
    console.log("👉 Updating status to 'online' for astroId:", data.astroId);
    await api.put(`${API_BASE_URL}/api/astrologers/status`, {
      astroId: data.astroId,
      status: 'online'
    });

    // ✅ Store astro details
    await AsyncStorage.setItem('loggedInAstro', JSON.stringify(data));

    // ✅ Navigate to main screen
    navigation.navigate('AstroMainScreen', { astroId: data.astroId });
  } else {
    navigation.navigate('AstrologerRegistration', { astroMobile });
  }
}
  } catch (error) {
    if (error.response?.status === 401) {
      Alert.alert('Error', 'Invalid OTP');
    } else if (error.response?.status === 404) {
      navigation.navigate('AstrologerRegistration', { astroMobile });
    } else {
      Alert.alert('Error', 'Something went wrong.');
    }
  }
};


  useEffect(() => {
      if (!loading && astrologer?.astroVerifyStatus === 'APPROVED') {
          navigation.navigate('AstroMainScreen', { astroId: astroMobile });
        //console.log("Test");
      }
    }, [loading, astrologer]);

  const handleResendOtp = () => {
    // Reset the timer and resend OTP logic
    setTimer(60);
    Alert.alert('OTP Resent', `OTP has been resent to +91 ${astroMobile}`);
    // Call API to resend OTP if needed
  };

  return (
    
    <View style={styles.container}>
      <Text style={styles.title}>Verification</Text>
      <Text style={styles.subtitle}>
        Confirmation code has been sent to you on your mobile no +91 {astroMobile}
      </Text>

      {/* OTP Input */}
      <OTPTextInput
        handleTextChange={(text) => setOtp(text)}
        inputCount={4}
        tintColor="#6A5ACD"
        textInputStyle={styles.otpInput}
      />

      {/* Timer */}
      <Text style={styles.timer}>00:{timer < 10 ? `0${timer}` : timer}</Text>

      {/* Verify Button */}
      <TouchableOpacity style={styles.verifyButton} onPress={handleOtpVerification}>
        <Text style={styles.verifyButtonText}>Verify</Text>
      </TouchableOpacity>

      {/* Resend OTP */}
      <TouchableOpacity onPress={handleResendOtp} disabled={timer > 0}>
        <Text style={[styles.resendText, timer > 0 && { color: '#ccc' }]}>
          Resend
        </Text>
      </TouchableOpacity>
    </View>
   
  );
};

const styles = StyleSheet.create({
 
  container: {
     backgroundColor: '#0B0B45',
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 32,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: '#6A5ACD',
    borderRadius: 8,
    width: 50,
    height: 50,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 18,
    marginHorizontal: 8,
  },
  timer: {
    fontSize: 16,
    color: '#FFFFFF',
    marginVertical: 16,
  },
  verifyButton: {
    backgroundColor:'#454371',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginVertical: 16,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default AstroOtpPage;