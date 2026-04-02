import React from "react";
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity, Platform, SafeAreaView } from "react-native";
import { useNavigation } from '@react-navigation/native';
import Ionicons from "react-native-vector-icons/Ionicons";

const AboutUsScreen = () => {
  const navigation = useNavigation();
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainWrapper}>
        
        {/* ✅ Standardized Orange Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About Us</Text>
        </View>

        {/* ✅ Content with Web Scroll Fix */}
        <ScrollView 
          style={styles.scrollArea} 
          contentContainerStyle={styles.container}
        >
          <Text style={styles.text}>
            AstroTis is an online platform which helps users connect to a curated set of astrologers who can guide them towards their long term goals.
          </Text>
          <Text style={styles.text}>
            The team at AstroTis consists of experienced folks from the Astrology and Technology spaces, with a mission to take India’s Vedic Sciences global.
          </Text>
          <Text style={styles.text}>
            We can only do that if our focus stays on ensuring that our users have the best possible experience on the platform. Every astrologer on Bodhi has been taken through multiple training sessions to ensure they focus on being the right life guide for you.
          </Text>
          <Text style={styles.text}>
            Help us achieve this vision by sharing your candid feedback with us on{" "}
            <Text style={styles.link} onPress={() => Linking.openURL("mailto:info@bodhiness.com")}>
              info@bodhiness.com
            </Text>
          </Text>
          
          <View style={styles.gstContainer}>
            <Text style={styles.gstinLabel}>GSTIN:</Text>
            <Text style={styles.gstinValue}>09AAHCV7338L1ZM</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FF6600", // Matches header
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: "#fff",
    height: Platform.OS === 'web' ? '100vh' : '100%',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6600", // Primary Orange
    paddingHorizontal: 16,
    height: 60,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },
  backBtn: {
    paddingRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  scrollArea: {
    flex: 1,
    ...Platform.select({
      web: {
        flexBasis: 0,
        overflowY: 'auto',
      }
    })
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  text: {
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
    textAlign: "justify",
    marginBottom: 20,
  },
  link: {
    color: "#FF6600", // Themed link color
    fontWeight: 'bold',
    textDecorationLine: "underline",
  },
  gstContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#FF6600",
  },
  gstinLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#777",
    textTransform: "uppercase",
  },
  gstinValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
});

export default AboutUsScreen;