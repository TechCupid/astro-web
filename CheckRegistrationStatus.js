import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RegistrationPage from './RegistrationPage'; // Your registration page component
import AstroRegistrationComplete from './AstroRegistrationComplete'; // Your main page component
import AstrologerOtherDetails from './AstrologerOtherDetails'; // Your main page component


const App = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isVerified, setIsVerified] = useState(false);
    const [isOthersRegistered, setIsOthersRegistered] = useState(false);

    useEffect(() => {
        const checkVerificationStatus = async () => {
            try {
                const verified = await AsyncStorage.getItem('isVerified');
                const othersRegistered =await AsyncStorage.getItem('isOthersRegistered');
                setIsVerified(verified === 'true'); // Convert string to boolean
                setIsOthersRegistered(othersRegistered==='true');
            } catch (error) {
                console.error('Error reading verification status:', error);
            } finally {
                setIsLoading(false);
                setIsOthersRegistered(false);
            }
        };

        checkVerificationStatus();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }


};

export default App;
