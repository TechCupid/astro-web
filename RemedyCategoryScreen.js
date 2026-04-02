import React, { useState, useEffect } from 'react';
import {
    SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput,
    Alert, StatusBar, ActivityIndicator, Modal, FlatList,Platform
} from 'react-native';
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
    // --- HEALTH (ஆரோக்கியம்) ---
    { id: 'h1', category: 'health', text: 'Chant Maha Mrityunjaya Mantra 108 times daily for longevity.' },
    { id: 'h2', category: 'health', text: 'Donate medicines or food to a local government hospital on Saturdays.' },
    { id: 'h3', category: 'health', text: 'Offer white pumpkin (Vellai Poosanaikai) at a temple to ward off "Drishthi" (Evil Eye).' },
    { id: 'h4', category: 'health', text: 'Perform Pradosha Puja at a Shiva temple and offer milk for Abishekam.' },
    { id: 'h5', category: 'health', text: 'Apply Vibhuti (Holy Ash) or Sandalwood paste on the forehead to balance energy.' },
    { id: 'h6', category: 'health', text: 'Keep a small vessel of water near your head at night and pour it on a plant in the morning.' },

    // --- WEALTH (செல்வம்) ---
    { id: 'w1', category: 'wealth', text: 'Chant Sri Suktam or Kanakadhara Stotram every Friday evening.' },
    { id: 'w2', category: 'wealth', text: 'Light a ghee lamp in the North-East corner of your house before sunrise.' },
    { id: 'w3', category: 'wealth', text: 'Keep a clean "Kubera Yantra" in your cash locker and offer yellow flowers.' },
    { id: 'w4', category: 'wealth', text: 'Feed green grass to a cow (Go Puja) on Wednesdays to please Mercury.' },
    { id: 'w5', category: 'wealth', text: 'Keep a small piece of solid silver or a silver coin in your wallet.' },
    { id: 'w6', category: 'wealth', text: 'Avoid lending or borrowing money during the "Rahu Kaalam" period.' },

    // --- LOVE & MARRIAGE (காதல் & திருமணம்) ---
    { id: 'l1', category: 'love', text: 'Perform Swayamvara Parvathi Homam for removing marriage obstacles.' },
    { id: 'l2', category: 'love', text: 'Worship Goddess Durga on Tuesdays during Rahu Kaalam and light a lemon lamp.' },
    { id: 'l3', category: 'love', text: 'Offer a garland made of "Manjal" (Turmeric) strings to Goddess Parvathi.' },
    { id: 'l4', category: 'love', text: 'Keep a pair of Mandarin ducks or a picture of Radha-Krishna in the South-West room.' },
    { id: 'l5', category: 'love', text: 'Fast on Fridays and offer white flowers at a temple for Venus (Sukran).' },
    { id: 'l6', category: 'love', text: 'Tie a yellow thread on a Banyan/Peepal tree on a full moon day.' },

    // --- CAREER (தொழில்) ---
    { id: 'c1', category: 'career', text: 'Offer "Arugampul" (Bermuda grass) garland to Lord Ganesha on Sankatahara Chaturthi.' },
    { id: 'c2', category: 'career', text: 'Donate black sesame seeds (Ellu) at a Lord Saturn (Shani) temple on Saturdays.' },
    { id: 'c3', category: 'career', text: 'Chant Aditya Hridaya Stotram on Sundays to improve authority and promotion.' },
    { id: 'c4', category: 'career', text: 'Feed crows every morning before eating your breakfast.' },
    { id: 'c5', category: 'career', text: 'Keep a "Dakshinavarti Sankh" (Right-handed conch) in your puja room.' },
    { id: 'c6', category: 'career', text: 'Apply a Tilak of Kesar (Saffron) on your forehead before attending interviews.' },

    // --- EDUCATION (கல்வி) ---
    { id: 'e1', category: 'education', text: 'Offer honey and white flowers to Goddess Saraswati on Panchami days.' },
    { id: 'e2', category: 'education', text: 'Chant the "Hayagriva Stotram" daily to improve concentration.' },
    { id: 'e3', category: 'education', text: 'Give a notebook and pen to a poor student on a Thursday.' },
    { id: 'e4', category: 'education', text: 'Keep your study table in the East or North direction.' },
    { id: 'e5', category: 'education', text: 'Consume a leaf of "Tulsi" (Holy Basil) daily for mental clarity.' },
    { id: 'e6', category: 'education', text: 'Worship Dakshinamurthy (Lord Shiva as teacher) on Thursdays.' },

    // --- FAMILY PEACE (குடும்ப அமைதி) ---
    { id: 'f1', category: 'family', text: 'Light a lamp at the entrance of the house during evening twilight.' },
    { id: 'f2', category: 'family', text: 'Perform "Ganapathi Homam" at home once a year to remove negativity.' },
    { id: 'f3', category: 'family', text: 'Sprinkle Ganga water or salt water around the house on Amavasya (New Moon).' },
    { id: 'f4', category: 'family', text: 'Avoid keeping broken mirrors or non-working clocks inside the house.' },
    { id: 'f5', category: 'family', text: 'Put a fistful of rock salt in a bowl in the corner of your living room.' },
    { id: 'f6', category: 'family', text: 'Plant a "Vembu" (Neem) tree near your house for positive vibrations.' },

    // --- BUSINESS (வியாபாரம்) ---
    { id: 'b1', category: 'business', text: 'Worship Goddess Mahalakshmi and Lord Kubera on Deepavali or Akshaya Tritiya.' },
    { id: 'b2', category: 'business', text: 'Keep a "Mercury (Para) Ganesha" on your office desk.' },
    { id: 'b3', category: 'business', text: 'Hang a lemon and 7 green chillies at the shop entrance every Friday.' },
    { id: 'b4', category: 'business', text: 'Offer camphor Harathi at the start of every business day.' },
    { id: 'b5', category: 'business', text: 'Chant "Om Shreem Hreem Kleem Mahalakshmaye Namaha" daily.' },
    { id: 'b6', category: 'business', text: 'Keep a bowl of water with fresh yellow flowers at the office entrance.' },

    // --- LEGAL ISSUES (சட்ட சிக்கல்கள்) ---
    { id: 'le1', category: 'legal', text: 'Recite "Hanuman Chalisa" 7 times on Tuesdays and Saturdays.' },
    { id: 'le2', category: 'legal', text: 'Offer oil to Lord Shani and pray for justice.' },
    { id: 'le3', category: 'legal', text: 'Donate 1.25 kg of black gram (Ulunthu) to a temple priest.' },
    { id: 'le4', category: 'legal', text: 'Perform "Sudarshana Homam" to overcome enemies and court cases.' },
    { id: 'le5', category: 'legal', text: 'Keep a picture of Lord Krishna with Sudarshana Chakra in your home.' },
    { id: 'le6', category: 'legal', text: 'Carry a piece of "Ala Maram" (Banyan tree) root in your pocket during hearings.' },

    // --- CHILDBIRTH (குழந்தை பாக்கியம்) ---
    { id: 'cb1', category: 'childbirth', text: 'Perform "Santhana Gopala Homam" or chant Santhana Gopala Mantra.' },
    { id: 'cb2', category: 'childbirth', text: 'Worship Lord Murugan (Karthikeya) at Palani or any hill temple.' },
    { id: 'cb3', category: 'childbirth', text: 'Observe fast on "Sashti" (6th day of lunar cycle) and visit Murugan temple.' },
    { id: 'cb4', category: 'childbirth', text: 'Offer small silver cradles at a Krishna temple.' },
    { id: 'cb5', category: 'childbirth', text: 'Worship the "Peepal" and "Neem" trees entwined together.' },
    { id: 'cb6', category: 'childbirth', text: 'Offer butter (Vennai) to Lord Krishna on Rohini Nakshatra.' },

    // --- FOREIGN TRAVEL (வெளிநாட்டு பயணம்) ---
    { id: 't1', category: 'travel', text: 'Chant "Om Kalabhairavaya Namaha" to remove visa and travel hurdles.' },
    { id: 't2', category: 'travel', text: 'Offer blue flowers to Lord Saturn (Shani) on Saturdays.' },
    { id: 't3', category: 'travel', text: 'Donate a travel bag or footwear to a needy person on a Tuesday.' },
    { id: 't4', category: 'travel', text: 'Worship "Vayu Bhagavan" (Lord of Wind) to speed up travel documents.' },
    { id: 't5', category: 'travel', text: 'Keep a world map or a globe in the North-West zone of your house.' },
    { id: 't6', category: 'travel', text: 'Eat a spoonful of curd with sugar before leaving for any visa interview.' },

    // --- MENTAL PEACE (மன அமைதி) ---
    { id: 'mp1', category: 'mental_peace', text: 'Practice "Pranayama" (Breathing exercises) for 15 minutes daily.' },
    { id: 'mp2', category: 'mental_peace', text: 'Donate milk or white sweets on Mondays to please the Moon (Chandran).' },
    { id: 'mp3', category: 'mental_peace', text: 'Chant "Om Namah Shivaya" or "Gayatri Mantra" during sunrise.' },
    { id: 'mp4', category: 'mental_peace', text: 'Listen to soothing Carnatic music or Vedic chants before sleeping.' },
    { id: 'mp5', category: 'mental_peace', text: 'Walk barefoot on green grass or damp sand for 10 minutes.' },
    { id: 'mp6', category: 'mental_peace', text: 'Worship the Moon on Pournami (Full Moon) nights with white flowers.' },
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


