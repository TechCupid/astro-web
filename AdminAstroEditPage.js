import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    ActivityIndicator,
    FlatList,
    Modal,
    Image,
    Platform
} from 'react-native';
import axios from 'axios';
import { useApi } from './ApiContext';
import { LinearGradient } from 'expo-linear-gradient';
import AntDesign from '@expo/vector-icons/AntDesign';

/**
 * AdminAstroEditPage Component
 * * Purpose: Manages the list of APPROVED astrologers.
 * Features: Update basic details, Enable/Disable Counselling Eligibility.
 */
const AdminAstroEditPage = ({ navigation }) => {
    const { API_BASE_URL } = useApi();

    // --- State Management ---
    const [astrologers, setAstrologers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editAstro, setEditAstro] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showEligibilityPopup, setShowEligibilityPopup] = useState(false);
    const [selectedAstro, setSelectedAstro] = useState(null);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    // --- Global Popup State ---
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupType, setPopupType] = useState(""); // 'success' | 'error' | 'info'
    const [popupTitle, setPopupTitle] = useState("");
    const [popupMessage, setPopupMessage] = useState("");

    const showPopup = (type, title, message) => {
        setPopupType(type);
        setPopupTitle(title);
        setPopupMessage(message);
        setPopupVisible(true);
    };

    // --- Fetch Data ---
    const fetchAstrologers = async () => {
        setLoading(true);
        try {
            const url = `${API_BASE_URL}/api/astrologers/approved`;
            console.log("📡 Admin Fetching Approved List:", url);

            const res = await axios.get(url, {
                headers: {
                    'X-DEVICE-ID': 'ADMIN-PANEL-WEB',
                    'Accept': 'application/json'
                }
            });

            if (res.data) {
                setAstrologers(res.data);
            }
        } catch (err) {
            console.error('❌ Error fetching approved list:', err);
            showPopup('error', 'Error', 'Access Denied (403) or Server Offline.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAstrologers();
    }, [API_BASE_URL]);

    // --- Action Handlers ---
    const handleSave = async () => {
        if (!editAstro) return;
        setSaving(true);
        try {
            const url = `${API_BASE_URL}/api/astrologers/${editAstro.astroId}`;
            await axios.put(url, editAstro, {
                headers: { 'X-DEVICE-ID': 'ADMIN-PANEL-WEB' }
            });
            setShowSuccessPopup(true);
            setPopupMessage("Astrologer details updated successfully");
        } catch (err) {
            console.error('❌ Error saving details:', err);
            showPopup('error', 'Update Failed', 'Could not update astrologer profile.');
        } finally {
            setSaving(false);
        }
    };

    const updateCounselling = async (status) => {
        try {
            const url = `${API_BASE_URL}/api/astrologers/counselling`;
            await axios.put(url, {
                astroId: selectedAstro.astroId,
                eligibleForCounselling: status,
            }, {
                headers: { 'X-DEVICE-ID': 'ADMIN-PANEL-WEB' }
            });

            setShowEligibilityPopup(false);
            setPopupMessage(`Astrologer is now ${status ? 'enabled' : 'disabled'} for counselling`);
            setShowSuccessPopup(true);
            fetchAstrologers(); // Refresh list
        } catch (err) {
            console.error("❌ Error updating eligibility:", err);
            showPopup('error', 'Action Failed', 'Failed to update counselling status.');
        }
    };

    const handleChange = (field, value) => {
        setEditAstro((prev) => ({ ...prev, [field]: value }));
    };

    const handlePopupClose = () => {
        setShowSuccessPopup(false);
        setEditAstro(null);
        fetchAstrologers();
    };

    const handleCounsellingEligibility = (astro) => {
        setSelectedAstro(astro);
        setShowEligibilityPopup(true);
    };

    // --- UI Render: Loader ---
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#ff7900" />
                <Text style={{ marginTop: 10 }}>Loading Approved List...</Text>
            </View>
        );
    }

    // --- UI Render: Edit Form ---
    if (editAstro) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => setEditAstro(null)}>
                        <AntDesign name="arrowleft" size={24} color="#0B0B45" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Edit Profile</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={styles.input} value={editAstro.astroName} onChangeText={(val) => handleChange('astroName', val)} />

                    <Text style={styles.label}>Mobile Number</Text>
                    <TextInput style={styles.input} value={editAstro.astroMobile} keyboardType="numeric" editable={false} />

                    <Text style={styles.label}>Email Address</Text>
                    <TextInput style={styles.input} value={editAstro.astroMailId} onChangeText={(val) => handleChange('astroMailId', val)} />

                    <Text style={styles.label}>Experience (Years)</Text>
                    <TextInput style={styles.input} value={String(editAstro.astroExp)} keyboardType="numeric" onChangeText={(val) => handleChange('astroExp', val)} />

                    <Text style={styles.label}>Description</Text>
                    <TextInput 
                        style={[styles.input, { height: 120, textAlignVertical: 'top' }]} 
                        multiline 
                        value={editAstro.astroDtls} 
                        onChangeText={(val) => handleChange('astroDtls', val)} 
                    />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                    <Text style={styles.saveButtonText}>{saving ? 'Saving Changes...' : 'Save Profile'}</Text>
                </TouchableOpacity>

                {/* Local Success Modal */}
                <Modal visible={showSuccessPopup} transparent animationType="fade">
                    <View style={styles.popupOverlay}>
                        <View style={styles.modalBox}>
                            <View style={styles.contentWrapper}>
                                <View style={styles.iconWrapper}>
                                    <AntDesign name="checkcircle" size={40} color="#4BB543" />
                                </View>
                                <Text style={styles.modalTitle}>Updated!</Text>
                                <Text style={styles.modalMessage}>{popupMessage}</Text>
                            </View>
                            <View style={styles.separator} />
                            <LinearGradient colors={['#FC2A0D', '#FE9F5D']} style={styles.gradientBottom}>
                                <TouchableOpacity onPress={handlePopupClose} style={styles.okButton}>
                                    <Text style={styles.okButtonText}>OK</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        );
    }

    // --- UI Render: Main List ---
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Approved Astrologers</Text>
                <TouchableOpacity onPress={fetchAstrologers} style={{ padding: 10 }}>
                    <AntDesign name="reload1" size={20} color="#ff7900" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={astrologers}
                keyExtractor={(item, index) => item.astroId?.toString() || index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.listItem}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{item.astroName}</Text>
                            <Text style={styles.mobile}>ID: {item.astroId} | Status: {item.eligibleForCounselling ? '🟢 Ready' : '🔴 Disabled'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity style={styles.editButton} onPress={() => setEditAstro(item)}>
                                <AntDesign name="edit" size={16} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.editButton, { backgroundColor: item.eligibleForCounselling ? '#4CAF50' : '#888', marginLeft: 8 }]}
                                onPress={() => handleCounsellingEligibility(item)}
                            >
                                <AntDesign name="Safety" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No approved astrologers found.</Text>}
            />

            {/* Eligibility Popup */}
            <Modal transparent animationType="fade" visible={showEligibilityPopup}>
                <View style={styles.popupOverlay1}>
                    <View style={styles.modalBox1}>
                        <Text style={styles.popupTitle}>Manage Eligibility</Text>
                        <Text style={styles.popupMessage}>
                            Allow {selectedAstro?.astroName} to accept counselling sessions?
                        </Text>
                        <LinearGradient colors={['#FC2A0D', '#FE9F5D']} style={styles.gradientFooter}>
                            <View style={styles.buttonRow}>
                                <TouchableOpacity onPress={() => updateCounselling(true)} style={styles.footerButton}>
                                    <Text style={styles.footerButtonText}>ENABLE</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => updateCounselling(false)} style={[styles.footerButton, { marginLeft: 10 }]}>
                                    <Text style={styles.footerButtonText}>DISABLE</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => setShowEligibilityPopup(false)} style={{ marginTop: 15, alignSelf: 'center' }}>
                                <Text style={{ color: 'white', fontSize: 12 }}>CANCEL</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>
            </Modal>

            {/* Shared Success/Error Modal */}
            <Modal animationType="fade" transparent={true} visible={popupVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <View style={styles.contentWrapper}>
                            <View style={styles.iconWrapper}>
                                {popupType === "error" ? <AntDesign name="closecircle" size={30} color="#FF3B30" /> : <AntDesign name="checkcircle" size={30} color="#4BB543" />}
                            </View>
                            <Text style={styles.modalTitle}>{popupTitle}</Text>
                            <Text style={styles.modalMessage}>{popupMessage}</Text>
                        </View>
                        <View style={styles.separator} />
                        <LinearGradient colors={["#FC2A0D", "#FE9F5D"]} style={styles.gradientBottom}>
                            <TouchableOpacity onPress={() => setPopupVisible(false)} style={styles.okButton}>
                                <Text style={styles.okButtonText}>OK</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: { backgroundColor: '#fff', flex: 1, padding: 15 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#0B0B45', textAlign: 'center', flex: 1 },
    listItem: { flexDirection: 'row', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 15, marginVertical: 6, alignItems: 'center', backgroundColor: '#fafafa' },
    name: { fontWeight: 'bold', fontSize: 17, color: '#333' },
    mobile: { color: '#777', fontSize: 12, marginTop: 4 },
    editButton: { backgroundColor: '#ff7900', padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    formGroup: { paddingHorizontal: 5 },
    label: { fontWeight: 'bold', marginTop: 15, color: '#555', fontSize: 14 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginTop: 6, backgroundColor: '#fff', fontSize: 15 },
    saveButton: { backgroundColor: '#ff7900', padding: 16, borderRadius: 10, marginTop: 30, alignItems: 'center', elevation: 2 },
    saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    empty: { textAlign: 'center', marginTop: 50, color: '#999' },

    // Modals
    popupOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    popupOverlay1: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalBox: { width: '80%', backgroundColor: '#FFEFE5', borderRadius: 24, overflow: 'hidden', elevation: 15 },
    modalBox1: { width: '85%', backgroundColor: '#FFEFE9', borderRadius: 24, alignItems: 'center', paddingTop: 30, overflow: 'hidden' },
    contentWrapper: { padding: 30, alignItems: 'center' },
    iconWrapper: { backgroundColor: '#FFF', borderRadius: 30, padding: 10, marginBottom: 15, elevation: 2 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E1E1E', marginBottom: 8 },
    modalMessage: { fontSize: 15, color: '#4F4F4F', textAlign: 'center', lineHeight: 22 },
    separator: { height: 1, backgroundColor: '#E0E0E0' },
    gradientBottom: { height: 70, justifyContent: 'center', alignItems: 'center' },
    gradientFooter: { width: '100%', paddingVertical: 25, marginTop: 20 },
    buttonRow: { flexDirection: 'row', justifyContent: 'center', width: '100%' },
    okButton: { backgroundColor: '#fff', paddingHorizontal: 35, paddingVertical: 12, borderRadius: 30 },
    okButtonText: { color: 'red', fontWeight: 'bold', fontSize: 16 },
    footerButton: { backgroundColor: '#fff', borderRadius: 30, paddingVertical: 12, paddingHorizontal: 25, elevation: 3 },
    footerButtonText: { color: 'red', fontWeight: 'bold', fontSize: 14 },
    popupTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E1E1E', marginBottom: 10 },
    popupMessage: { fontSize: 15, color: '#4F4F4F', textAlign: 'center', paddingHorizontal: 20, marginBottom: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
});

export default AdminAstroEditPage;