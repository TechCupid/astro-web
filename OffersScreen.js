import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';

const OffersScreen = ({ navigation }) => {
  const [selected, setSelected] = useState(null);

  const handlePress = (key, callback) => {
    setSelected(key);
    callback();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Offers</Text>

      <View style={styles.grid}>
        {/* Call / Chat */}
        <TouchableOpacity
          style={[
            styles.card,
            styles.shadow,
            selected === 'call' && styles.selectedCard,
          ]}
          onPress={() =>
            handlePress('call', () =>
              navigation.navigate('CallChatOffers')
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

        {/* Session / Course */}
        <TouchableOpacity
          style={[
            styles.card,
            styles.shadow,
            selected === 'session' && styles.selectedCard,
          ]}
          onPress={() =>
            handlePress('session', () =>
              navigation.navigate('CourseSessionOfferScreen') // ✅ navigate to your new course screen
            )
          }
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

        {/* AstroMart */}
        <TouchableOpacity
          style={[
            styles.card,
            styles.shadow,
            selected === 'astroMart' && styles.selectedCard,
          ]}
          onPress={() =>
            handlePress('astroMart', () =>
              navigation.navigate('AstroMartScreen') // optional navigation
            )
          }
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '30%',
    height: 100,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF7300',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    elevation: 3,
  },
});

export default OffersScreen;
