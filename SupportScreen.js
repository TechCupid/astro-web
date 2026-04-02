import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from './api/apiClient';
import { useApi } from "./ApiContext";
import { useFocusEffect } from "@react-navigation/native";

const AstrologerSupportScreen = () => {
  const [tickets, setTickets] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [confirmationTicketId, setConfirmationTicketId] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [astrologerMobile, setAstrologerMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const { API_BASE_URL } = useApi();

  // Fetch tickets for current astrologer
  const fetchTickets = async (mobile) => {
    try {
      setLoading(true);
      const res = await api.get(`${API_BASE_URL}/api/helpdesk/astrologer/tickets`, {
        params: { mobile },
      });
      setTickets(res.data || []);
    } catch (err) {
      console.log("Error fetching tickets:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to fetch your ticket history.");
    } finally {
      setLoading(false);
    }
  };

  // Load astrologer mobile from AsyncStorage
  const loadAstrologerMobile = async () => {
    const mobile = await AsyncStorage.getItem("astroMobile");
    if (mobile) {
      setAstrologerMobile(mobile);
      fetchTickets(mobile);
    }
  };

  // Fetch tickets whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      loadAstrologerMobile();
    }, [])
  );

  // Submit new ticket
  const submitTicket = async () => {
    if (!issueType.trim() || !description.trim()) {
      Alert.alert("Validation", "Please fill in all fields.");
      return;
    }

    const payload = {
      mobile: astrologerMobile,
      issue: issueType.trim(),
      description: description.trim(),
    };

    try {
      const res = await api.post(`${API_BASE_URL}/api/helpdesk/astrologer/tickets`, payload);
      setModalVisible(false);
      setIssueType("");
      setDescription("");
      fetchTickets(astrologerMobile); // refresh history
      setConfirmationTicketId(res.data.ticketId);
      setConfirmationModal(true);
    } catch (err) {
      console.log("Ticket submission failed:", err.response?.data || err.message);
      Alert.alert("Error", err.response?.data?.message || "Failed to submit ticket.");
    }
  };

  const renderTicketItem = ({ item }) => {
    const statusColor =
      item.status.toLowerCase() === "open"
        ? "green"
        : item.status.toLowerCase() === "in progress"
        ? "orange"
        : "blue";

    return (
      <View style={styles.ticketItem}>
        <Text style={styles.ticketText}>{item.ticketId}</Text>
        <Text style={styles.ticketText}>{item.issue}</Text>
        <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Astrologer Support</Text>
      </View>

      {/* Ticket history table header */}
      {tickets.length > 0 && (
        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>Ticket ID</Text>
          <Text style={styles.headerCell}>Issue</Text>
          <Text style={styles.headerCell}>Status</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#ff9900" style={{ marginTop: 50 }} />
      ) : tickets.length === 0 ? (
        <View style={styles.noTicketsContainer}>
          <Text style={styles.noTicketsText}>No tickets yet.</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.ticketId}
          renderItem={renderTicketItem}
          contentContainerStyle={{ paddingVertical: 10 }}
          refreshing={loading}
          onRefresh={() => fetchTickets(astrologerMobile)}
        />
      )}

      <TouchableOpacity
        style={styles.raiseTicketButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>Raise Ticket</Text>
      </TouchableOpacity>

      {/* Raise Ticket Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>New Support Ticket</Text>

            <TextInput
              placeholder="Issue Type / Title"
              value={issueType}
              onChangeText={setIssueType}
              style={styles.input}
            />

            <TextInput
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { height: 100 }]}
              multiline
            />

            <TouchableOpacity style={styles.submitButton} onPress={submitTicket}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: "#ccc", marginTop: 10 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.buttonText, { color: "#000" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirmation Modal */}
      <Modal visible={confirmationModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationText}>Your Ticket ID is:</Text>
            <Text style={styles.ticketIdText}>{confirmationTicketId}</Text>
            <Text style={styles.confirmationText}>
              You can track your issue status here.
            </Text>

            <TouchableOpacity
              style={[styles.submitButton, { marginTop: 20 }]}
              onPress={() => setConfirmationModal(false)}
            >
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AstrologerSupportScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: { paddingVertical: 15, alignItems: "center", backgroundColor: "#ff9900" },
  headerText: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  tableHeader: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  headerCell: { flex: 1, fontWeight: "bold", fontSize: 16, color: "#000" },
  ticketItem: { paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#eee" },
  ticketText: { flex: 1, fontSize: 15 },
  statusText: { fontSize: 14, fontWeight: "bold" },
  noTicketsContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  noTicketsText: { fontSize: 16, color: "#666" },
  raiseTicketButton: { backgroundColor: "#ff9900", padding: 15, borderRadius: 8, alignItems: "center", marginVertical: 20 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "90%", backgroundColor: "#fff", padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  input: { borderWidth: 1, borderColor: "#ff9900", borderRadius: 5, padding: 10, marginBottom: 15 },
  submitButton: { backgroundColor: "#ff9900", padding: 15, borderRadius: 8, alignItems: "center" },
  confirmationContainer: { width: "85%", backgroundColor: "#fff", padding: 25, borderRadius: 10, alignItems: "center" },
  confirmationText: { fontSize: 16, textAlign: "center", marginBottom: 10 },
  ticketIdText: { fontSize: 18, fontWeight: "bold", color: "#ff9900", textAlign: "center" },
});
