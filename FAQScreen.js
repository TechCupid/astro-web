import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import api from './api/apiClient';
import { useApi } from './ApiContext';

const FAQScreen = ({ navigation }) => {
  const [faqList, setFaqList] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { API_BASE_URL } = useApi();

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await api.get(`${API_BASE_URL}/api/faqs`);
        setFaqList(response.data);
        setFilteredFaqs(response.data); // initially same as original
      } catch (error) {
        console.error("Error fetching FAQs:", error.message);
        Alert.alert("Error", "Failed to load FAQs from server.");
      }
    };

    fetchFAQs();
  }, []);

  const toggleExpand = (qNo) => {
    setExpandedId(prev => (prev === qNo ? null : qNo));
  };

  const handleSearchPress = () => {
    setIsSearching(prev => !prev);
    if (isSearching) {
      // When closing search, reset results
      setSearchQuery("");
      setFilteredFaqs(faqList);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredFaqs(faqList);
    } else {
      const lowerText = text.toLowerCase();
      const filtered = faqList.filter(faq =>
        faq.question.toLowerCase().includes(lowerText) ||
        (faq.answer && faq.answer.toLowerCase().includes(lowerText))
      );
      setFilteredFaqs(filtered);
    }
  };

  const handleContactPress = () => {
    Alert.alert("Contact Us", "Implement contact functionality here.");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>FAQ</Text>

        <TouchableOpacity onPress={handleSearchPress}>
          <Ionicons name={isSearching ? "close" : "search"} size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {isSearching && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#777" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search questions..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus
          />
        </View>
      )}

      {/* FAQ List */}
      <ScrollView style={styles.scrollView}>
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => (
            <View key={faq.qno} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => toggleExpand(faq.qno)}
              >
                <Text style={styles.questionText}>{faq.question}</Text>
                <Ionicons
                  name={expandedId === faq.qno ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#000"
                />
              </TouchableOpacity>

              {expandedId === faq.qno && faq.answer && (
                <Text style={styles.answerText}>{faq.answer}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={{ textAlign: "center", marginTop: 20, color: "#888" }}>
            No results found.
          </Text>
        )}
      </ScrollView>

      {/* Floating Contact Us Button */}
         {/* <TouchableOpacity style={styles.floatingButton} onPress={handleContactPress}>
        <Text style={styles.floatingButtonText}>Contact Us</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 20,
    paddingHorizontal: 15,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFEFE5",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  scrollView: { paddingHorizontal: 10, marginTop: 10, marginBottom: 70 },
  faqItem: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questionText: {
    fontSize: 16,
    color: "#000",
    flex: 1,
    marginRight: 10,
  },
  answerText: {
    marginTop: 10,
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    backgroundColor: "#FFEFE5",
    padding: 10,
    borderRadius: 8,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#FF5C00",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    elevation: 5,
  },
  floatingButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default FAQScreen;
