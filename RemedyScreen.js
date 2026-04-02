import React, { useState, useEffect, useMemo } from 'react';
import {
    SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
    StatusBar, ActivityIndicator, FlatList,
    Modal, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from "@expo/vector-icons"; // Kept one AntDesign
import RNPickerSelect from 'react-native-picker-select';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { useApi } from './ApiContext';
import api from './api/apiClient';

const THEME_COLOR = '#FF7300';

const REMEDY_CATEGORIES = [
    { label: 'Health (ஆரோக்கியம்)', value: 'health' }, { label: 'Wealth (செல்வம்)', value: 'wealth' },
    { label: 'Love & Marriage (காதல் & திருமணம்)', value: 'love' }, { label: 'Career (தொழில்)', value: 'career' },
    { label: 'Education (கல்வி)', value: 'education' }, { label: 'Family Peace (குடும்ப அமைதி)', value: 'family' },
    { label: 'Business (வியாபாரம்)', value: 'business' }, { label: 'Legal Issues (சட்ட சிக்கல்கள்)', value: 'legal' },
    { label: 'Childbirth (குழந்தை பாக்கியம்)', value: 'childbirth' }, { label: 'Foreign Travel (வெளிநாட்டு பயணம்)', value: 'travel' },
    { label: 'Mental Peace (மன அமைதி)', value: 'mental_peace' },
];

const PREDEFINED_COMMON_REMEDIES_DATA = [
    { id: 'c1', category: 'health', text: 'Chant Maha Mrityunjaya Mantra 108 times daily.' },
    { id: 'c2', category: 'health', text: 'Donate medicines to the poor on Saturday.' },
    // ... other predefined remedies
];

const CustomDropdown = ({ iconName, placeholder, items, value, onValueChange, disabled = false }) => {
    // ... (rest of CustomDropdown component - no changes needed)
    const placeholderObject = { label: placeholder, value: null };
    return (
        <View style={[styles.dropdownContainer, disabled && styles.disabledInput]}>
            <MaterialCommunityIcons name={iconName} size={22} color={THEME_COLOR} style={styles.dropdownIconLeft} />
            <View style={{ flex: 1 }}>
                <RNPickerSelect
                    placeholder={placeholderObject} items={items} onValueChange={onValueChange} value={value}
                    style={{ placeholder: { color: '#9EA0A4', fontSize: 16 }, inputIOS: styles.dropdownInput, inputAndroid: styles.dropdownInput }}
                    useNativeAndroidPickerStyle={false} Icon={() => null} disabled={disabled}
                />
            </View>
            <Ionicons name="chevron-down" size={22} color={THEME_COLOR} />
        </View>
    );
};

export default function RemedyScreen({ navigation, route }) {
    const { API_BASE_URL } = useApi();
    const { astroDetails, custCode } = route.params || {};
    const astroCode = astroDetails?.astroId || '';

    const [templeData, setTempleData] = useState([]);
    const [isLoadingTemples, setIsLoadingTemples] = useState(true);
    const [templeError, setTempleError] = useState(null);
    const [activeTab, setActiveTab] = useState('individual');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [individualCategory, setIndividualCategory] = useState(null);
    const [individualRemedyText, setIndividualRemedyText] = useState('');
    const [spiritualSearchQuery, setSpiritualSearchQuery] = useState('');
    const [spiritualSuggestions, setSpiritualSuggestions] = useState([]);
    const [spiritualSelectedLocation, setSpiritualSelectedLocation] = useState(null);
    const [spiritualTempleResults, setSpiritualTempleResults] = useState([]);
    const [spiritualSelectedTemples, setSpiritualSelectedTemples] = useState([]);
    const [spiritualSelectedTempleObjects, setSpiritualSelectedTempleObjects] = useState([]);

    // --- Start of Popup Code ---
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

    useEffect(() => { /* ... fetchTemples logic - no changes ... */
        const fetchTemples = async () => {
            try { setIsLoadingTemples(true); setTempleError(null);
                const response = await api.get(`${API_BASE_URL}/api/temples`); // Assuming this endpoint exists
                if (response.data && Array.isArray(response.data)) {
                    setTempleData(response.data.map(t => ({...t, remedies: Array.isArray(t.remedies) ? t.remedies : []})));
                } else { throw new Error('Invalid temple data format'); }
            } catch (error) { console.error('Failed to load temples:', error);
            } finally { setIsLoadingTemples(false); }
        };
        fetchTemples();
    }, [API_BASE_URL]);

    useEffect(() => { /* ... reset logic - no changes ... */
        setIndividualCategory(null); setIndividualRemedyText('');
        setSpiritualSearchQuery(''); setSpiritualSuggestions([]); setSpiritualSelectedLocation(null);
        setSpiritualTempleResults([]); setSpiritualSelectedTemples([]); setSpiritualSelectedTempleObjects([]);
    }, [activeTab]);

    const uniqueSpiritualLocations = useMemo(() => { /* ... logic for locations - no changes ... */
        const states = new Set(); const districts = new Set();
        templeData.forEach(t => { if (t.state) states.add(t.state); if (t.district) districts.add(t.district); });
        const stateSuggestions = [...states].map(s => ({ type: 'state', name: s }));
        const districtSuggestions = [...districts].map(d => ({ type: 'district', name: d }));
        return { states: stateSuggestions, districts: districtSuggestions };
    }, [templeData]);

    useEffect(() => { /* ... spiritual search suggestions logic - no changes ... */
        const query = spiritualSearchQuery.toLowerCase().trim();
        if (query.length < 3 || spiritualSelectedLocation) { setSpiritualSuggestions([]); return; }
        const matchingStates = uniqueSpiritualLocations.states.filter(s => s.name.toLowerCase().includes(query));
        const matchingDistricts = uniqueSpiritualLocations.districts.filter(d => d.name.toLowerCase().includes(query));
        setSpiritualSuggestions([...matchingDistricts, ...matchingStates]);
    }, [spiritualSearchQuery, uniqueSpiritualLocations, spiritualSelectedLocation]);

    useEffect(() => { /* ... spiritual temple results logic - no changes ... */
        if (!spiritualSelectedLocation) { setSpiritualTempleResults([]); return; }
        const { type, name } = spiritualSelectedLocation;
        const results = templeData.filter(t => (type === 'state' ? t.state === name : t.district === name));
        setSpiritualTempleResults(results);
    }, [spiritualSelectedLocation, templeData]);

    const handleSendRemedy = async () => {
        setIsSubmitting(true);
        let payload;
        const now = new Date().toISOString(); // <-- GET CURRENT TIME

        try {
            if (activeTab === 'individual') {
                if (!individualCategory || !individualRemedyText.trim()) {
                    showPopup('error', 'Missing Info', 'Category and details are required.'); // CHANGED
                    setIsSubmitting(false); // Stop submission
                    return; // Exit function
                }
                payload = {
                    astroId: astroCode, // Use the astroCode obtained earlier
                    astroName: astroDetails?.astroName,
                    custCode: custCode,
                    remedyType: 'INDIVIDUAL',
                    remedyCat: individualCategory,
                    remedyDtl: individualRemedyText.trim(),
                    remedyTime: now, // <-- SEND REMEDY TIME
                    temples: [], // Send empty array as required by the new model
                };
            } else if (activeTab === 'spiritual') {
                if (spiritualSelectedTemples.length === 0) {
                    showPopup('error', 'Missing Info', 'Please select at least one temple.'); // CHANGED
                    setIsSubmitting(false); // Stop submission
                    return; // Exit function
                }
                const templeNames = spiritualSelectedTempleObjects.map(t => t.name);
                payload = {
                    astroId: astroCode, // Use the astroCode obtained earlier
                    astroName: astroDetails?.astroName,
                    custCode: custCode,
                    remedyType: 'SPIRITUAL',
                    remedyCat: 'Spiritual Search',
                    remedyDtl: `Suggest visiting: ${templeNames.join(', ')}`,
                    remedyTime: now, // <-- SEND REMEDY TIME
                    temples: templeNames,
                };
            } else {
                 showPopup("error", "Error", "Invalid remedy type selected."); // CHANGED
                 setIsSubmitting(false);
                 return;
            }

            console.log('➡️ Sending Payload:', JSON.stringify(payload));
            const response = await api.post(
                `${API_BASE_URL}/api/astrocust/remedies/create`, // <-- CORRECTED URL
                payload
            );

            console.log('✅ API Response Status:', response.status);
            showPopup('success', 'Success', 'Remedy sent successfully!'); // CHANGED
            
            // Go back after popup
            setTimeout(() => {
                setPopupVisible(false);
                navigation.goBack();
            }, 1500);

        } catch (error) {
            console.error('❌ Submit Error:', error);
            if (error.response) {
                console.error('❌ Submit Error Response:', error.response.data);
                showPopup('error', 'Error', error.response.data?.message || `Server Error ${error.response.status}`); // CHANGED
            } else {
                showPopup('error', 'Error', error.message || 'An unknown error occurred.'); // CHANGED
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSpiritualTempleSelection = (templeId) => { /* ... logic - no changes ... */
        setSpiritualSelectedTemples(prevIds => {
            const isSelected = prevIds.includes(templeId);
            if (isSelected) {
                setSpiritualSelectedTempleObjects(prevObjs => prevObjs.filter(obj => obj.id !== templeId));
                return prevIds.filter(id => id !== templeId);
            } else {
                const templeToAdd = templeData.find(t => t.id === templeId);
                if (templeToAdd) setSpiritualSelectedTempleObjects(prevObjs => [...prevObjs, templeToAdd]);
                return [...prevIds, templeId];
            }
        });
    };
    const handleSelectLocation = (location) => { /* ... logic - no changes ... */
        setSpiritualSelectedLocation(location); setSpiritualSearchQuery(location.name); setSpiritualSuggestions([]);
    };
    const clearSpiritualSearch = () => { /* ... logic - no changes ... */
        setSpiritualSearchQuery(''); setSpiritualSelectedLocation(null); setSpiritualSuggestions([]); setSpiritualTempleResults([]);
    };

    const renderIndividualRemedy = () => ( /* ... JSX - no changes ... */
        <ScrollView style={styles.contentViewScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>1. Select Remedy Category</Text>
            <CustomDropdown iconName="format-list-bulleted" placeholder="Select a category..." items={REMEDY_CATEGORIES} value={individualCategory} onValueChange={setIndividualCategory} />
            <Text style={styles.label}>2. Enter Custom Remedy</Text>
            <TextInput style={styles.textInput} placeholder="Type the remedy details here..." placeholderTextColor="#999" multiline value={individualRemedyText} onChangeText={setIndividualRemedyText} />
        </ScrollView>
    );

    const renderSpiritualRemedy = () => { /* ... JSX - no changes (uses 'domain' icon) ... */
        const filteredTempleResults = spiritualTempleResults.filter(t => !spiritualSelectedTemples.includes(t.id));
        return (
            <View style={{ flex: 1 }}>
                <View style={styles.contentView}>
                    <Text style={styles.label}>1. Search for Location (State or District)</Text>
                    <View style={styles.searchInputContainer}>
                        <Ionicons name="search" size={22} color={THEME_COLOR} style={styles.dropdownIconLeft} />
                        <TextInput style={styles.searchInput} placeholder="Type 3 or more characters..." placeholderTextColor="#999" value={spiritualSearchQuery} onChangeText={setSpiritualSearchQuery} autoCapitalize="none" autoCorrect={false} editable={!spiritualSelectedLocation} />
                        <TouchableOpacity onPress={clearSpiritualSearch} style={styles.clearButton}><Ionicons name="close-circle" size={20} color="#999" /></TouchableOpacity>
                    </View>
                </View>
                {spiritualSuggestions.length > 0 && !spiritualSelectedLocation && (
                    <FlatList data={spiritualSuggestions} keyExtractor={(item, index) => `${item.type}-${item.name}-${index}`} renderItem={({ item }) => (
                        <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectLocation(item)}>
                            <Ionicons name={item.type === 'state' ? 'map-outline' : 'map-marker-outline'} size={20} color={THEME_COLOR} />
                            <Text style={styles.suggestionText}>{item.name}</Text><Text style={styles.suggestionType}> ({item.type})</Text>
                        </TouchableOpacity> )} style={styles.suggestionList} />
                )}
                {spiritualSelectedLocation && (
                    <View style={{ flex: 1 }}>
                        {spiritualSelectedTempleObjects.length > 0 && (
                            <View style={[styles.contentView, styles.selectedSection]}>
                                <Text style={styles.label}>Selected Temples ({spiritualSelectedTempleObjects.length})</Text>
                                <FlatList data={spiritualSelectedTempleObjects} renderItem={({ item }) => (
                                    <View style={styles.selectedItem}>
                                        <MaterialCommunityIcons name="domain" size={18} color={THEME_COLOR} style={{ marginRight: 8 }} />
                                        <Text style={styles.selectedItemText} numberOfLines={1}>{item.name} <Text style={styles.selectedItemLocation}>({item.district})</Text></Text>
                                        <TouchableOpacity onPress={() => toggleSpiritualTempleSelection(item.id)} style={styles.removeItemButton}><Ionicons name="close-circle" size={22} color="#D8000C" /></TouchableOpacity>
                                    </View> )} keyExtractor={item => item.id.toString()} style={{ maxHeight: 150 }} />
                            </View> )}
                        <View style={[styles.contentView, { flex: 1 }]}>
                            <Text style={styles.label}>Temples in {spiritualSelectedLocation.name}</Text>
                            {filteredTempleResults.length > 0 ? (
                                <FlatList data={filteredTempleResults} renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.card} onPress={() => toggleSpiritualTempleSelection(item.id)} activeOpacity={0.7}>
                                        <MaterialCommunityIcons name="domain" size={30} color={THEME_COLOR} />
                                        <Text style={styles.cardText} numberOfLines={2}>{item.name}</Text><Text style={styles.cardSubText}>{item.district}, {item.state}</Text>
                                        <View style={styles.addIconContainer}><Ionicons name="add-circle-outline" size={24} color={THEME_COLOR} /></View>
                                    </TouchableOpacity> )} keyExtractor={item => item.id.toString()} numColumns={3} contentContainerStyle={styles.cardListContainer} />
                            ) : ( <View style={styles.noResultsContainer}><Text style={styles.noResultsText}>No temples found.</Text></View> )}
                        </View>
                    </View> )}
                {spiritualSearchQuery.length < 3 && !spiritualSelectedLocation && ( <View style={[styles.noResultsContainer, { margin: 16 }]}><Text style={styles.noResultsText}>Type 3+ characters to search.</Text></View> )}
                {spiritualSearchQuery.length >= 3 && spiritualSuggestions.length === 0 && !spiritualSelectedLocation && ( <View style={[styles.noResultsContainer, { margin: 16 }]}><Text style={styles.noResultsText}>No locations found.</Text></View> )}
            </View>
        );
    };

   return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
            
            {/* ✅ Main Wrapper: Constrains height to 100vh on Web */}
            <View style={styles.mainWrapper}>
                
                {/* ✅ Standard Header: Stays fixed at the top */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Remedy Suggestion</Text>
                </View>

                {isLoadingTemples ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={THEME_COLOR} />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                ) : templeError ? (
                    <View style={styles.loadingContainer}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#D8000C" />
                        <Text style={[styles.errorText, { fontWeight: 'bold' }]}>Failed to load Remedy data</Text>
                        <Text style={styles.errorText}>{templeError}</Text>
                    </View>
                ) : (
                    <>
                        {/* Tab Switcher: Stays fixed below header */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity 
                                style={[styles.tab, activeTab === 'individual' && styles.activeTab]} 
                                onPress={() => setActiveTab('individual')}
                            >
                                <Text style={[styles.tabText, activeTab === 'individual' && styles.activeTabText]}>Individual</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.tab, activeTab === 'spiritual' && styles.activeTab]} 
                                onPress={() => setActiveTab('spiritual')}
                            >
                                <Text style={[styles.tabText, activeTab === 'spiritual' && styles.activeTabText]}>Spiritual</Text>
                            </TouchableOpacity>
                        </View>

                        {/* ✅ Scroll Area: Only this part will scroll on Web */}
                        <View style={styles.scrollArea}>
                            {activeTab === 'individual' && renderIndividualRemedy()}
                            {activeTab === 'spiritual' && renderSpiritualRemedy()}
                        </View>

                        {/* ✅ Fixed Bottom Button */}
                        <TouchableOpacity 
                            style={[
                                styles.button, 
                                (isSubmitting || (activeTab === 'spiritual' && spiritualSelectedTemples.length === 0) || (activeTab === 'individual' && (!individualCategory || !individualRemedyText.trim()))) && styles.buttonDisabled 
                            ]} 
                            onPress={handleSendRemedy} 
                            activeOpacity={0.8} 
                            disabled={isSubmitting || (activeTab === 'spiritual' && spiritualSelectedTemples.length === 0) || (activeTab === 'individual' && (!individualCategory || !individualRemedyText.trim()))}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Send to Customer</Text>
                            )}
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* --- NEW POPUP MODAL (Outside mainWrapper so it overlays everything) --- */}
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

                            <Text style={styles.popupModalTitle}>{popupTitle}</Text>
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


