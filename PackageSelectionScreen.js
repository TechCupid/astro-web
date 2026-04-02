import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const dummyPackages = [
  { label: '1 Minute', mins: 1 },
  { label: '3 Minutes', mins: 3 },
  { label: '5 Minutes', mins: 5 },
];

const PackageSelectionScreen = ({ navigation, route }) => {
  const { astroId, name, mobileNumber, fromScreen } = route.params;

  const handleSelect = (pkg) => {
    navigation.replace('ChatScreen', {
      astroId,
      name,
      mobileNumber,
      fromScreen,
      package: pkg,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Choose a Chat Package</Text>
      {dummyPackages.map((pkg, index) => (
        <TouchableOpacity
          key={index}
          style={styles.packageBtn}
          onPress={() => handleSelect(pkg)}
        >
          <Text style={styles.label}>{pkg.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  packageBtn: {
    backgroundColor: '#FF6B00',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  label: { color: '#fff', fontWeight: 'bold' },
});

export default PackageSelectionScreen;