export default function CommonRemedyScreen({ navigation, route }) {
    const { API_BASE_URL } = useApi();
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const { astroDetails, custCode } = route.params || {};
    const astroCode = astroDetails?.astroId || '';

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [commonRemedies, setCommonRemedies] = useState(PREDEFINED_COMMON_REMEDIES_DATA);
    const [commonCategory, setCommonCategory] = useState(null);
    const [filteredCommonRemedies, setFilteredCommonRemedies] = useState([]);
    const [selectedCommonRemedy, setSelectedCommonRemedy] = useState(null);
    const [newRemedyText, setNewRemedyText] = useState('');
    const [newRemedyCategory, setNewRemedyCategory] = useState(null);

    useEffect(() => { /* ... filter logic - no changes ... */
        if (commonCategory) setFilteredCommonRemedies(commonRemedies.filter(r => r.category === commonCategory));
        else setFilteredCommonRemedies([]);
        setSelectedCommonRemedy(null);
    }, [commonCategory, commonRemedies]);

  const handleSendRemedy = async () => {
    if (!selectedCommonRemedy) { 
        Alert.alert('Error', 'Please select a remedy.'); 
        return; 
    }

    setIsSubmitting(true);

    try {
        const payload = {
            astroCode: astroCode,
            custCode: custCode,
            remedyType: 'COMMON',
            remedyCat: commonCategory,
            remedyDtl: selectedCommonRemedy.text,
            remedyTime: new Date().toISOString(),
            temples: [],
        };

        // API Call
        await api.post(`${API_BASE_URL}/api/astrocust/remedies/create`, payload);
        
        // ✅ Show Success Modal immediately after API success
        setSuccessVisible(true); 

    } catch (error) {
        console.error('❌ Submit Error:', error);
        Alert.alert('Error', 'Failed to send remedy. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
};
// This function will be called when they click "Yes, Send" in the popup
const executeSend = async () => {
    setConfirmVisible(false); // Close popup
    setIsSubmitting(true);
    const now = new Date().toISOString();

    try {
        const payload = {
            astroCode: astroCode,
            custCode: custCode,
            remedyType: 'COMMON',
            remedyCat: commonCategory,
            remedyDtl: selectedCommonRemedy.text,
            remedyTime: now,
            temples: [],
        };

        await api.post(`${API_BASE_URL}/api/astrocust/remedies/create`, payload);
        Alert.alert('Success', 'Remedy sent successfully!');
        navigation.goBack();
    } catch (error) {
        Alert.alert('Error', 'Failed to send.');
    } finally {
        setIsSubmitting(false);
    }
};

    const handleSaveNewRemedy = () => { /* ... save new logic - no changes ... */
        if (!newRemedyText.trim() || !newRemedyCategory) { Alert.alert('Error', 'Category and text required.'); return; }
        const newRemedyObject = { id: `c${Date.now()}`, category: newRemedyCategory, text: newRemedyText };
        setCommonRemedies(prev => [...prev, newRemedyObject]);
        setIsModalVisible(false); setNewRemedyText(''); setNewRemedyCategory(null);
        setCommonCategory(newRemedyCategory);
        Alert.alert('Success', 'New common remedy added.');
    };

    const renderRemedyItem = ({ item }) => { /* ... JSX - no changes ... */
        const isSelected = selectedCommonRemedy?.id === item.id;
        return (
            <TouchableOpacity style={[styles.remedyItem, isSelected && styles.remedyItemSelected]} onPress={() => setSelectedCommonRemedy(item)}>
                <Ionicons name={isSelected ? "checkmark-circle" : "radio-button-off"} size={24} color={isSelected ? '#fff' : THEME_COLOR} />
                <Text style={[styles.remedyItemText, isSelected && styles.remedyItemSelectedText]}>{item.text}</Text>
            </TouchableOpacity> );
    };

   const renderCommonRemedy = () => {
        return (
            <View style={{ width: '100%' }}> 
                <View style={styles.contentView}>
                    <View style={styles.labelContainer}>
                        <Text style={styles.label}>1. Select Remedy Category</Text>
                        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                            <Ionicons name="add-circle" size={30} color={THEME_COLOR} />
                        </TouchableOpacity>
                    </View>
                    <CustomDropdown 
                        iconName="format-list-bulleted" 
                        placeholder="Select a category..." 
                        items={REMEDY_CATEGORIES} 
                        value={commonCategory} 
                        onValueChange={setCommonCategory} 
                    />
                </View>

                {commonCategory ? (
                    filteredCommonRemedies.length > 0 ? (
                        <View style={{ width: '100%' }}>
                            <Text style={[styles.label, { paddingHorizontal: 16 }]}>2. Select a Remedy</Text>
                         <FlatList
    data={filteredCommonRemedies} // ✅ CORRECT
    renderItem={renderRemedyItem} // ✅ CORRECT
    keyExtractor={(item) => item.id.toString()} // ✅ CORRECT
    scrollEnabled={Platform.OS !== 'web'} 
    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
/>
                        </View>
                    ) : (
                        <View style={[styles.noResultsContainer, { marginHorizontal: 16 }]}>
                            <Text style={styles.noResultsText}>No remedies found. Add one?</Text>
                        </View>
                    )
                ) : null}
            </View>
        );
    };
    const renderAddRemedyModal = () => ( /* ... JSX - no changes ... */
        <Modal transparent animationType="fade" visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
            <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPressOut={() => setIsModalVisible(false)}>
                <View style={styles.modalView} onStartShouldSetResponder={() => true}>
                    <Text style={styles.modalTitle}>Add New Common Remedy</Text>
                    <Text style={styles.label}>1. Select Category</Text>
                    <CustomDropdown iconName="format-list-bulleted" placeholder="Select a category..." items={REMEDY_CATEGORIES} value={newRemedyCategory} onValueChange={setNewRemedyCategory} />
                    <Text style={styles.label}>2. Enter Remedy Text</Text>
                    <TextInput style={styles.modalInput} placeholder="Type the remedy details..." placeholderTextColor="#999" multiline value={newRemedyText} onChangeText={setNewRemedyText} />
                    <View style={styles.modalButtonContainer}>
                        <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setIsModalVisible(false)}><Text style={[styles.modalButtonText, { color: THEME_COLOR }]}>Cancel</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, styles.modalButtonSave]} onPress={handleSaveNewRemedy}><Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text></TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal> );

    return (
  <SafeAreaView style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
    {renderAddRemedyModal()}
<Modal visible={successVisible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
            <View style={styles.contentWrapper}>
                <View style={[styles.iconWrapper, { backgroundColor: '#E8F5E9', padding: 15, borderRadius: 50 }]}>
                    <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
                </View>
                <Text style={styles.successTitle}>Remedy Sent!</Text>
                <Text style={styles.modalMessage}>The common remedy has been successfully sent to the customer.</Text>
            </View>

            <TouchableOpacity 
                style={styles.successOkBtn} 
                onPress={() => {
                    setSuccessVisible(false);
                    navigation.goBack(); // Navigates away after success
                }}
            >
                <Text style={styles.successOkText}>OK</Text>
            </TouchableOpacity>
        </View>
    </View>
</Modal>
    {/* ✅ STEP 1: The Main Wrapper holds everything in a 100vh box */}
    <View style={styles.mainWrapper}>
      
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Common Remedy</Text>
      </View>

      {/* ✅ STEP 3 & 4: This is the scrolling middle area */}
      <View style={styles.scrollArea}>
        {renderCommonRemedy()}
      </View>

      {/* Fixed Bottom Button */}
      <TouchableOpacity 
        style={[styles.button, (isSubmitting || !selectedCommonRemedy) && styles.buttonDisabled]} 
        onPress={handleSendRemedy} 
        activeOpacity={0.8} 
        disabled={isSubmitting || !selectedCommonRemedy}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send to Customer</Text>}
      </TouchableOpacity>
      
    </View>
  </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // Main Layout Styles
    container: { 
        flex: 1, 
        backgroundColor: THEME_COLOR 
    },
    mainWrapper: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        height: Platform.OS === 'web' ? '100vh' : '100%',
    },
    header: { 
        height: 60,
        backgroundColor: THEME_COLOR, 
        flexDirection: 'row',
        alignItems: 'center', 
        paddingHorizontal: 16,
        elevation: 4,
    },
    backBtn: { 
        padding: 8,
        marginRight: 8,
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#fff' 
    },
    scrollArea: {
        flex: 1,
        width: '100%', // Ensure it takes full width
        ...Platform.select({
            web: {
                flexBasis: 0,
                overflowY: 'auto',
                height: '0px', // ✅ This is a hack that forces Webkit to calculate scroll height correctly
            }
        })
    },

    // Content Styles
    contentView: { paddingHorizontal: 16, paddingBottom: 10, paddingTop: 10 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 8 },
    labelContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    
    // Button Styles
    button: { 
        backgroundColor: THEME_COLOR, 
        padding: 16, 
        marginHorizontal: 16, 
        marginBottom: 20, 
        marginTop: 10, 
        borderRadius: 12, 
        alignItems: 'center', 
        elevation: 2, 
        height: 56, 
        justifyContent: 'center' 
    },
    buttonDisabled: { backgroundColor: '#FFB87A' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // Dropdown & Items
    dropdownContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: THEME_COLOR, borderRadius: 10, backgroundColor: '#fff', height: 52, paddingHorizontal: 12 },
    dropdownIconLeft: { marginRight: 10 },
    dropdownInput: { fontSize: 16, color: '#333' },
    disabledInput: { backgroundColor: '#f0f0f0', borderColor: '#ccc' },
    remedyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: THEME_COLOR, borderRadius: 10, padding: 15, marginBottom: 10 },
    remedyItemSelected: { backgroundColor: THEME_COLOR },
    remedyItemText: { flex: 1, marginLeft: 12, fontSize: 15, color: '#333' },
    remedyItemSelectedText: { color: '#fff' },
    noResultsContainer: { minHeight: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#eee', padding: 15 },
    noResultsText: { fontSize: 15, color: '#777', textAlign: 'center' },

    // Modal Styles
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'stretch', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
    modalInput: { backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, textAlignVertical: 'top', minHeight: 100, color: '#333', marginBottom: 20 },
    modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    modalButton: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center', marginHorizontal: 5, minHeight: 48, justifyContent: 'center' },
    modalButtonCancel: { backgroundColor: '#fff', borderWidth: 1, borderColor: THEME_COLOR },
    modalButtonSave: { backgroundColor: THEME_COLOR },
    modalButtonText: { fontSize: 16, fontWeight: 'bold' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 10,
    },
    contentWrapper: {
        padding: 25,
        alignItems: 'center',
    },
    iconWrapper: {
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    separator: {
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    successTitle: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        color: '#333', 
        marginBottom: 10 
    },
    successOkBtn: { 
        backgroundColor: THEME_COLOR, 
        padding: 15, 
        alignItems: 'center',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20
    },
    successOkText: { 
        color: '#fff', 
        fontWeight: 'bold', 
        fontSize: 16 
    },
});