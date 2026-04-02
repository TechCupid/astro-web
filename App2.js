import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { app } from './firebaseConfig';

export default function App() {
  useEffect(() => {
    console.log('Firebase app initialized:', app);
  }, []);

  return (
    <View>
      <Text>Firebase Integration Test</Text>
    </View>
  );
}