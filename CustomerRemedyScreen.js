import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator,
    TouchableOpacity, Alert, Modal, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from "@expo/vector-icons";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useApi } from './ApiContext'; // Make sure this path is correct

// I updated 'Common' to 'Common Remedy' to match our previous work
const TABS = ['Individual', 'Spiritual', 'Common'];

export default function CustomerRemedyScreen() {
    const { API_BASE_URL } = useApi();
    const [selectedTab, setSelectedTab] = useState('Individual');
    const [individualRemedies, setIndividualRemedies] = useState([]);
    const [spiritualRemedies, setSpiritualRemedies] = useState([]);
    const [commonRemedies, setCommonRemedies] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Start of Popup Code (matches AstroMainScreen) ---
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupType, setPopupType] = useState("");     // 'success' | 'error' | 'offline' | 'busy' | 'info'
    const [popupTitle, setPopupTitle] = useState("");
    const [popupMessage, setPopupMessage] = useState("");

    const showPopup = (type, title, message) => {
        setPopupType(type);
        setPopupTitle(title);
        setPopupMessage(message);
        setPopupVisible(true);
    };
    // --- End of Popup Code ---

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12; // Convert 0 hour to 12
        return `${hours}:${minutes} ${ampm}`;
    };

    // Fetches remedies specific to the customer and filters them
    const fetchMyRemedies = async () => {
        try {
            const custMobile = await AsyncStorage.getItem('mobileNumber');
            if (!custMobile) {
                showPopup("error", "Error", "Customer mobile not found.");
                setIndividualRemedies([]);
                setSpiritualRemedies([]);
                return;
            }
            const response = await axios.get(`${API_BASE_URL}/api/astrocust/remedies/by-cust/${custMobile}`);
            
            console.log("FULL API RESPONSE:", JSON.stringify(response.data, null, 2));

            const allMyRemedies = response.data || [];

            const individual = allMyRemedies.filter(
                (r) => r.remedyType !== 'SPIRITUAL'
            );
            const spiritual = allMyRemedies.filter(
                (r) => r.remedyType === 'SPIRITUAL'
            );

            setIndividualRemedies(individual);
            setSpiritualRemedies(spiritual);

        } catch (err) {
            console.error('Error fetching my remedies:', err);
            if (err.response && err.response.status !== 404) {
                 showPopup("error", "Error", "Unable to load remedies.");
            } else if (!err.response) {
                 showPopup("error", "Error", "Unable to load remedies.");
            }
            setIndividualRemedies([]);
            setSpiritualRemedies([]);
        }
    };

    // Fetches common remedies (where custCode is empty)
    const fetchCommonRemedies = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/astrocust/remedies`);
            const allRemedies = response.data || [];
            // This filter now ensures you get common remedies that still have an astroName
            const filtered = allRemedies.filter((item) => !item.custCode || item.custCode.trim() === '');
            setCommonRemedies(filtered);
        } catch (err) {
            console.error('Error fetching common remedies:', err);
            if (err.response && err.response.status !== 404) {
                showPopup("error", "Error", "Unable to load common remedies.");
            } else if (!err.response) {
                 showPopup("error", "Error", "Unable to load common remedies.");
            }
            setCommonRemedies([]);
        }
    };

    // Load data based on the selected tab
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            if (selectedTab === 'Individual' || selectedTab === 'Spiritual') {
                if (individualRemedies.length === 0 && spiritualRemedies.length === 0) {
                    await fetchMyRemedies();
                }
            } else if (selectedTab === 'Common') { // Updated from 'Common'
                if (commonRemedies.length === 0) { 
                    await fetchCommonRemedies();
                }
            }
            setLoading(false);
        };
        loadData();
    }, [selectedTab]); 

    // Renders a single remedy item card
    const renderRemedyItem = ({ item }) => {
        const openUrl = async (url) => {
            if (!url) {
                // Use the new popup
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
        const icon = isSpiritual ? 'domain' : (item.remedyType === 'COMMON' ? 'format-list-bulleted' : 'account-heart-outline');

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

                  <View style={[styles.cardRow, { marginTop: 8 }]}>
                        <MaterialCommunityIcons name="account-tie" size={16} color="#555" style={{ marginRight: 6 }} />
                        <Text style={styles.remedyLabel}>Astrologer: </Text>
                        <Text style={styles.astroNameValue}>{item.astroName}</Text>
                    </View>

                {/* --- TEMPLE SECTION --- */}
                {item.temples && item.temples.length > 0 && (
                    <View style={styles.templeSection}>
                        <Text style={styles.templeSectionTitle}>Recommended Temple(s):</Text>
                        {item.temples.map((temple, index) => {

                            console.log(`CHECKING TEMPLE DATA (Item ${index}):`, JSON.stringify(temple, null, 2));

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

    // Helper to get the correct data for the active tab
    const getDataForTab = () => {
        switch (selectedTab) {
            case 'Individual':
                return individualRemedies;
            case 'Spiritual':
                return spiritualRemedies;
            case 'Common': // Updated from 'Common'
                return commonRemedies;
            default:
                return [];
        }
    };

    // Renders the main content (loader, empty state, or list)
    const renderTabContent = () => {
        if (loading) {
            return <ActivityIndicator size="large" color="#FF6600" style={styles.loadingIndicator} />;
        }
        
        const data = getDataForTab();

        if (!data || data.length === 0) {
            return (
                <View style={styles.placeholder}>
                    <MaterialCommunityIcons name="file-document-outline" size={70} color="#ccc" />
                    <Text style={styles.placeholderText}>No {selectedTab.toLowerCase()} remedies found.</Text>
                </View>
            );
        }
        return (
            <FlatList
                data={data}
                renderItem={renderRemedyItem}
                keyExtractor={(item, index) => item._id || item.remedysl?.toString() || `remedy-${index}`}
                contentContainerStyle={styles.listContentContainer}
                ListFooterComponent={<View style={{ height: 20 }} />}
            />
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* --- TABS (Styled as requested) --- */}
            <View style={styles.tabContainer}>
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.tab, 
                            selectedTab === tab ? styles.activeTab : styles.inactiveTab
                        ]}
                        onPress={() => setSelectedTab(tab)}
                    >
                        <Text style={[
                            styles.tabText, 
                            selectedTab === tab ? styles.activeTabText : styles.inactiveTabText
                        ]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content Area */}
            <View style={styles.contentArea}>
                {renderTabContent()}
            </View>

            {/* --- ▼▼▼ NEW POPUP MODAL ▼▼▼ --- */}
            {/* This is the new popup from AstroMainScreen */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={popupVisible}
                onRequestClose={() => setPopupVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        
                        {/* ✅ Icon + Text */}
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

                        {/* ✅ Separator */}
                        <View style={styles.separator} />

                        {/* ✅ Gradient Bottom */}
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
            {/* --- ▲▲▲ NEW POPUP MODAL ▲▲▲ --- */}
        </SafeAreaView>
    );
}

// --- ▼▼▼ STYLES (MODIFIED) ▼▼▼ ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff', 
    },
    // --- TAB STYLES ---
    tabContainer: {
        flexDirection: 'row',
        borderWidth: 1.5,
        borderColor: '#FF6633',
        borderRadius: 15, // Kept your change
        overflow: 'hidden', 
        marginHorizontal: 15,
        marginVertical: 10,
        backgroundColor: '#fff', 
    },
    tab: {
        flex: 1, 
        paddingVertical: 10,
        alignItems: 'center', 
    },
    activeTab: {
        backgroundColor: '#FF6633', 
    },
    inactiveTab: {
        backgroundColor: '#fff',
    },
    tabText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    activeTabText: {
        color: '#fff',
    },
    inactiveTabText: {
        color: '#FF6633', 
    },
    
    // --- CONTENT AREA ---
    contentArea: {
        flex: 1,
        backgroundColor: '#f7f8fa', // Lighter grey background
    },
    listContentContainer: {
        paddingHorizontal: 10, 
        paddingTop: 10,
    },

    // --- CARD STYLES ---
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 2, // Softer shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, // Much lighter shadow
        shadowRadius: 4,
        overflow: 'hidden', // Ensures gradient border is clipped
    },
    cardGradientBorder: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 5, // Gradient border width
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12, // More spacing
        marginLeft: 8, // Align with gradient border
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
        alignItems: 'flex-start', // Align start for wrapping text
        marginBottom: 6, // Space between rows
        marginLeft: 8, // Align with gradient border
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

    // --- TEMPLE STYLES ---
    templeSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderColor: '#f0f0f0',
        marginLeft: 8, // Align with gradient border
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
    
    // --- DATE/TIME ROW ---
    dateTimeRow: { 
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderColor: '#f0f0f0',
        marginLeft: 8, // Align with gradient border
    },
    datetime: {
        color: '#555',
        marginLeft: 5,
        fontSize: 12,
    },

    // --- LOADER & PLACEHOLDER ---
    loadingIndicator: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: -50, // Adjust to center better
    },
    placeholderText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
    },

    // --- ▼▼▼ NEW POPUP STYLES ▼▼▼ ---
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
    // --- ▲▲▲ NEW POPUP STYLES ▲▲▲ ---
});