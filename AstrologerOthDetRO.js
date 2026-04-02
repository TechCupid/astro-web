import React, { useState, useEffect } from 'react';
import { useApi } from './ApiContext'; 
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  
} from 'react-native';
import axios from 'axios';

const AstrologerOthDetRO = ({ navigation, route }) => {
  const { mobileNumber } = route.params;
  const [astroDetails, setAstroDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { API_BASE_URL } = useApi();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Make the API request
        const astrologersResponse = await axios.get(`${API_BASE_URL}/api/astro/latest/${mobileNumber}`);
        
        // Set the astro details from the response data
        setAstroDetails(astrologersResponse.data);
      } catch (error) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mobileNumber]);

  if (loading) {
    // Show loading indicator while fetching
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    // Show error if there's an issue fetching the data
    return (
      <View style={styles.container}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
   
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.container}>
        <Text style={styles.title}>Astrologer Other Details</Text>
        
        {/* Display Astro Details */}
        <Text style={styles.detailText}><Text style={styles.boldText}>Mobile:</Text> {astroDetails.astroId}</Text>
        <Text style={styles.detailText}><Text style={styles.boldText}>Speak Language:</Text> {astroDetails.astroSpeakLang}</Text>
        <Text style={styles.detailText}><Text style={styles.boldText}>Write Language:</Text> {astroDetails.astroWriteLang}</Text>
        <Text style={styles.detailText}><Text style={styles.boldText}>Experience:</Text> {astroDetails.astroExp}</Text>
        <Text style={styles.detailText}><Text style={styles.boldText}>Specialization:</Text> {astroDetails.astroSpec}</Text>

        <Text style={styles.detailText}>Astrologier Photo</Text> 
        {/* Display Image */}
        {astroDetails.astroPhoto && (
          <Image
            source={{ uri: `data:image/jpeg;base64,${astroDetails.astroPhoto}` }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

      <Text style={styles.detailText}>Astrologier Certificates</Text> 

        {/* Display Certificates */}
        {[astroDetails.astroCert1, astroDetails.astroCert2, astroDetails.astroCert3, astroDetails.astroCert4, astroDetails.astroCert5].map((cert, index) => 
          cert ? (
            <Image
              key={index}
              source={{ uri: `data:image/jpeg;base64,${cert}` }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : null
        )}

        <Button title="Go Back" onPress={() => navigation.goBack()}color= "#454371" />
      </View>
    </ScrollView>
   
  );
};

const styles = StyleSheet.create({
  
  container: {
    backgroundColor: '#0B0B45',
    flexGrow: 1,
    padding: 20,
    
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  detailText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
  },
  boldText: {
    fontWeight: 'bold',  // Use this style to make text bold
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 20,
    borderRadius: 10,
  },
});

export default AstrologerOthDetRO;
