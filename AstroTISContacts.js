import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Linking, Platform, Modal } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import * as Contacts from 'expo-contacts';
import { LinearGradient } from 'expo-linear-gradient';
import api from './api/apiClient';
import { useApi } from "./ApiContext";
 
const AstroTISContacts = ({ navigation }) => {
  //const api = useApi();
  const { API_BASE_URL } = useApi();
 
  const [contacts, setContacts] = useState([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('info');
 
useEffect(() => {
  const fetchContacts = async () => {
    try {
      //const res = await api.get(`${api.API_BASE_URL}/api/tis-contacts`);
      const res = await api.get(`${API_BASE_URL}/api/tis-contacts`);
      setContacts(res.data);
    } catch (err) {
      console.error("Error fetching contacts:", err);
      showPopup('Error', 'Failed to load contacts from server.', 'error');
    }
  };
  fetchContacts();
}, [API_BASE_URL]);
 
 
 
 
 
  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };
 
  const showPopup = (title, message, type = 'info') => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setPopupVisible(true);
  };
 
  const handleAddAllContacts = () => {
    if (Platform.OS !== 'android') {
      showPopup('Unsupported', 'This feature is only for Android.', 'warning');
      return;
    }
    showPopup('Confirmation', 'Do you want to save all TIS contacts to your phone?', 'confirm');
  };
 
  const addContactsToDevice = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        showPopup('Permission Denied', 'Permission to access contacts was denied.', 'error');
        return;
      }
      let added = false;
      for (const contact of contacts) {
        const existing = await Contacts.getContactsAsync({ name: contact.name });
        const alreadyExists = existing.data.some(
          (c) => c.phoneNumbers && c.phoneNumbers.some((p) => p.number === contact.phone)
        );
        if (!alreadyExists) {
          await Contacts.addContactAsync({
            firstName: contact.name,
            phoneNumbers: [{ label: 'mobile', number: contact.phone }],
          });
          added = true;
        }
      }
      if (added) {
        showPopup('Success', 'Contacts added successfully!', 'success');
      } else {
        showPopup('Info', 'All contacts already exist.', 'info');
      }
    } catch (err) {
      console.error('Add contact error:', err);
      showPopup('Error', 'Failed to save contacts.', 'error');
    }
  };
 
  let iconName = 'infocirlce';
  let iconColor = '#007AFF';
  switch (popupType) {
    case 'success': iconName = 'checkcircle'; iconColor = '#4CAF50'; break;
    case 'error': iconName = 'closecircle'; iconColor = '#FF3B30'; break;
    case 'warning': iconName = 'warning'; iconColor = '#FFA500'; break;
    case 'confirm': iconName = 'questioncircle'; iconColor = '#007AFF'; break;
    default: iconName = 'infocirlce'; iconColor = '#4CAF50';
  }
 
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleCall(item.phone)}>
      <View style={styles.iconContainer}>
        <FontAwesome name="phone" size={24} color="#3CB371" />
      </View>
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.phone}>{item.phone}</Text>
      </View>
    </TouchableOpacity>
  );
 
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Astro TIS Contacts</Text>
      </View>
 
      <FlatList
        data={contacts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.flatlistContent}
      />
 
      <TouchableOpacity style={styles.addButton} onPress={handleAddAllContacts}>
        <Text style={styles.addButtonText}>Add All Contacts</Text>
      </TouchableOpacity>
 
      <Modal transparent visible={popupVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.contentWrapper}>
              <View style={styles.iconWrapper}>
                <AntDesign name={iconName} size={30} color={iconColor} />
              </View>
              <Text style={styles.modalTitle}>{popupTitle}</Text>
              <Text style={styles.modalText}>{popupMessage}</Text>
            </View>
            <View style={styles.separator} />
            <LinearGradient colors={['#FC2A0D', '#FE9F5D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBottom}>
              <TouchableOpacity
                onPress={() => {
                  setPopupVisible(false);
                  if (popupType === 'confirm') {
                    addContactsToDevice();
                  }
                }}
                style={styles.okButton}
              >
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
};
 
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEFE5',
    padding: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingLeft: 15,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 6,
    borderRadius: 10,
  },
  iconContainer: {
    backgroundColor: '#DFF5E3',
    padding: 10,
    borderRadius: 10,
    marginRight: 15,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  phone: {
    fontSize: 14,
    color: '#555',
  },
  flatlistContent: {
    paddingBottom: 80,
  },
  addButton: {
    backgroundColor: '#FF5722',
    padding: 16,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
 
  // Modal styles
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
    marginBottom: 10,
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
 
export default AstroTISContacts;