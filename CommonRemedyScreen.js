import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Linking, // Added for temple URLs
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from "@expo/vector-icons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useApi } from "./ApiContext";

export default function CommonRemedyScreen({ route }) {
  const { API_BASE_URL } = useApi();
  const viewOnly = route?.params?.viewOnly || false; 

  const [commonRemedies, setCommonRemedies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [remedyCat, setRemedyCat] = useState("");
  const [remedyType, setRemedyType] = useState("");
  const [remedyDtl, setRemedyDtl] = useState("");

  // Popup state
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  const showPopup = (type, title, message) => {
    setPopupType(type);
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupVisible(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const fetchCommonRemedies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/astrocust/remedies`);
      const filtered = response.data.filter(
        (item) => !item.custCode || item.custCode.trim() === ""
      );
      setCommonRemedies(filtered);
    } catch (err) {
      console.error("Error fetching common remedies:", err);
      showPopup("error", "Error", "Unable to load common remedies.");
    } finally {
      setLoading(false);
    }
  };

  const submitRemedy = async () => {
    if (!remedyCat || !remedyType || !remedyDtl) {
      showPopup("error", "Validation", "All fields are required!");
      return;
    }

    try {
      const storedAstro = await AsyncStorage.getItem("loggedInAstro");
      const astroDetails = storedAstro ? JSON.parse(storedAstro) : null;

      if (!astroDetails?.astroId) {
        showPopup("error", "Error", "Astrologer details not found.");
        return;
      }

      const payload = {
        astroId: astroDetails.astroId,
        astroName: astroDetails.astroName,
        custCode: "", 
        remedyCat,
        remedyType,
        remedyDtl,
        remedyTime: new Date().toISOString(),
      };

      await axios.post(`${API_BASE_URL}/api/astrocust/remedies/create`, payload);
      showPopup("success", "Success", "Common remedy added!");
      setRemedyCat("");
      setRemedyType("");
      setRemedyDtl("");
      fetchCommonRemedies();
    } catch (err) {
      console.error("Error saving common remedy:", err);
      showPopup("error", "Error", "Unable to save remedy.");
    }
  };

  useEffect(() => {
    fetchCommonRemedies();
  }, []);

  // --- This is the new, styled renderRemedyItem ---
  const renderRemedyItem = ({ item }) => {
    const openUrl = async (url) => {
        if (!url) {
            showPopup("info", "No URL", "An official website was not provided for this temple.");
            return;
        }
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                showPopup("error", "Error", `Sorry, cannot open this URL: ${url}`);
            }
        } catch (error) {
            showPopup("error", "Error", `An error occurred trying to open the URL: ${error.message}`);
        }
    };

    const isSpiritual = item.remedyType === 'SPIRITUAL';
    const icon = item.remedyType === 'COMMON' ? 'format-list-bulleted' : (isSpiritual ? 'domain' : 'account-heart-outline');

    return (
        <View style={styles.card}>
            <LinearGradient
                colors={['#FF6633', '#FF9F5D']}
                style={styles.cardGradientBorder}
            />
        
            <View style={styles.cardHeader}>
                <MaterialCommunityIcons name={icon} size={22} color="#FF6633" />
                <Text style={styles.cardCategory}>{item.remedyCat || 'Remedy'}</Text>
            </View>

            <View style={styles.cardRow}>
                <Text style={styles.remedyLabel}>Details: </Text>
                <Text style={[styles.remedyDtl, { flexShrink: 1 }]}>{item.remedyDtl || 'No details provided.'}</Text>
            </View>

            {/* --- THIS IS THE ASTROLOGER NAME SECTION --- */}
            {item.astroName && (
                <View style={[styles.cardRow, { marginTop: 8 }]}>
                    <MaterialCommunityIcons name="account-tie" size={16} color="#555" style={{ marginRight: 6 }} />
                    <Text style={styles.remedyLabel}>Astrologer: </Text>
                    <Text style={styles.astroNameValue}>{item.astroName}</Text>
                </View>
            )}

            {/* Temples (if any) */}
            {item.temples && item.temples.length > 0 && (
                <View style={styles.templeSection}>
                    <Text style={styles.templeSectionTitle}>Recommended Temple(s):</Text>
                    {item.temples.map((temple, index) => {
                        const isTempleObject = typeof temple === 'object' && temple !== null && temple.name;
                        const templeName = isTempleObject ? temple.name : temple;
                        const templeUrl = isTempleObject ? temple.url : null;
                        const templeDistrict = isTempleObject ? temple.district : null;
                        const templeState = isTempleObject ? temple.state : null;

                         return (
                            <TouchableOpacity
                                key={index}
                                style={styles.templeItemContainer} 
                                onPress={() => openUrl(templeUrl)}
                                disabled={!templeUrl}
                            >
                                <MaterialCommunityIcons name="domain" size={24} color="#FF6633" style={styles.templeIcon} />
                                <View style={styles.templeInfoContainer}>
                                    <Text style={[styles.templeName, !templeUrl && styles.templeNoLink]}>
                                        {templeName}
                                    </Text>
                                    {(templeDistrict || templeState) && (
                                        <Text style={styles.templeLocation}>
                                            {templeDistrict}{templeDistrict && templeState ? ', ' : ''}{templeState}
                                        </Text>
                                    )}
                                    <Text style={styles.templeUrl} numberOfLines={1} ellipsizeMode="tail">
                                        {templeUrl || 'No URL provided'}
                                    </Text>
                                </View>
                                {templeUrl && (
                                    <MaterialCommunityIcons name="chevron-right" size={22} color="#aaa" />
                                )}
                            </TouchableOpacity>
                         );
                    })}
                </View>
            )}
            
            {/* Date/Time Row */}
            <View style={styles.dateTimeRow}>
                <MaterialCommunityIcons name="calendar" size={16} color="#FF6633" />
                <Text style={styles.datetime}> {formatDate(item.remedyTime || item.createdAt)}</Text>
                <View style={{ flex: 1 }} />
                <MaterialCommunityIcons name="clock-time-four" size={16} color="#FF6633" />
                <Text style={styles.datetime}> {formatTime(item.remedyTime || item.createdAt)}</Text>
            </View>
        </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {!viewOnly && (
        <>
          <Text style={styles.heading}>Add Common Remedy</Text>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Remedy Category"
              style={styles.input}
              value={remedyCat}
              onChangeText={setRemedyCat}
            />
            <TextInput
              placeholder="Remedy Type"
              style={styles.input}
              value={remedyType}
              onChangeText={setRemedyType}
            />
            <TextInput
              placeholder="Remedy Details"
              style={[styles.input, { height: 80 }]}
              value={remedyDtl}
              onChangeText={setRemedyDtl}
              multiline
            />
            <TouchableOpacity style={styles.buttonOrange} onPress={submitRemedy}>
              <Text style={styles.buttonText}>Submit Remedy</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* This View applies the new list background color */}
      <View style={styles.contentArea}> 

        {loading ? (
          <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={commonRemedies}
            renderItem={renderRemedyItem} // This now uses the new card
            keyExtractor={(item, index) => item.remedysl?.toString() || index.toString()}
            contentContainerStyle={styles.listContentContainer} // Use new style
            ListEmptyComponent={
              <Text style={styles.noData}>No common remedies found.</Text>
            }
          />
        )}
      </View>

      {/* 🔹 Shared Popup Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={popupVisible}
        onRequestClose={() => setPopupVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.contentWrapper}>
              <View style={styles.iconWrapper}>
                {popupType === "success" && <AntDesign name="checkcircle" size={40} color="#4BB543" />}
                {popupType === "error" && <AntDesign name="closecircle" size={40} color="#FF3B30" />}
                {popupType === "offline" && <AntDesign name="closecircle" size={40} color="#FF3B30" />}
                {popupType === "busy" && <AntDesign name="clockcircle" size={40} color="#FF9500" />}
                {popupType === "info" && <AntDesign name="infocirlce" size={40} color="#007AFF" />}
              </View>
              <Text style={styles.modalTitle}>{popupTitle}</Text>
              <Text style={styles.modalMessage}>{popupMessage}</Text>
            </View>
            <View style={styles.separator} />
            <LinearGradient
              colors={["#FC2A0D", "#FE9F5D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBottom}
            >
              <TouchableOpacity
                onPress={() => setPopupVisible(false)}
                style={styles.okButton}
              >
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // --- Form Styles ---
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6633",
    marginLeft: 10,
    marginTop: 10,
    marginBottom: 5,
  },
  inputContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff', 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
  },
  buttonOrange: {
    backgroundColor: "#FF6633",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  noData: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },

  // --- CONTENT AREA (For List) ---
  contentArea: {
    flex: 1,
    backgroundColor: '#f7f8fa', 
  },
  listContentContainer: {
    paddingHorizontal: 10, 
    paddingTop: 10,
  },

  // --- NEW CARD STYLES ---
  card: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      overflow: 'hidden',
  },
  cardGradientBorder: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 5,
  },
  cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      marginLeft: 8,
  },
  cardCategory: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FF6633', 
      marginLeft: 8,
      flex: 1, 
  },
  cardRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
      marginLeft: 8,
  },
  remedyLabel: {
      fontSize: 14,
      color: '#555',
      fontWeight: '600',
  },
  remedyValue: {
      fontSize: 14,
      color: '#333',
      fontWeight: '600',
  },
  remedyDtl: {
      fontSize: 14,
      color: '#FF6633', 
      fontWeight: '500',
  },
  astroNameValue: { 
      fontWeight: '600',
      color: '#444',
      fontSize:14,
  },
  templeSection: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderColor: '#f0f0f0',
      marginLeft: 8,
  },
  templeSectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 8,
  },
  templeItemContainer: { 
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      backgroundColor: '#f7f8fa', 
      borderRadius: 8,
      marginBottom: 8,
  },
  templeIcon: {
      marginRight: 10,
  },
  templeInfoContainer: {
      flex: 1, 
      marginRight: 10,
  },
  templeName: { 
      fontSize: 15,
      fontWeight: 'bold',
      color: '#007AFF', 
      marginBottom: 2,
  },
  templeLocation: {
      fontSize: 13,
      color: '#555',
  },
  templeUrl: {
      fontSize: 12,
      color: '#007AFF',
      fontStyle: 'italic',
      marginTop: 3, 
  },
  templeNoLink: {
      color: '#333', 
      textDecorationLine: 'none',
  },
  dateTimeRow: { 
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderColor: '#f0f0f0',
      marginLeft: 8,
  },
  datetime: {
      color: '#555',
      marginLeft: 5,
      fontSize: 12,
  },

  // --- Popup Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '75%',
    backgroundColor: '#FFEFE5',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
  },
  contentWrapper: {
    padding: 25,
    alignItems: 'center',
  },
  iconWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 15,
    color: '#4F4F4F',
    textAlign: 'center',
    lineHeight: 22,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  gradientBottom: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  okButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  okButtonText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 16,
  },
});