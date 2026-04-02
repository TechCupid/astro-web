import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import { useApi } from "./ApiContext";

const statusColors = {
  OPEN: "green",
  IN_PROGRESS: "orange",
  APPROVED: "blue",
  REJECTED: "red",
  CLOSED: "gray",
};

export default function AdminSupportScreen() {
  const { API_BASE_URL } = useApi();
  const [activeTab, setActiveTab] = useState("ASTRO");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch tickets
  const fetchTickets = async (tab) => {
    setLoading(true);
    try {
      const url =
        tab === "ASTRO"
          ? `${API_BASE_URL}/api/helpdesk/astro-tickets`
          : `${API_BASE_URL}/api/helpdesk/customer-tickets`;
      const res = await axios.get(url);
      setTickets(res.data || []);
    } catch (err) {
      console.log("Error fetching tickets:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(activeTab);
  }, [activeTab]);

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setModalVisible(true);
  };

  const updateStatus = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      await axios.put(
        `${API_BASE_URL}/api/helpdesk/${
          activeTab === "ASTRO" ? "astrologer" : "customer"
        }/tickets/${selectedTicket.ticketId}/status`,
        { ticketId: selectedTicket.ticketId, status: newStatus }
      );
      Alert.alert("Success", `Ticket status updated to ${newStatus}`);
      setModalVisible(false);
      fetchTickets(activeTab);
    } catch (err) {
      console.log("Error updating status:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to update ticket status");
    }
  };

// Inside FlatList render
const renderTicketItem = ({ item }) => (
  <TouchableOpacity style={styles.dataRow} onPress={() => openTicketModal(item)}>
    <View style={styles.dataCell}>
      <Text>{item.ticketId}</Text>
    </View>
    <View style={styles.dataCell}>
      <Text>{item.issue}</Text>
    </View>
    <View style={styles.dataCell}>
      <Text style={{ color: statusColors[item.status] }}>{item.status}</Text>
    </View>
  </TouchableOpacity>
);
  return (
    <SafeAreaView style={styles.container}>
      {/* Tab switch */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "ASTRO" && styles.activeTab]}
          onPress={() => setActiveTab("ASTRO")}
        >
          <Text style={styles.tabText}>Astrologer Tickets</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "CUSTOMER" && styles.activeTab]}
          onPress={() => setActiveTab("CUSTOMER")}
        >
          <Text style={styles.tabText}>Customer Tickets</Text>
        </TouchableOpacity>
      </View>

      {/* Table header */}
      <View style={styles.headerRow}>
        <View style={styles.headerCell}>
          <Text style={styles.headerText}>Ticket ID</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.headerText}>Issue</Text>
        </View>
        <View style={styles.headerCell}>
          <Text style={styles.headerText}>Status</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ff9900" style={{ marginTop: 50 }} />
      ) : tickets.length === 0 ? (
        <View style={styles.noTickets}>
          <Text>No tickets found.</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.ticketId}
          renderItem={renderTicketItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedTicket && (
              <>
                <Text style={styles.modalTitle}>Ticket Details</Text>
                <View style={styles.modalContent}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>ID:</Text>
                    <Text style={styles.modalValue}>{selectedTicket.ticketId}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Issue:</Text>
                    <Text style={styles.modalValue}>{selectedTicket.issue}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Description:</Text>
                    <Text style={styles.modalValue}>{selectedTicket.description}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Status:</Text>
                    <Text
                      style={[
                        styles.modalValue,
                        { color: statusColors[selectedTicket.status] },
                      ]}
                    >
                      {selectedTicket.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusButtons}>
                  {["OPEN", "IN_PROGRESS", "APPROVED", "CLOSED"].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusButton,
                        { backgroundColor: statusColors[status] },
                      ]}
                      onPress={() => updateStatus(status)}
                    >
                      <Text style={styles.buttonText}>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  tabContainer: { flexDirection: "row", marginTop: 10 },
  tab: { flex: 1, padding: 12, backgroundColor: "#ccc", alignItems: "center" },
  activeTab: { backgroundColor: "#ff9900" },
  tabText: { color: "#fff", fontWeight: "bold" },

headerRow: {
  flexDirection: "row",
  borderBottomWidth: 2,
  borderBottomColor: "#ccc",
  backgroundColor: "#f0f0f0",
  paddingVertical: 10,
},
headerCell: { flex: 1, alignItems: "center", borderRightWidth: 1, borderRightColor: "#ccc" },
headerText: { fontWeight: "bold" },

dataRow: {
  flexDirection: "row",
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
},
dataCell: { flex: 1, alignItems: "center", borderRightWidth: 1, borderRightColor: "#eee" },

  noTickets: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalContent: { marginBottom: 15 },
  modalRow: { flexDirection: "row", marginVertical: 5 },
  modalLabel: { fontWeight: "bold", width: 90 },
  modalValue: { flex: 1 },

  statusButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 15,
    justifyContent: "space-between",
  },
  statusButton: {
    padding: 10,
    borderRadius: 6,
    marginVertical: 5,
    width: "48%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#ff9900",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
