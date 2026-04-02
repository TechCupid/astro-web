import React, { useState ,useEffect} from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Image, Alert,Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from './ApiContext';
import AntDesign from '@expo/vector-icons/AntDesign';
import { LinearGradient } from 'expo-linear-gradient';

const AstrologerOtherDetails = ({ navigation, route }) => {
  const { astroMobile } = route.params;
 
  const showFromRoute = route.params?.showModal || false;
const [showValidationModal, setShowValidationModal] = useState(false);
const [validationMessage, setValidationMessage] = useState('');


  const { API_BASE_URL } = useApi();

  const [photo, setPhoto] = useState(null);
  const [panAadharFiles, setPanAadharFiles] = useState([]);
  const [certificate, setCertificate] = useState(null);
  const [speakLang, setSpeakLang] = useState('');
const [writeLang, setWriteLang] = useState('');
const [exp, setExp] = useState('');
const [spec, setSpec] = useState('');
  const [showModal, setShowModal] = useState(false);
 const [thankYouModal, setThankYouModal] = useState(false);
const [validationTitle, setValidationTitle] = useState("");

const initialPopup = route.params?.popup || null;
const [popupVisible, setPopupVisible] = useState(!!initialPopup);
const [popupTitle, setPopupTitle] = useState(initialPopup?.title || '');
const [popupMessage, setPopupMessage] = useState(initialPopup?.message || '');

useEffect(() => {
  if (route?.params?.popup) {
    navigation.setParams({ popup: undefined });
  }
}, []);



  useEffect(() => {
  const loadStoredFields = async () => {
    const stored = await AsyncStorage.getItem('astroLanguages');
    console.log('📦 Fetched from AsyncStorage (Step 2 screen):', stored);
    
    if (stored) {
      const { speakLang, writeLang, exp, spec } = JSON.parse(stored);
      setSpeakLang(speakLang);
      setWriteLang(writeLang);
      setExp(exp);
      setSpec(spec);
    }
  };
  loadStoredFields();


 if (showFromRoute) {
      setShowModal(true); // show modal only once from route
    }
  }, []);


  const pickImage = async (setFunc) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setFunc(result.assets[0].uri);
      }
    } catch (err) {
      alert( "Could not open image picker");
    }
  };

  const pickPanAadharFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const selectedFiles = result.assets || [];

      if (selectedFiles.length !== 2) {
                  setValidationTitle("Missing Documents");

       setValidationMessage('Please select both PAN and Aadhar card in one browse.');
       setShowValidationModal(true);

        return;
      }

      const uris = selectedFiles.map(file => file.uri);
      setPanAadharFiles(uris);

    } catch (err) {
      alert("Error", "Could not select files.");
    }
  };

  const handleSubmit = async () => {
    if (!photo) {
    setValidationTitle("Missing Photo");
    setValidationMessage("Please upload your photo.");
    setShowValidationModal(true);
      return;
    }

    if (panAadharFiles.length !== 2) {
          setValidationTitle("Missing Documents");
    setValidationMessage("Pleaseselect both PAN and Aadhar card.");
    setShowValidationModal(true);

      return;
    }

    try {
      const apiData = new FormData();
      apiData.append('mobileNo', astroMobile);

      // These fields will be filled from step 1 in backend
     apiData.append('speakLang', speakLang);
  apiData.append('writeLang', writeLang);
  apiData.append('exp', exp);
  apiData.append('specialization', spec);

      // Photo
      apiData.append('capturedPhoto', {
        uri: photo,
        type: 'image/jpeg',
        name: photo.split('/').pop(),
      });

      // PAN & Aadhar
      panAadharFiles.forEach((uri, index) => {
        apiData.append(`certificate${index + 1}`, {
          uri,
          type: 'image/jpeg',
          name: uri.split('/').pop(),
        });
      });

      // Certificate (optional)
      if (certificate) {
        apiData.append('certificate5', {
          uri: certificate,
          type: 'image/jpeg',
          name: certificate.split('/').pop(),
        });
      }
console.log("📤 FormData values before sending:", {
  mobileNo: astroMobile,
  speakLang,
  writeLang,
  exp,
  spec
});

      const response = await fetch(`${API_BASE_URL}/api/astro/latest`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: apiData,
      });

      if (response.ok) {
        await AsyncStorage.setItem('isOthersRegistered', 'true');
        await AsyncStorage.setItem('astroProfileImage', photo);

       setThankYouModal(true);
      } else {
        alert("Error", "Failed to submit form. Try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error", "Something went wrong.");
    }
  };

  const isValid = photo && panAadharFiles.length === 2;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image source={require('./assets/Appicon.jpeg')} style={styles.menuIcon} />
        <Text style={styles.headerText}>ASTROLOGY APP</Text>
      </View>

      {/* Photo */}
      <Text style={styles.label}>Upload your photo <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={styles.input}
        placeholder="No file selected"
        value={photo ? photo.split('/').pop() : ''}
        editable={false}
      />
      <TouchableOpacity style={styles.button} onPress={() => pickImage(setPhoto)}>
        <Text style={styles.buttonText}>Browse Photo</Text>
      </TouchableOpacity>

      {/* PAN & Aadhar */}
      <Text style={styles.label}>Upload PAN and Aadhar card <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={styles.input}
        placeholder="No files selected"
        value={
          panAadharFiles.length === 2
            ? `${panAadharFiles.map(uri => uri.split('/').pop()).join(', ')}`
            : ''
        }
        editable={false}
      />
      <TouchableOpacity style={styles.button} onPress={pickPanAadharFiles}>
        <Text style={styles.buttonText}>Browse PAN & Aadhar</Text>
      </TouchableOpacity>

      {/* Certificate */}
      <Text style={styles.label}>Upload Certificate (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="No file selected"
        value={certificate ? certificate.split('/').pop() : ''}
        editable={false}
      />
      <TouchableOpacity style={styles.button} onPress={() => pickImage(setCertificate)}>
        <Text style={styles.buttonText}>Browse Certificate</Text>
      </TouchableOpacity>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: isValid ? '#f76b00' : '#ccc' }]}
        onPress={handleSubmit}
        activeOpacity={isValid ? 0.7 : 1}
      >
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>

      
               {/* ✅ "Accepted" Modal from IN_PROGRESS */}
               
        <Modal visible={showModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          
          {/* ✅ Icon + Text */}
          <View style={styles.contentWrapper}>
            <View style={styles.iconWrapper}>
            <AntDesign name="checkcircle" size={30} color="#4BB543"  />
            </View>
            <Text style={styles.modalTitle}>Initiated your Personal info</Text>
            <Text style={styles.modalMessage}>Please proceed to next steps.</Text>
          </View>

          {/* ✅ Separator */}
          <View style={styles.separator} />

          {/* ✅ Gradient Bottom */}
          <LinearGradient
           colors={['#FC2A0D', '#FE9F5D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBottom}
          >
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.okButton}
            >
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </LinearGradient>

        </View>
      </View>
    </Modal>

      {/* ✅ Thank You Modal after submitting */}
     <Modal visible={thankYouModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>

          {/* ✅ Content */}
          <View style={styles.contentWrapper}>
            <Text style={styles.modalTitle}>Thank You!</Text>
            <Text style={styles.modalMessage}>
              We have received your details and will get back to you shortly.
            </Text>
          </View>

          {/* ✅ Separator */}
          <View style={styles.separator} />

          {/* ✅ Gradient Bottom */}
          <LinearGradient
             colors={['#FC2A0D', '#FE9F5D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBottom}
          >
            <TouchableOpacity
              style={styles.okButton}
             onPress={() => {
  setThankYouModal(false);
  setPhoto(null);
  setPanAadharFiles([]);
  setCertificate(null);
  
  navigation.goBack();   // 🔥 Go back to previous screen
}}

            >
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          </LinearGradient>

        </View>
      </View>
    </Modal>

<Modal visible={showValidationModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <View style={styles.contentWrapper}>
        <View style={styles.iconWrapper}>
          <AntDesign name="exclamationcircle" size={30} color="#FF3B30" />
        </View>
        <Text style={styles.modalTitle}>{validationTitle}</Text>
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
{/* Popup passed from previous screen */}
<Modal visible={popupVisible} transparent animationType="fade" onRequestClose={() => setPopupVisible(false)}>
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <View style={styles.contentWrapper}>
        <View style={styles.iconWrapper}>
          <AntDesign name="clockcircle" size={30} color="#FF9500" />
        </View>
        <Text style={styles.modalTitle}>{popupTitle}</Text>
        <Text style={styles.modalMessage}>{popupMessage}</Text>
      </View>

      <View style={styles.separator} />
      <LinearGradient
        colors={['#FC2A0D', '#FE9F5D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBottom}
      >
        

  <TouchableOpacity 
  onPress={() => {
    setPopupVisible(false);
    navigation.goBack();    // 🔥 go back to AstromobileFlow
  }} 
  style={styles.okButton}
>


          <Text style={styles.okText}>OK</Text>
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
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff7900',
    padding: 15,
    marginBottom: 20,
  },
  menuIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  label: {
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
    fontSize: 14,
  },
  required: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ff7900',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#ff7900',
    paddingVertical: 10,
    borderRadius: 4,
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  submitButton: {
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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


export default AstrologerOtherDetails;