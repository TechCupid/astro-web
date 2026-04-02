import React, { useState } from 'react';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  TouchableOpacity
} from 'react-native';

const App = () => {
  const [step, setStep] = useState(0); // 1: Mobile, 2: OTP, 3: Astrologer List
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [serviceurl, setServiceurl] = useState('http://192.168.18.187:8090');
  const [astrologers, setAstrologers] = useState([]);

  // Placeholder API URLs
  const API_SEND_MOBILE = '/api/mergents/sentMobile';
  const API_VALIDATE_OTP = '/api/mergents/sentOTP';
  const API_FETCH_ASTROLOGERS = '/api/mergents/getAstrologers';
  

  const sendServiceurl =async () => {
    setStep(1);
  }

  const sendMobile = async () => {
    try {
      const response = await fetch(serviceurl+API_SEND_MOBILE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      const data = await response.json();
      //alert (data);
      if (data.success) {
        setStep(2);
      } else {
        alert('Failed to send mobile number.');
      }
    } catch (error) {
     // console.error(error);
      setStep(2);
      //alert('Error sending mobile number.');
    }
  };

  const validateOtp = async () => {
    try {
      const response = await fetch(serviceurl+API_VALIDATE_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp }),
      });
      const data = await response.json();
      if (data.success) {
        fetchAstrologers();
      } else {
        alert('Invalid OTP.');
      }
    } catch (error) {
    //  console.error(error);
      fetchAstrologers();
      //alert('Error validating OTP.');
    }
  };

  const fetchAstrologers = async () => {
    try {
      alert("inside fetchAstrologers");
      const response = await fetch(serviceurl+API_FETCH_ASTROLOGERS);
      const data = await response.json();
      if (data.success) {
        setAstrologers(data.astrologers);
        setStep(3);
      } else {
        alert('Failed to fetch astrologer details.');
      }
    } catch (error) {
     // console.error(error);
     alert("inside error");
      const response='{"success":"true","astrologers":[{"id":"1","name":"Astroger 1","specialization":"Astroger Specilization 1"},{"id":"2","name":"Astroger 2","specialization":"Astroger Specilization 2"}]}';
      alert(response);
      const data1 = response.json();
      alert("Data1--"+data1);
      setAstrologers(data1.astrologers);
      setStep(3);

      //alert('Error fetching astrologers.');
    }
  };

  const moveFirstPage =async () => {
    setStep(0);
  }

  const Header = ({ title }) => (
    <View style={styles.header}>
      <Text style={styles.headerText}>{title}</Text>
      <TouchableOpacity style={styles.roundedButton}>
        <Text style={styles.buttonText} onPress={moveFirstPage}>Click Me</Text>
      </TouchableOpacity>
    </View>
  );

  const Footer = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>© 2024 Your App</Text>
    </View>
  );

  if(step ===0){
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Astrology App</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Service URL"
          keyboardType="default"
          value={serviceurl}
          multiline={true}
          onChangeText={setServiceurl}
        />
        <Button title="Submit" onPress={sendServiceurl} />
      </View>
    );
  }

  if (step === 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Astrology App</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Mobile Number"
          keyboardType="phone-pad"
          value={mobile}
          onChangeText={setMobile}
        />
        <Button title="Submit" onPress={sendMobile} />
      </View>
    );
  }

  if (step === 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Verify OTP</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          keyboardType="number-pad"
          value={otp}
          onChangeText={setOtp}
        />
        <Button title="Validate" onPress={validateOtp} />
      </View>
    );
  }

  if (step === 3) {
    return (
      <View style={styles.container}>
        <Header title="Astrologer List" />
        
        <FlatList 
          data={astrologers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.astrologerCard}>
              <Text style={styles.astrologerName}>{item.name}</Text>
              <Text>{item.specialization}</Text>
            </TouchableOpacity>
          )}
        />
         <Footer />
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff7733', // Safaron color background
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  astrologerCard: {
    paddingLeft:10,
    paddingRight:0,
    paddingTop :10,
    width:300,
    height:70,
    marginVertical: 0,
    backgroundColor: '#aaffff',
    borderRadius: 1,
    shadowColor: '#ffffff',
    shadowOffset: { width: 10, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 3,
  },
  astrologerName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  header: {
    height: 60,
    width:350,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    height: 40,
    width:350,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 14,
  },
  roundedButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 25, // Makes the corners rounded
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    
  },
});

export default App;
