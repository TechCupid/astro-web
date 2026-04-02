import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from "@expo/vector-icons";

const AstroProfileInfo = ({ navigation }) => {
  const [astroDetails, setAstroDetails] = useState(null);
  const [zoomVisible, setZoomVisible] = useState(false);

  useEffect(() => {
    const loadAstrologer = async () => {
      try {
        const stored = await AsyncStorage.getItem('loggedInAstro');
        if (stored) {
          const parsed = JSON.parse(stored);
          setAstroDetails(parsed);
        }
      } catch (err) {
        console.error('❌ Error loading profile:', err);
      }
    };
    loadAstrologer();
  }, []);

  if (!astroDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const rawBase64 = astroDetails.astroPhotoBase64;
  const imageUri = rawBase64?.startsWith('data:image')
    ? rawBase64
    : `data:image/jpeg;base64,${rawBase64}`;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Container with fixed height for Web */}
      <View style={{ flex: 1, height: Platform.OS === 'web' ? '100vh' : '100%' }}>
        
        {/* Header with Back Arrow and No Icon */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Astrologer Profile</Text>
        </View>

        {/* ScrollView with the applied scrollArea style */}
        <ScrollView 
          style={styles.scrollArea} 
          contentContainerStyle={styles.container}
        >
          {rawBase64 ? (
            <TouchableOpacity onPress={() => setZoomVisible(true)}>
              <Image source={{ uri: imageUri }} style={styles.profileImage} />
            </TouchableOpacity>
          ) : (
            <Text style={{ color: 'gray', marginBottom: 20 }}>No profile image found.</Text>
          )}

          <ProfileItem label="Name" value={astroDetails.astroName} />
          <ProfileItem label="Gender" value={astroDetails.astroGender} />
          <ProfileItem label="Mobile" value={astroDetails.astroMobile} />
          <ProfileItem label="Email" value={astroDetails.astroMailId} />
          <ProfileItem label="DOB" value={astroDetails.astroDob} />
          <ProfileItem label="Place of Birth" value={astroDetails.astroPlaceOfBirth} />
          <ProfileItem label="Education" value={astroDetails.astroEduDtls} />
          <ProfileItem label="Experience (Years)" value={astroDetails.astroExp?.toString()} />
          <ProfileItem label="Languages Known" value={astroDetails.astroSpeakLang} />
          <ProfileItem label="Specializations" value={astroDetails.astroSpec} />

          <Modal visible={zoomVisible} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} onPress={() => setZoomVisible(false)}>
              <Image source={{ uri: imageUri }} style={styles.zoomedImage} resizeMode="contain" />
            </TouchableOpacity>
          </Modal>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const ProfileItem = ({ label, value }) => (
  <View style={styles.itemContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.valueBox}>
      <Text style={styles.value}>{value || 'N/A'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollArea: {
    flex: 1,
    ...Platform.select({
      web: {
        flexBasis: 0,
        overflowY: 'auto',
      }
    })
  },
  container: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 50, // Added padding to ensure bottom content is visible
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff9900',
    padding: 16,
    width: '100%',
  },
  headerText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: '#FF6100',
    marginBottom: 20,
    marginTop: 10,
  },
  itemContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  valueBox: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    borderColor: '#FF6100',
    borderWidth: 1,
  },
  value: {
    fontSize: 16,
    color: '#555',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomedImage: {
    width: '100%',
    height: '100%',
  },
});

export default AstroProfileInfo;