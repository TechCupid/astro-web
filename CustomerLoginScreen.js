import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen  from './LoginScreen'; // Your screen with the mobile number input
import CustomerScreen from './CustomerScreen';           // Page to open if customer exists
import OtpPage from './OtpPage';       // OTP page if customer does not exist
import CustRegisterScreen from './CustRegisterScreen';// Customer Registration page
import MainScreen from './MainScreen';
import { ApiProvider,useApi  } from './ApiContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <ApiProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Customer" component={CustomerScreen} />
        <Stack.Screen name="Register" component={CustRegisterScreen} />
        <Stack.Screen name="OtpPage" component={OtpPage} />
        <Stack.Screen name="Main" component={MainScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </ApiProvider>
  );
}