// --- Styles ---
const styles = StyleSheet.create({
    /* ... All your existing styles ... */
    mainWrapper: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        /* ✅ Tells the browser: The screen ends at the window bottom */
        height: Platform.OS === 'web' ? '100vh' : '100%',
    },header: { 
        height: 60,
        backgroundColor: THEME_COLOR, 
        flexDirection: 'row',
        alignItems: 'center', 
        paddingHorizontal: 16,
        elevation: 4,
    },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    scrollArea: {
        flex: 1,
        width: '100%',
        ...Platform.select({
            web: {
                /* ✅ Magic Trio for Web Scroll */
                flexBasis: 0,
                overflowY: 'auto',
                height: '0px', 
            }
        })
    },
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
    errorText: { marginTop: 5, fontSize: 16, color: '#D8000C', textAlign: 'center', paddingHorizontal: 20 },
    tabContainer: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: THEME_COLOR, overflow: 'hidden', backgroundColor: '#fff' },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    activeTab: { backgroundColor: THEME_COLOR },
    tabText: { fontWeight: '600', color: THEME_COLOR, fontSize: 15 },
    activeTabText: { color: '#fff' },
    contentViewScroll: { paddingHorizontal: 16, flex: 1, paddingBottom: 20 },
    contentView: { paddingHorizontal: 16, paddingBottom: 10 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 8 },
    textInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, textAlignVertical: 'top', minHeight: 120, color: '#333' },
    searchInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: THEME_COLOR, borderRadius: 10, backgroundColor: '#fff', height: 52, paddingHorizontal: 12 },
    searchInput: { flex: 1, fontSize: 16, color: '#333', paddingLeft: 0, height: '100%' },
    clearButton: { paddingLeft: 10 },
    infoText: { fontSize: 14, color: '#666', marginTop: 5, marginLeft: 5 },
    button: { backgroundColor: THEME_COLOR, padding: 16, marginHorizontal: 16, marginBottom: 20, marginTop: 10, borderRadius: 12, alignItems: 'center', elevation: 2, height: 56, justifyContent: 'center' },
    buttonDisabled: { backgroundColor: '#FFB87A' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // Spiritual Tab Results & Selection
    cardListContainer: { paddingBottom: 10 },
    card: {
        width: '31%',
        aspectRatio: 1,
        margin: '1%',
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: THEME_COLOR,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
        position: 'relative',
    },
    cardText: { marginTop: 5, color: THEME_COLOR, fontWeight: '600', textAlign: 'center', fontSize: 12 },
    cardSubText: { color: '#777', textAlign: 'center', fontSize: 9 },
    addIconContainer: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 12 },
    selectedSection: {
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#eee',
        marginTop: 10,
        backgroundColor: '#f9f9f9',
        paddingTop: 5,
    },
    selectedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
        borderRadius: 5,
        marginBottom: 5,
    },
    selectedItemText: { flex: 1, marginLeft: 8, fontSize: 14, color: '#333' },
    selectedItemLocation: { fontSize: 12, color: '#666' },
    removeItemButton: { paddingLeft: 10 },
    noResultsContainer: { minHeight: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#eee', padding: 15 },
    noResultsText: { fontSize: 15, color: '#777', textAlign: 'center' },

    // Suggestion List Styles
    suggestionList: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        maxHeight: 250, 
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        position: 'absolute', 
        top: 150, // Adjust this value to sit perfectly below your search bar
        left: 0,
        right: 0,
        zIndex: 10, 
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    suggestionText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    suggestionType: {
        fontSize: 14,
        color: '#888',
        marginLeft: 4,
    },

    // Dropdown Styles
    dropdownContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: THEME_COLOR, borderRadius: 10, backgroundColor: '#fff', height: 52, paddingHorizontal: 12 },
    dropdownIconLeft: { marginRight: 10 },
    dropdownInput: { fontSize: 16, color: '#333' },
    disabledInput: { backgroundColor: '#f0f0f0', borderColor: '#ccc' },

    /* --- Your Existing Modal Styles --- */
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }, 
    modalView: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'stretch', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 }, 
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' }, 
    modalInput: { backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, textAlignVertical: 'top', minHeight: 100, color: '#333', marginBottom: 20 }, 
    modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }, 
    modalButton: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center', marginHorizontal: 5, minHeight: 48, justifyContent: 'center' }, 
    modalButtonCancel: { backgroundColor: '#fff', borderWidth: 1, borderColor: THEME_COLOR }, 
    modalButtonSave: { backgroundColor: THEME_COLOR }, 
    modalButtonText: { fontSize: 16, fontWeight: 'bold' },

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
    // Renamed to avoid style conflict with your other modal
    popupModalTitle: { 
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