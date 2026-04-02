import React from 'react';
import { View, Text } from 'react-native';

const CustomerScreen = ({ route }) => {
  const { customerDetails } = route.params;

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Customer Details</Text>
      <Text>Name: {customerDetails.custName}</Text>
      <Text>Mobile No: {customerDetails.custMobileNo}</Text>
      <Text>Email: {customerDetails.custMailId}</Text>
    </View>
  );
};

export default CustomerScreen;
