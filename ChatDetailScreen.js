// ChatDetailScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import api from './api/apiClient';
import { useRoute } from '@react-navigation/native';
import { useApi } from './ApiContext';

const ChatDetailScreen = () => {
  const { API_BASE_URL } = useApi();
  const route = useRoute();
  const { astroCode, custCode, astroName, astroPhoto } = route.params;

  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const response = await api.get(
          `${API_BASE_URL}/api/custastro/search?astroCode=${astroCode}&custCode=${custCode}`
        );
        setChatList(response.data);
      } catch (error) {
        console.error('Chat history load error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, []);

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.chatBubble,
        item.typedBy === 'CUST' ? styles.customer : styles.astrologer,
      ]}
    >
      <Text style={styles.messageText}>{item.chatMessage}</Text>
      {item.base64Image && (
        <Image
          source={{ uri: item.base64Image }}
          style={{ width: 180, height: 180, marginTop: 8 }}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {loading ? (
        <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={chatList}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ padding: 12 }}
          ListHeaderComponent={
            <View style={styles.header}>
              <Image
  source={{ uri: `data:image/jpeg;base64,${astroPhoto}` }}
  style={styles.photo}
/>

              <Text style={styles.name}>{astroName}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ddd',
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chatBubble: {
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
    maxWidth: '80%',
  },
  customer: {
    alignSelf: 'flex-end',
    backgroundColor: '#d1e7ff',
  },
  astrologer: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8d7da',
  },
  messageText: {
    fontSize: 15,
    color: '#000',
  },
});

export default ChatDetailScreen;
