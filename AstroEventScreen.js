import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Modal,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from "./api/apiClient";
import { useApi } from "./ApiContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const AstroEventScreen = ({ route }) => {
  const { API_BASE_URL } = useApi();
  const EVENT_API = `${API_BASE_URL}/api/events`;
  const organizerName = route.params?.astroDetails?.astroName || "Expert Astrologer";

  // --- 1. REFERENCES ---
  const scrollRef = useRef(null);

  // --- 2. FORM STATES ---
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("Online");
  const [eventAddress, setEventAddress] = useState("");
  const [isPaidEvent, setIsPaidEvent] = useState("No");
  const [entryFees, setEntryFees] = useState("");
  const [eventImageBase64, setEventImageBase64] = useState(null);

  // --- 3. DATE STATES ---
  const [notifDate, setNotifDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date(Date.now() + 86400000));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 172800000));
  const [showNotifPicker, setShowNotifPicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // --- 4. DATA & UI STATES ---
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [lightboxVisible, setLightboxVisible] = useState(false);

  // --- 5. REGISTRATION & RENEW STATES ---
  const [registrations, setRegistrations] = useState([]);
  const [regLoading, setRegLoading] = useState(false);
  const [isRenewMode, setIsRenewMode] = useState(false); 
  const [targetEventId, setTargetEventId] = useState(null);

  // --- 6. POPUP STATES ---
  const [successVisible, setSuccessVisible] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const navigation = useNavigation();

  useEffect(() => { 
    fetchEvents(); 
  }, []);

  const fetchEvents = async () => {
    try {
      const activeRes = await api.get(`${EVENT_API}/all`);
      const pastRes = await api.get(`${EVENT_API}/past/all`);
      setEvents(activeRes.data || []);
      setPastEvents(pastRes.data || []);
    } catch (err) { 
      console.error("Error fetching events:", err); 
    }
  };

  const fetchRegistrations = async (eventId) => {
    setRegLoading(true);
    try {
      const res = await api.get(`${EVENT_API}/registrations/${eventId}`);
      setRegistrations(res.data || []);
    } catch (err) {
      console.error("Error fetching registrations:", err);
      setRegistrations([]);
    } finally {
      setRegLoading(false);
    }
  };

  const handlePrepareRenew = (event) => {
    setTargetEventId(event.eventId);
    setEventName(event.eventName);
    setDescription(event.eventDescription || "");
    setMode(event.modeOfEvent || "Online");
    setEventAddress(event.eventAddress || "");
    setIsPaidEvent(event.entryFees > 0 ? "Yes" : "No");
    setEntryFees(event.entryFees ? event.entryFees.toString() : "0");
    setEventImageBase64(event.eventImageBase64);
    
    // Parse dates back to Date objects if they exist
    if (event.startDate) {
        const [d, m, y] = event.startDate.split('/');
        setStartDate(new Date(y, m - 1, d));
    }

    setIsRenewMode(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const formatDate = (date) => {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

 const submitEvent = async () => {
    console.log("Submit triggered. Mode:", isRenewMode ? "Reschedule" : "Create");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ✅ Validation logic
    if (isRenewMode && !targetEventId) {
      Alert.alert("Error", "No event selected for update.");
      return;
    }
    if (startDate < today) { 
      setStatusMessage("Start date cannot be in the past."); 
      setErrorVisible(true); 
      return; 
    }
    if (endDate < startDate) { 
      setStatusMessage("End date cannot be earlier than start date."); 
      setErrorVisible(true); 
      return; 
    }
    if (!eventName.trim() || !description.trim()) { 
      setStatusMessage("Please fill in the Event Name and Description."); 
      setErrorVisible(true); 
      return; 
    }

    setLoading(true);

    // ✅ Detect source table
    const isFromPast = pastEvents.some(e => e.eventId === targetEventId);

    const payload = {
      eventId: targetEventId,
      isFromPastTable: isFromPast, 
      eventName: eventName,
      eventDescription: description,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      notificationDate: formatDate(notifDate),
      modeOfEvent: mode,
      eventAddress: mode === "Offline" ? eventAddress : "Online",
      entryFees: isPaidEvent === "Yes" ? parseFloat(entryFees) : 0,
      eventImageBase64: eventImageBase64,
    };

    console.log("Sending Payload:", payload);

    try {
      if (isRenewMode) {
        // ✅ Calls the unified reschedule logic in Spring Boot
        const response = await api.post(`${EVENT_API}/renew`, payload);
        console.log("Reschedule Success:", response.data);
        setStatusMessage("Event Updated & Members Notified! 📅");
      } else {
        const response = await api.post(`${EVENT_API}/create`, payload);
        console.log("Create Success:", response.data);
        setStatusMessage("Event Published Successfully! 🚀");
      }

      setSuccessVisible(true);
      clearForm();
      fetchEvents(); // Refresh lists
    } catch (err) {
      console.error("API Error:", err.response?.data || err.message);
      setStatusMessage(err.response?.data || "Operation failed. Please try again.");
      setErrorVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setEventName(""); setDescription(""); setEventAddress(""); setEntryFees("");
    setEventImageBase64(null); setIsPaidEvent("No"); setMode("Online");
    setIsRenewMode(false); setTargetEventId(null);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`${EVENT_API}/delete/${targetDeleteId}`);
      setDeleteVisible(false);
      fetchEvents();
    } catch (err) {
      setDeleteVisible(false);
      setStatusMessage("Delete failed.");
      setErrorVisible(true);
    }
  };

  const pickImage = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "image/*" });
    if (!result.canceled && result.assets?.length > 0) {
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => setEventImageBase64(reader.result);
      reader.readAsDataURL(blob);
    }
  };

  const renderCardImage = (item) => {
    if (item.eventImageBase64) {
      return <Image source={{ uri: item.eventImageBase64 }} style={styles.cardImage} />;
    }
    return (
      <LinearGradient colors={['#FF9966', '#FF5E62']} style={styles.placeholderGradient}>
        <Text style={styles.placeholderLetter}>{item.eventName.charAt(0).toUpperCase()}</Text>
      </LinearGradient>
    );
  };

  const renderEventCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.beautifiedCard} 
      onPress={() => { 
        setSelectedEvent(item); 
        setDetailsVisible(true); 
        fetchRegistrations(item.eventId); 
      }}
    >
      {renderCardImage(item)}
      <View style={styles.cardPadding}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.eventName}</Text>
          <TouchableOpacity onPress={() => { setTargetDeleteId(item.eventId); setDeleteVisible(true); }}>
            <Ionicons name="trash-outline" size={20} color="#E53E3E" />
          </TouchableOpacity>
        </View>
        <Text style={styles.organizerText}>By {item.organizerName}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={12} color="#FF6600" />
            <Text style={styles.dateBadgeText}>{item.startDate}</Text>
          </View>
          <Text style={styles.priceText}>{item.entryFees > 0 ? `₹${item.entryFees}` : 'FREE'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6600" />
      <View style={styles.mainWrapper}>
        {/* ✅ FIXED: Header is its own View, NOT wrapping the ScrollView */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Events</Text>
        </View>

        {/* ✅ FIXED: ScrollView starts AFTER the header ends */}
        <ScrollView 
          ref={scrollRef} 
          style={styles.scrollArea} 
          contentContainerStyle={styles.container} 
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={styles.label}>{isRenewMode ? "Renewing: " + eventName : "Event Name"}</Text>
            <TextInput 
              style={styles.input} 
              value={eventName} 
              onChangeText={setEventName} 
              placeholder="E.g. Full Moon Meditation" 
              editable={!isRenewMode} 
            />
            
            <Text style={styles.label}>Description</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={description} 
              onChangeText={setDescription} 
              multiline 
              placeholder="What should attendees expect?" 
            />

            <Text style={styles.label}>Publish Advertisement From</Text>
            <TouchableOpacity style={styles.dateRow} onPress={() => setShowNotifPicker(true)}>
                <Ionicons name="notifications-outline" size={18} color="#FF6600" />
                <Text style={styles.dateVal}>{formatDate(notifDate)}</Text>
            </TouchableOpacity>
            {showNotifPicker && (
              <DateTimePicker 
                value={notifDate} 
                mode="date" 
                minimumDate={new Date()} 
                onChange={(e, d) => { setShowNotifPicker(false); if(d) setNotifDate(d); }} 
              />
            )}

            <View style={styles.dualDateRow}>
                <View style={{flex:1, marginRight:10}}>
                  <Text style={styles.label}>Start Date</Text>
                  <TouchableOpacity style={styles.dateRow} onPress={() => setShowStartPicker(true)}>
                      <Text style={styles.dateVal}>{formatDate(startDate)}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{flex:1}}>
                  <Text style={styles.label}>End Date</Text>
                  <TouchableOpacity style={styles.dateRow} onPress={() => setShowEndPicker(true)}>
                      <Text style={styles.dateVal}>{formatDate(endDate)}</Text>
                  </TouchableOpacity>
                </View>
            </View>
            {showStartPicker && <DateTimePicker value={startDate} mode="date" minimumDate={new Date(Date.now() + 86400000)} onChange={(e, d) => { setShowStartPicker(false); if(d) setStartDate(d); }} />}
            {showEndPicker && <DateTimePicker value={endDate} mode="date" minimumDate={startDate} onChange={(e, d) => { setShowEndPicker(false); if(d) setEndDate(d); }} />}

            <Text style={styles.label}>Is this a paid event?</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity onPress={() => setIsPaidEvent("Yes")} style={styles.radioItem}>
                <Ionicons name={isPaidEvent === "Yes" ? "radio-button-on" : "radio-button-off"} size={22} color="#FF6600" />
                <Text style={styles.radioLabel}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {setIsPaidEvent("No"); setEntryFees("");}} style={styles.radioItem}>
                <Ionicons name={isPaidEvent === "No" ? "radio-button-on" : "radio-button-off"} size={22} color="#FF6600" />
                <Text style={styles.radioLabel}>No</Text>
              </TouchableOpacity>
            </View>
            {isPaidEvent === "Yes" && (
              <TextInput 
                style={[styles.input, styles.conditionalInput]} 
                keyboardType="numeric" 
                value={entryFees} 
                onChangeText={setEntryFees} 
                placeholder="Fees (₹)" 
              />
            )}

            <Text style={styles.label}>Event Mode</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity onPress={() => setMode("Online")} style={styles.radioItem}>
                <Ionicons name={mode === "Online" ? "radio-button-on" : "radio-button-off"} size={22} color="#FF6600" />
                <Text style={styles.radioLabel}>Online</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode("Offline")} style={styles.radioItem}>
                <Ionicons name={mode === "Offline" ? "radio-button-on" : "radio-button-off"} size={22} color="#FF6600" />
                <Text style={styles.radioLabel}>Offline</Text>
              </TouchableOpacity>
            </View>
            {mode === "Offline" && (
              <TextInput 
                style={[styles.input, styles.conditionalInput]} 
                value={eventAddress} 
                onChangeText={setEventAddress} 
                placeholder="Enter venue address..." 
              />
            )}

            <TouchableOpacity style={styles.browseBtn} onPress={pickImage}>
              <Text style={styles.browseText}>{eventImageBase64 ? "Image Added ✅" : "Upload Event Banner"}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: "#FF6600" }]} 
              onPress={submitEvent} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isRenewMode ? "Update / Reschedule Event" : "Publish Event"}
                </Text>
              )}
            </TouchableOpacity>
            
            {isRenewMode && (
              <TouchableOpacity onPress={clearForm} style={styles.cancelBtn}>
                <Text style={{color: '#E53E3E', fontWeight: 'bold', marginTop: 10}}>Cancel Reschedule</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#A0AEC0" />
              <TextInput style={styles.searchInput} placeholder="Search your events..." value={searchQuery} onChangeText={setSearchQuery} />
          </View>

          <Text style={styles.sectionTitle}>Active Events</Text>
          <FlatList 
            data={events.filter(e => e.eventName.toLowerCase().includes(searchQuery.toLowerCase()))} 
            renderItem={renderEventCard} 
            keyExtractor={item => item.eventId.toString()} 
            scrollEnabled={false} 
            ListEmptyComponent={<Text style={styles.emptyText}>No active events found.</Text>} 
          />

          <Text style={[styles.sectionTitle, {marginTop: 30}]}>Past Events (Archived)</Text>
          <FlatList 
            data={pastEvents.filter(e => e.eventName.toLowerCase().includes(searchQuery.toLowerCase()))} 
            renderItem={renderEventCard} 
            keyExtractor={item => item.eventId.toString()} 
            scrollEnabled={false} 
            ListEmptyComponent={<Text style={styles.emptyText}>No past events.</Text>} 
          />

          <View style={{height: 80}} />
        </ScrollView>
      </View>

      {/* --- DETAILS MODAL --- */}
      <Modal animationType="slide" visible={detailsVisible} onRequestClose={() => setDetailsVisible(false)}>
        <SafeAreaView style={{flex:1, backgroundColor:'#fff'}}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDetailsVisible(false)}>
              <Ionicons name="close" size={28} color="#4A5568" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{padding: 25}}>
            <Text style={styles.modalTitle}>{selectedEvent?.eventName}</Text>
            
            {selectedEvent?.eventImageBase64 && (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setLightboxVisible(true)}>
                 <Image source={{ uri: selectedEvent.eventImageBase64 }} style={styles.modalImage} />
                 <View style={styles.tapHint}>
                    <Ionicons name="expand-outline" size={14} color="#fff" />
                    <Text style={styles.tapHintText}>Tap to enlarge</Text>
                 </View>
              </TouchableOpacity>
            )}

            <Text style={styles.modalLabel}>Description</Text>
            <Text style={styles.modalText}>{selectedEvent?.eventDescription}</Text>
            <View style={styles.summaryBox}>
                <Text style={styles.sumText}>Date: {selectedEvent?.startDate}</Text>
                <Text style={styles.sumText}>Fee: {selectedEvent?.entryFees > 0 ? `₹${selectedEvent?.entryFees}` : 'FREE'}</Text>
                {selectedEvent?.modeOfEvent === "Offline" && <Text style={styles.sumText}>Venue: {selectedEvent?.eventAddress}</Text>}
            </View>

            <Text style={[styles.modalLabel, {marginTop: 30}]}>Registered Customers ({registrations.length})</Text>
            {regLoading ? <ActivityIndicator color="#FF6600" style={{marginTop: 10}} /> : 
              registrations.length > 0 ? (
                <View style={styles.regListContainer}>
                  {registrations.map((reg, idx) => (
                    <View key={idx} style={styles.regItem}>
                      <View style={styles.regAvatar}><Text style={styles.regAvatarText}>{reg.customerName?.charAt(0) || "?"}</Text></View>
                      <View style={{flex: 1}}>
                        <Text style={styles.regName}>{reg.customerName}</Text>
                        <Text style={styles.regContact}>{reg.customerPhone} • {reg.customerEmail}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : <Text style={styles.emptyRegText}>No one has registered yet.</Text>
            }

            <TouchableOpacity 
              style={styles.renewActionBtn} 
              onPress={() => { setDetailsVisible(false); handlePrepareRenew(selectedEvent); }}
            >
              <LinearGradient colors={['#FF6600', '#FF9966']} style={styles.gradientBtn}>
                <Text style={styles.submitBtnText}>Reschedule / Renew Event</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={{height: 50}} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* --- IMAGE LIGHTBOX --- */}
      <Modal visible={lightboxVisible} transparent animationType="fade" onRequestClose={() => setLightboxVisible(false)}>
         <View style={styles.lightboxContainer}>
            <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightboxVisible(false)}>
                <Ionicons name="close-circle" size={40} color="#fff" />
            </TouchableOpacity>
            <Image source={{ uri: selectedEvent?.eventImageBase64 }} style={styles.fullImage} resizeMode="contain" />
         </View>
      </Modal>

      {/* --- STATUS MODALS --- */}
      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.oldOverlay}><View style={styles.oldBox}>
            <View style={[styles.oldIcon, {backgroundColor:'#4CAF50'}]}><Ionicons name="checkmark" size={28} color="#fff" /></View>
            <Text style={styles.oldTitle}>Success</Text><Text style={styles.oldMsg}>{statusMessage}</Text>
            <TouchableOpacity onPress={() => setSuccessVisible(false)} style={styles.oldOkBtn}><Text style={styles.oldOkText}>OK</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal visible={errorVisible} transparent animationType="fade">
        <View style={styles.oldOverlay}><View style={styles.oldBox}>
            <View style={[styles.oldIcon, {backgroundColor:'#FF3B30'}]}><Ionicons name="close" size={28} color="#fff" /></View>
            <Text style={styles.oldTitle}>Error</Text><Text style={styles.oldMsg}>{statusMessage}</Text>
            <TouchableOpacity onPress={() => setErrorVisible(false)} style={styles.oldOkBtn}><Text style={styles.oldOkText}>OK</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal visible={deleteVisible} transparent animationType="fade">
        <View style={styles.oldOverlay}><View style={styles.oldBox}>
            <View style={[styles.oldIcon, {backgroundColor:'#FF6B00'}]}><Ionicons name="trash" size={28} color="#fff" /></View>
            <Text style={styles.oldTitle}>Delete Event?</Text><Text style={styles.oldMsg}>This cannot be undone.</Text>
            <View style={{flexDirection:'row'}}>
              <TouchableOpacity onPress={() => setDeleteVisible(false)} style={styles.oldActionBtn}><Text style={{color:'#666'}}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.oldActionBtn}><Text style={{color:'red'}}>Delete</Text></TouchableOpacity>
            </View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FF6600" }, 
  mainWrapper: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    height: Platform.OS === 'web' ? '100vh' : '100%',
  },
  header: {
    height: 60,
    backgroundColor: "#FF6600",
    flexDirection: 'row',
    alignItems: "center",
    paddingHorizontal: 16,
    elevation: 4,
  },backBtn: { marginRight: 15 },headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  scrollArea: {
    flex: 1,
    ...Platform.select({
      web: {
        flexBasis: 0,
        overflowY: 'auto',
      }
    })
  },
  container: { padding: 20 },
  screenMainTitle: { fontSize: 28, fontWeight: "900", color: "#1A202C", marginBottom: 20 },
  formCard: { backgroundColor: "#fff", padding: 20, borderRadius: 25, elevation: 5, marginBottom: 30 },
  label: { fontSize: 13, fontWeight: "700", color: "#718096", marginBottom: 5, marginTop: 15 },
  input: { borderBottomWidth: 1.5, borderColor: "#E2E8F0", paddingVertical: 8, fontSize: 16, color: "#2D3748" },
  conditionalInput: { marginTop: 15 },
  textArea: { height: 60, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1.5, borderColor: "#E2E8F0" },
  dateVal: { marginLeft: 10, fontSize: 16 },
  dualDateRow: { flexDirection: 'row' },
  radioGroup: { flexDirection: 'row', marginTop: 10 },
  radioItem: { flexDirection: 'row', alignItems: 'center', marginRight: 25 },
  radioLabel: { marginLeft: 8, fontSize: 16 },
  browseBtn: { marginTop: 20, padding: 15, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#FF6600', borderRadius: 15, alignItems: 'center' },
  browseText: { color: '#FF6600', fontWeight: 'bold' },
  submitBtn: { backgroundColor: "#FF6600", padding: 16, borderRadius: 15, alignItems: "center", marginTop: 25 },
  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: { marginTop: 10, alignItems: 'center', padding: 5 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, height: 50, borderRadius: 15, marginBottom: 20, elevation: 4 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#2D3748", marginBottom: 15 },
  emptyText: { textAlign: 'center', color: '#A0AEC0', marginTop: 10 },

  // Card
  beautifiedCard: { backgroundColor: "#fff", borderRadius: 24, marginBottom: 20, elevation: 8, overflow: 'hidden' },
  cardImage: { width: '100%', height: 180 },
  placeholderGradient: { width: '100%', height: 180, justifyContent: 'center', alignItems: 'center' },
  placeholderLetter: { fontSize: 80, fontWeight: '900', color: '#fff' },
  cardPadding: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { fontSize: 19, fontWeight: '800', flex: 1 },
  organizerText: { color: '#718096', marginVertical: 5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, borderTopWidth: 1, borderTopColor: '#F7FAFC', paddingTop: 10 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F0', padding: 6, borderRadius: 10 },
  dateBadgeText: { fontSize: 11, fontWeight: '700', color: '#FF6600', marginLeft: 4 },
  priceText: { fontSize: 18, fontWeight: '900' },

  // Modal Detail
  modalHeader: { padding: 20, alignItems: 'flex-end' },
  modalTitle: { fontSize: 28, fontWeight: '900', color: '#1A202C', marginBottom: 20 },
  modalImage: { width: '100%', height: 250, borderRadius: 20, marginBottom: 10 },
  tapHint: { position: 'absolute', bottom: 20, right: 15, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  tapHintText: { color: '#fff', fontSize: 10, marginLeft: 4 },
  modalLabel: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
  modalText: { fontSize: 16, color: '#4A5568', lineHeight: 24 },
  summaryBox: { marginTop: 30, backgroundColor: '#F8F9FB', padding: 20, borderRadius: 20 },
  sumText: { fontSize: 15, color: '#718096', marginBottom: 5 },

  // Registrations UI
  regListContainer: { marginTop: 15, backgroundColor: '#F7FAFC', borderRadius: 20, padding: 10, borderWidth: 1, borderColor: '#EDF2F7' },
  regItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  regAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF6600', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  regAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  regName: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
  regContact: { fontSize: 12, color: '#718096', marginTop: 2 },
  emptyRegText: { color: '#A0AEC0', fontStyle: 'italic', marginTop: 10, textAlign: 'center' },
  renewActionBtn: { marginTop: 35, borderRadius: 15, overflow: 'hidden' },
  gradientBtn: { paddingVertical: 18, alignItems: 'center' },

  // Lightbox
  lightboxContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 },
  lightboxClose: { position: 'absolute', top: 50, right: 25, zIndex: 10 },

  // Popups
  oldOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  oldBox: { backgroundColor: '#FFEFE6', borderRadius: 25, width: '85%', alignItems: 'center', paddingBottom: 25 },
  oldIcon: { width: 55, height: 55, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginTop: 25, marginBottom: 15 },
  oldTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A202C' },
  oldMsg: { fontSize: 16, color: '#4A5568', textAlign: 'center', margin: 15, lineHeight: 22 },
  oldOkBtn: { backgroundColor: '#fff', width: '80%', padding: 12, borderRadius: 25, alignItems: 'center', elevation: 2 },
  oldOkText: { color: 'red', fontWeight: 'bold', fontSize: 16 },
  oldActionBtn: { backgroundColor: '#fff', padding: 12, borderRadius: 20, margin: 10, width: 110, alignItems: 'center', elevation: 1 }
});

export default AstroEventScreen;