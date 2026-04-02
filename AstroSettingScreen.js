// AstroSettingsScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


const AstroSettingsScreen = ({ navigation, route }) => {
  const { astroDetails } = route.params || {};
  const [selected, setSelected] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
const [errorModalVisible, setErrorModalVisible] = useState(false);
const [message, setMessage] = useState('');


  const handlePress = (key, callback) => {
    setSelected(key);
    callback();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.grid}>
        <TouchableOpacity
          style={[styles.card, styles.shadow, selected === 'call' && styles.selectedCard]}
          onPress={() =>
            handlePress('call', () =>
              navigation.navigate('CallChatScreen', { astroDetails })
            )
          }
        >
          <Ionicons
            name="call-outline"
            size={30}
            color={selected === 'call' ? '#fff' : '#FF7300'}
          />
          <Text
            style={[styles.cardText, selected === 'call' && styles.selectedText]}
          >
            Call / Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.shadow, selected === 'session' && styles.selectedCard]}
          onPress={() => handlePress('session', () => navigation.navigate('SessionCourseScreen', { astroDetails }))}

        >
          <MaterialIcons
            name="cast-for-education"
            size={30}
            color={selected === 'session' ? '#fff' : '#FF7300'}
          />
          <Text
            style={[styles.cardText, selected === 'session' && styles.selectedText]}
          >
            Session / Course
          </Text>
        </TouchableOpacity>

       <TouchableOpacity
  style={[styles.card, styles.shadow, selected === 'astroMart' && styles.selectedCard]}
  onPress={() => handlePress('astroMart', () => navigation.navigate('AstroMartScreen', { astroDetails }))}
>
  <AntDesign
    name="shoppingcart"
    size={30}
    color={selected === 'astroMart' ? '#fff' : '#FF7300'}
  />
  <Text
    style={[styles.cardText, selected === 'astroMart' && styles.selectedText]}
  >
    AstroMart 
  </Text>
</TouchableOpacity>

      </View>

      <Modal transparent visible={successModalVisible} animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <View style={styles.contentWrapper}>
                  <View style={styles.iconWrapper}>
      <AntDesign name="checkcircle" size={30} color="green" />
      </View>
      <Text style={styles.modalTitle}>Success</Text>
      <Text style={styles.modalMessage}>{message}</Text>
      </View>
      <View style={styles.separator} />

      <LinearGradient  colors={['#FC2A0D', '#FE9F5D']}  start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }} style={styles.gradientBottom}>
        <TouchableOpacity
          style={styles.okButton}
          onPress={() => setSuccessModalVisible(false)}
        >
          <Text style={styles.okText}>OK</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>

<Modal transparent visible={errorModalVisible} animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <View style={styles.contentWrapper}>
                  <View style={styles.iconWrapper}>
      <Ionicons name="close-circle" size={50} color="red" />
      </View>
      <Text style={styles.modalTitle}>Error</Text>
      <Text style={styles.modalMessage}>{message}</Text>
      </View>

  {/* ✅ Separator */}
          <View style={styles.separator} />
      <LinearGradient
                  colors={['#FC2A0D', '#FE9F5D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }} style={styles.gradientBottom}>
        <TouchableOpacity
          style={styles.okButton}
          onPress={() => setErrorModalVisible(false)}
        >
          <Text style={styles.okText}>OK</Text>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    margin: 8,
    height: 100,
    maxWidth: '28%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF7300',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCard: {
    backgroundColor: '#FF7300',
  },
  cardText: {
    marginTop: 8,
    color: '#FF7300',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
  },
  selectedText: {
    color: '#fff',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default AstroSettingsScreen;
