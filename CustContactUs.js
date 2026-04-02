import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export default function CustContactUs({ navigation }) {
  const [selected, setSelected] = useState(null);

  const handlePress = (key, callback) => {
    setSelected(key);
    callback();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Contact Us</Text>

      <View style={styles.row}>
        {/* FAQ */}
        <TouchableOpacity
          style={[styles.card, selected === 'faq' && styles.selectedCard]}
          onPress={() =>
            handlePress('faq', () => navigation.navigate('FAQScreen'))
          }
        >
          <MaterialIcons
            name="help-outline"
            size={32}
            color={selected === 'faq' ? '#fff' : '#ff9900'}
          />
          <Text
            style={[styles.cardText, selected === 'faq' && styles.selectedText]}
          >
            Search FAQ
          </Text>
        </TouchableOpacity>

        {/* Support */}
        <TouchableOpacity
          style={[styles.card, selected === 'support' && styles.selectedCard]}
          onPress={() =>
            handlePress('support', () => navigation.navigate('CustomerSupport'))
          }
        >
          <FontAwesome5
            name="headset"
            size={32}
            color={selected === 'support' ? '#fff' : '#ff9900'}
          />
          <Text
            style={[
              styles.cardText,
              selected === 'support' && styles.selectedText,
            ]}
          >
            Support
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  card: {
    width: 100,
    height: 100,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#FF7300',
    textAlign: 'center',
  },
  selectedText: {
    color: '#fff',
  },
});
