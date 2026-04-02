import React, { useState, useEffect,useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  TextInput, FlatList, Modal, StyleSheet, Dimensions, Alert, Image,Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from './api/apiClient';
import { useApi } from './ApiContext';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerLayout } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

 import { LinearGradient } from 'expo-linear-gradient';
  import { AntDesign } from '@expo/vector-icons';
  import { useLayoutEffect } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
const { width } = Dimensions.get('window'); // ✅ Define width 
import { useAstroStatuses } from "./AstroStatusContext";
import messaging from '@react-native-firebase/messaging';


import { startAstroChat } from "./AstroCustChatFlow";



const getAstroPricing = (astro) => {
  const hasValidOffer = astro.offerActive && astro.offerPrice;
  console.log("🔵 getAstroPricing:", astro.astroName, astro.offerActive, astro.offerPrice, astro.originalRate);

  return {
    hasValidOffer,
   finalPrice: hasValidOffer ? astro.offerPrice : astro.astroRatemin,
oldPrice: hasValidOffer ? astro.astroRatemin : null,

  };
};



const { height, width: screenWidth } = Dimensions.get('window');
const skills = ['Top astrologer', 'Vedic astrology', 'Tarot expert', 'Numerology', 'Naadi', 'Prashna kundli', 'Love astrology', 'Healing', 'Palmistry'];
const priceOptions = ['< 20', '20 - 40', '40 - 60', '60 - 80', '100+'];
const languages = ['Tamil','English', 'Telungu', 'Malayalam', 'Kannada', 'Hindi'];
const sortOptions = ['Relevance', 'Experience (High to Low)', 'Price (High to Low)', 'Price (Low to High)', 'Name (A-Z)', 'Name (Z-A)'];


const AstroAppUI = ({ navigation }) => {
  const { API_BASE_URL } = useApi();

 const { statuses, fetchStatuses } = useAstroStatuses();

  const getAstroStatus = (astroId) => {
    const match = statuses.find((s) => s.astroId === astroId);
    return match ? match.astroStatus : "offline"; // default fallback
  };
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({});
  const [sortBy, setSortBy] = useState('Relevance');
  const [searchQuery, setSearchQuery] = useState('');
  const [astrologers, setAstrologers] = useState([]);
  const [filteredAstrologers, setFilteredAstrologers] = useState([]);
 
  const [topAstrologers, setTopAstrologers] = useState([]);
const [activeTab, setActiveTab] = useState('Home');
const insets = useSafeAreaInsets();
const [showCustomAlert, setShowCustomAlert] = useState(false);
const [customAlertData, setCustomAlertData] = useState('');
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


  const drawerRef = useRef(null);
 


const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // feedback modal 
  const route = useRoute();
 
const [showThankYouModal, setShowThankYouModal] = useState(false);

useEffect(() => {
  if (route.params?.showThankYou) {
    setTimeout(() => {
      setShowThankYouModal(true);
      navigation.setParams({ showThankYou: false });
    }, 10); // show modal almost instantly
  }
}, [route.params?.showThankYou]);






 const getFirstName = () => {
    if (customerName && customerName.trim().length > 0) {
      return customerName.split(' ')[0];
    }
    return 'Guest'; // fallback
  };

  // ✅ fetchCustomerDetails function here
  const fetchCustomerDetails = async () => {
  try {
  {/*  const storedMobile = await AsyncStorage.getItem('mobileNumber');
    console.log("🔍 Logged-in Mobile:", storedMobile);

    if (!storedMobile) {
      console.log("⚠ No mobile stored, showing Guest");
      setCustomerName('');
      setMobileNumber('');
      return;
    }
*/}
const storedMobile =
  (await AsyncStorage.getItem("mobileNumber")) ||
  (await AsyncStorage.getItem("userMobile"));

if (!storedMobile) {
  showPopup("error", "Missing custCode", "⚠ No mobileNumber in AsyncStorage");
  setCustomerName('');
  setMobileNumber('');
  return;
}

// ✅ Normalize to "mobileNumber"
await AsyncStorage.setItem("mobileNumber", storedMobile);
await AsyncStorage.removeItem("userMobile");

// ✅ Debug popup instead of console.log
//showPopup("info", "Debug", `Loaded custCode/mobile: ${storedMobile}`);




    // ✅ Fetch fresh name from backend
const response = await api.get(`${API_BASE_URL}/api/customers/details/mobile`, {
      params: { custMobileNo: storedMobile }
    });

    if (response.data?.custName) {
      setCustomerName(response.data.custName);
      setMobileNumber(storedMobile);

      // ✅ Also update AsyncStorage so it persists for next app open
      await AsyncStorage.setItem('customerName', response.data.custName);
    } else {
      console.log("⚠ No customer details found, fallback Guest");
      setCustomerName('');
    }

  } catch (error) {
    console.error("❌ Error fetching fresh customer details:", error);
    // fallback to local storage if API fails
    const storedName = await AsyncStorage.getItem('customerName');
    if (storedName) setCustomerName(storedName);
    setMobileNumber(storedMobile || '');
  }
};


  useFocusEffect(
    React.useCallback(() => {
      fetchCustomerDetails();
    }, [])
  );



  useEffect(() => {
    fetchData();
    fetchHighlights();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [astrologers, selectedOptions, sortBy, searchQuery]);


  useFocusEffect(
  React.useCallback(() => {
     fetchStatuses(); // ✅ only when screen is focused
  }, [])
);






const fetchData = async () => {
  try {
    const response = await api.get(`${API_BASE_URL}/api/astro/customer-view`);
  
console.log("API Response sample:", JSON.stringify(response.data[0], null, 2));

   const updated = response.data.map((astro) => {
  console.log("Raw astro from API:", astro.astroId, "| offerPrice:", astro.offerPrice, "| offerActive:", astro.offerActive);

  if (astro.offerActive && astro.offerPrice) {
    return {
      ...astro,
      originalRate: astro.astroRatemin,   // old price
      astroRatemin: astro.offerPrice,     // discounted price
      offerPrice: astro.offerPrice,        // map offerPrice → offerRate for UI
    };
  }
  return {
    ...astro,
    originalRate: astro.astroRatemin,
  };
});

    setAstrologers(updated);
    
console.log("Astrologers after set:", updated.map(a => a.astroId));

  } catch (error) {
    console.error('Error fetching astrologers:', error);
showPopup("error", "Error", "Failed to load astrologer data.");
  } finally {
    setLoading(false);
  }
};
const resetFilters = () => {
  setSelectedOptions({
    Skills: [],
    Price: [],
    Languages: [],
  });
  setSortBy('Relevance'); // Assuming this is the default sort
  setSearchQuery('');
  // ❌ Don't call setDisplayFiltered — it's derived
};



  const fetchHighlights = async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/api/highlights/active`);
      setHighlights(response.data);
      setSelected(null); // ✅ no default selection

    } catch (error) {
      console.error('Highlight fetch error:', error);
    }
  };
  useEffect(() => {
  fetchTopAstrologers();
}, []);

const fetchTopAstrologers = async () => {
  try {
    const response = await api.get(`${API_BASE_URL}/api/astrologers/top`);

    const updated = response.data.map((astro) => {
      const hasOffer = astro.offerActive && astro.offerPrice;

      const updatedAstro = {
        ...astro,
        originalRate: astro.astroRatemin,            // keep original
        discountedRate: hasOffer ? astro.offerPrice : astro.astroRatemin, // keep new price separately
        offerPrice: astro.offerPrice,                // for UI display
      };

      console.log(
        "TopAstro ->",
        updatedAstro.astroName,
        "| Original Rate:", updatedAstro.originalRate,
        "| Discounted Rate:", updatedAstro.discountedRate,
        "| Offer Valid:", hasOffer
      );

      return updatedAstro;
    });

    setTopAstrologers(updated);
  } catch (error) {
    console.error('Error fetching top astrologers:', error);
  }
};







const applyFilters = () => {
    let result = [...astrologers];
console.log('Sample astro:', astrologers[0]?.astroRatemin, typeof astrologers[0]?.astroRatemin);

    if (selectedOptions['Skills']?.length) {
      result = result.filter((astro) =>
        selectedOptions['Skills'].some((skill) =>
          astro.astroSpec?.toLowerCase().includes(skill.toLowerCase())
        )
      );
    }

    if (selectedOptions['Languages']?.length) {
      result = result.filter((astro) =>
        selectedOptions['Languages'].some((lang) =>
          astro.astroSpeakLang?.toLowerCase().includes(lang.toLowerCase())
        )
      );
    }

    if (selectedOptions['Price']?.length) {
      result = result.filter((astro) => {
        const price = parseFloat(astro.astroRatemin) || 0;
        return selectedOptions['Price'].some((range) => {
          if (range === '< 20') return price < 20;
          if (range === '20 - 40') return price >= 20 && price <= 40;
          if (range === '40 - 60') return price > 40 && price <= 60;
          if (range === '60 - 80') return price > 60 && price <= 80;
          if (range === '100+') return price > 100;
          return false;
        });
      });
    }

    if (searchQuery) {
      result = result.filter((astro) =>
        astro.astroName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (sortBy) {
      case 'Experience (High to Low)':
        result.sort((a, b) => (b.astroExp || 0) - (a.astroExp || 0));
        break;
      case 'Price (High to Low)':
        result.sort((a, b) => (b.astroRatemin || 0) - (a.astroRatemin || 0));
        break;
      case 'Price (Low to High)':
        result.sort((a, b) => (a.astroRatemin || 0) - (b.astroRatemin || 0));
        break;
      case 'Name (A-Z)':
        result.sort((a, b) => a.astroName?.localeCompare(b.astroName));
        break;
      case 'Name (Z-A)':
        result.sort((a, b) => b.astroName?.localeCompare(a.astroName));
        break;
      default:
        break;
    }

    setFilteredAstrologers(result);
  };

  const displayFiltered = 
    selectedOptions['Skills']?.length > 0 ||
    selectedOptions['Languages']?.length > 0 ||
    selectedOptions['Price']?.length > 0 ||
    searchQuery.length > 0 ||
    sortBy !== 'Relevance';

 


const getDisplaySortLabel = (text) => text?.split('(')[0]?.trim();

const openModal = (type) => {
  setModalType(type);
  setModalVisible(true);
};

const toggleSelection = (category, item) => {
  if (category === 'Sort') {
    setSortBy(item);
    setModalVisible(false);
    return;
  }

  setSelectedOptions((prev) => {
    const newSelections = prev[category]?.includes(item)
      ? prev[category].filter((i) => i !== item)
      : [...(prev[category] || []), item];

    return {
      ...prev,
      [category]: newSelections,
    };
  });
};

const resetSelections = (category) => {
  if (category === 'Sort') {
    setSortBy('Relevance');
  } else {
    setSelectedOptions((prev) => ({
      ...prev,
      [category]: [],
    }));
  }

  setTimeout(() => {
    applyFilters();
  }, 0);

  // Optional: keep modal open or close it
  // setModalVisible(false);
};

const renderModalOptions = () => {
  let options = [];
  if (modalType === 'Skills') options = skills;
  else if (modalType === 'Price') options = priceOptions;
  else if (modalType === 'Languages') options = languages;
  else if (modalType === 'Sort') options = sortOptions;

  return (
    <Modal transparent visible={modalVisible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalType}</Text>
            {/* ✅ Reset icon inside each modal */}
            <TouchableOpacity onPress={() => resetSelections(modalType)}>
                  <Text style={styles.resetText1}>Reset</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {options.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.optionItem}
                onPress={() => toggleSelection(modalType, item)}
              >
                <Ionicons
                  name={
                    modalType === 'Sort'
                      ? sortBy === item
                        ? 'radio-button-on'
                        : 'radio-button-off'
                      : selectedOptions[modalType]?.includes(item)
                      ? 'checkbox'
                      : 'square-outline'
                  }
                  size={20}
                  color="orange"
                />
                <Text style={styles.optionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {modalType !== 'Sort' && (
            <TouchableOpacity style={styles.applyBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.applyText}>Apply Filter</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};
const renderDrawerContent = () => (
  <View style={{ flex: 1, backgroundColor: '#fff' }}>
    {/* Header */}
    <View style={{ padding: 20, backgroundColor: '#FFA726', flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 20 }}>🙏</Text>
      </View>

      <View style={{ flexDirection: 'column', flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => drawerRef.current.openDrawer()} />
          <Text style={styles.helloText}>{getFirstName()}</Text>
        </View>
        {mobileNumber ? (
          <Text style={{ fontSize: 12, color: '#555', marginLeft: 12 }}>{mobileNumber}</Text>
        ) : null}
      </View>
    </View>

    {/* Menu Items inside ScrollView */}
    <ScrollView showsVerticalScrollIndicator={true}>
      {[
  { label: 'My Profile', icon: 'person-outline' },
  { label: 'Talk to Astrologer', icon: 'call-outline' },
  { label: 'History', icon: 'time-outline' },
  { label: 'My Astrologers', icon: 'people-outline' },
  { label: 'Remedies', icon: 'medkit-outline' },
  { label: 'Counselling', icon: 'chatbubble-ellipses-outline' },
  { label: 'Offers', icon: 'pricetags-outline' },
  { label: 'Course/Sessions', icon: 'school-outline' },
  { label: 'Events', icon: 'calendar-outline' },
  { label: 'Astro Mart', icon: 'cart-outline' },
  { label: 'Blogs', icon: 'book-outline' },
  { label: 'Notification', icon: 'notifications-outline' },
 {  label: 'Contact Us' ,icon: 'mail-outline'},
  { label: 'Terms and Conditions', icon: 'document-text-outline' },  // ✅ Changed icon
  { label: 'Privacy Policy', icon: 'lock-closed-outline' },          // ✅ Changed icon
].map((item, idx) => (
  <TouchableOpacity
    key={idx}
    style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
    onPress={() => {
      const label = item.label?.trim().toLowerCase();

      if (label === 'my profile') {
        navigation.navigate('CustProfileScreen');
      } else if (label === 'talk to astrologer') {
        drawerRef.current.closeDrawer();
        navigation.navigate('Main');
      } else if (label === 'history') {
        navigation.navigate('CustomerChatHistoryScreen');
      } else if (label === 'my astrologers') {
        drawerRef.current.closeDrawer();
        navigation.navigate('MyAstrologersScreen');
      } else if (label === 'remedies') {
        navigation.navigate('CustomerRemedyScreen');
      } else if (label === 'counselling') {
        drawerRef.current.closeDrawer();
        navigation.navigate('CustomerCounsellingScreen');
      } else if (label === 'offers') {
        drawerRef.current?.closeDrawer();
        navigation.navigate('OffersScreen');
       } else if (label === "contact us") {
  drawerRef.current?.closeDrawer();
  navigation.navigate("CustContactUs"); // or "ContactUsScreen" if you want a new screen
}
 else if (label === 'terms and conditions') {
        navigation.navigate('TermsAndConditionsScreen');  // ✅ Add your screen
      } else if (label === 'privacy policy') {
        navigation.navigate('PrivacyPolicyScreen');       // ✅ Add your screen
      }
    }}
  >
    <Ionicons name={item.icon} size={20} color="#555" style={{ marginRight: 12 }} />
    <Text style={{ fontSize: 14, color: '#333' }}>{item.label}</Text>
  </TouchableOpacity>
))}

          

      {/* Version Footer */}
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#aaa' }}>Version 2.8.2</Text>
      </View>
    </ScrollView>
  </View>
);


  const handleCall = (phone) => {
 Linking.openURL(`tel:${phone}`);

  };
  




  return (
    <DrawerLayout
      ref={drawerRef}
      drawerWidth={280}
      drawerPosition="left"
      renderNavigationView={renderDrawerContent}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
         <View style={styles.container}>
            {/* ✅ Updated Header */}
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <TouchableOpacity onPress={() => drawerRef.current.openDrawer()}>
                  <Ionicons name="menu" size={24} color="#000" style={{ marginRight: 8 }} />
                </TouchableOpacity>
                <View>
                  <Text style={styles.helloText}>Hello {getFirstName()}</Text>
                  {mobileNumber ? (
                    <Text style={{ fontSize: 12, color: '#555', marginLeft: 12 }}>{mobileNumber}</Text>
                  ) : null}
                </View>
              </View>
           
            </View>
             
<ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: 80 }]}>



        {/* 👉 Top Astrologers Section */}
{topAstrologers.length > 0 && (
  <View style={{ marginTop: 20 ,}}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10, marginBottom: 10,    
 }}>
      Top Astrologers
    </Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 10 }}>
      {topAstrologers.map((astro, idx) => {
        const { hasValidOffer, finalPrice, oldPrice } = getAstroPricing(astro);
        console.log("🔵 Top Astro:", astro.astroName, astro.offerActive, astro.offerPrice, astro.originalRate);

        //const liveAstro = astrologers.find((a) => a.astroId === astro.astroId);
       const status = getAstroStatus(astro.astroId);


        return (
         <View
  key={idx}
  style={{
    width: 180,
    backgroundColor: '#fff3e0',
    marginRight: 12,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    elevation: 2,
    overflow: 'hidden', // ✅ this clips the OFFER ribbon
  }}
>

            <View style={{ position: 'relative' }}>
              {/* ✅ OFFER Badge */}
              {hasValidOffer && (
               <View
      style={{
      position: 'absolute',
      top: 5,
      left: -65,
      backgroundColor: '#FFD700',
      transform: [{ rotate: '-45deg' }],
      width: 105,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
      elevation: 2,
    }}
  >
    <Text
      style={{
        color: 'red',
        fontSize: 10,
        fontWeight: 'bold',
      }}
    >
      OFFER
  </Text>
</View>

              )}

              <Image
                source={{ uri: `data:image/jpeg;base64,${astro.astroPhoto}` }}
                style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 6 , overflow: 'hidden', // ✅ this clips the OFFER ribbon
}}
              />
            </View>
            <Text style={{ fontWeight: 'bold', fontSize: 14, textAlign: 'center' }}>
              {astro.astroName || 'Astrologer'}
            </Text>
            <Text style={{ fontSize: 12, color: '#444', marginTop: 4 }}>Exp: {astro.astroExp || 0} yrs</Text>
            <Text style={{ fontSize: 12, color: '#444' }} numberOfLines={1}>
              Spec: {astro.astroSpec || 'N/A'}
            </Text>
            <Text style={{ fontSize: 12, color: '#444' }} numberOfLines={1}>
              Lang: {astro.astroSpeakLang || 'N/A'}
            </Text>

            {/* ✅ Call and Chat Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              
              {/* ✅ Call Button with Offer Price */}
            {/* Call Button */}
<TouchableOpacity
  style={[styles.callBtn, { paddingVertical: 2, justifyContent:'flex-end',paddingHorizontal: 4, width: 80 }]}
  onPress={() => handleCall(astro.astroMobile)}
>
  {hasValidOffer ? (
    <View style={{ alignItems: 'center' }}>
      <Text style={[styles.callText, { color: '#fff', fontSize: 12 }]}>Call per min</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
        <Text style={[styles.oldPrice, { color: 'gold', textDecorationLine: 'line-through', textDecorationStyle: 'solid',
      fontWeight: 'bold', marginRight: 8 }]}>
          ₹{Math.round(oldPrice)}
        </Text>
        <Text style={[styles.newPrice, { color: '#fff', fontWeight: 'bold' }]}>
          ₹{Math.round(finalPrice)}
        </Text>
      </View>
    </View>
  ) : (
    <Text style={[styles.callText, { color: '#fff', fontSize: 12 }]}>
      Call per min{'\n'}₹{Math.round(finalPrice)}
    </Text>
  )}
</TouchableOpacity>

{/* Chat Button */}
<TouchableOpacity
  style={[
    styles.chatBtn,
    {
      backgroundColor: status === 'online' ? 'green' : status === 'busy' ? 'orange' : 'red',
      paddingVertical: 2,
      paddingHorizontal: 4,
      width: 80,
    },
  ]}
onPress={() => {
  if (status === 'online') {
    startAstroChat(astro, navigation, API_BASE_URL);
  } else if (status === 'busy') {
    setCustomAlertData({
      icon: 'time-outline',
      title: 'Wait in Queue',
      iconColor: '#FFA500',
      message: 'Astrologer is currently busy. Please wait.',
    });
    setShowCustomAlert(true);
  } else {
    setCustomAlertData({
      icon: 'close-circle-outline',
      title: 'Offline',
      iconColor: '#FF3B30',
      message: 'Astrologer is currently offline.',
    });
    setShowCustomAlert(true);
  }
}}

>
  {hasValidOffer && status === 'online' ? (
    <View style={{ alignItems: 'center' }}>
      <Text style={[styles.chatText, { color: '#fff', fontSize: 12 }]}>Chat per min</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
        <Text style={[styles.oldPrice, { color: 'gold', textDecorationLine: 'line-through', fontWeight: 'bold', marginRight: 8 }]}>
          ₹{Math.round(oldPrice)}
        </Text>
        <Text style={[styles.newPrice, { color: '#fff', fontWeight: 'bold' }]}>
          ₹{Math.round(finalPrice)}
        </Text>
      </View>
    </View>
  ) : (
    <Text style={[styles.chatText, { color: '#fff', fontSize: 11 }]}>
      {status === 'online' && `Chat per min\n₹${Math.round(finalPrice)}`}
      {status === 'busy' && `Busy, Please Wait`}
      {status === 'offline' && `Astrologer is Offline`}
    </Text>
  )}
</TouchableOpacity>

            </View>
          </View>
        );
      })}

    </ScrollView>
  </View>
)}





<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.filterRow}
>
  {['Skills', 'Price', 'Languages'].map((filter) => {
    const selectedLabel = selectedOptions[filter]?.length
      ? selectedOptions[filter].join(', ')
      : filter;

    return (
      <TouchableOpacity key={filter} onPress={() => openModal(filter)} style={styles.filterBtn}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text>{selectedLabel} </Text>
          <Ionicons name="chevron-down" size={14} />
        </View>
      </TouchableOpacity>
    );
  })}

  {/* Reset Button */}
  <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
    <Text style={styles.resetText}>Reset</Text>
  </TouchableOpacity>
</ScrollView>


<View style={styles.countRow}>
  <Text style={styles.astroCount}>
    Showing {displayFiltered ? filteredAstrologers.length : astrologers.length} Astrologers
  </Text>

  <TouchableOpacity onPress={() => openModal('Sort')}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={styles.sortBy}>Sort by: </Text>
      <Text style={[styles.sortBy, styles.sortValue]}>{getDisplaySortLabel(sortBy)}</Text>
      <Ionicons name="chevron-down" size={14} style={{ marginLeft: 4 }} />
    </View>
  </TouchableOpacity> 
</View>

<View style={styles.searchBar}>
  <Ionicons name="search" size={18} color="#aaa" />
  <TextInput
    style={styles.searchInput}
    placeholder="Search Astro"
    placeholderTextColor="#999"
    value={searchQuery}
    onChangeText={setSearchQuery}
  />
</View>

<View style={styles.astroListWrapper}>
  {console.log(
    "Rendering astrologers:",
    (displayFiltered ? filteredAstrologers : astrologers).map(a => a.astroId)
  )}
  {(displayFiltered ? filteredAstrologers : astrologers).map((item, index) => {
    const { hasValidOffer, finalPrice, oldPrice } = getAstroPricing(item);
console.log("🟠 Main Astro:", item.astroName, "| offerActive:", item.offerActive, "| offerPrice:", item.offerPrice, "| originalRate:", item.originalRate, "| finalPrice:", finalPrice, "| oldPrice:", oldPrice);

    const photoUri = `data:image/jpeg;base64,${item.astroPhoto}`;

    // 🟡 Define status safely from top-level or nested object
    //const status = item.astroStatus || item.astrologierInfo?.astroStatus || 'offline';
const status = getAstroStatus(item.astroId);

    return (
<View
  key={index.toString()}
  style={[styles.astroCard, { position: 'relative' }]} // 
>
        <View style={styles.astroLeft}>

          
          <View style={[styles.astroImageWrapper, { marginTop: 35}]}>
  <Image source={{ uri: photoUri }} style={styles.astroImage} />
</View>

        </View>

        <View style={styles.astroRight}>
          <View style={styles.cardTitleRow}>
           <TouchableOpacity
 onPress={() => {
  navigation.navigate('AstroProfile', { astroBasic: item });
}}
  
>
  <Text style={styles.cardTitle}>
    {item.astroName || 'Astrologer'}
  </Text>
</TouchableOpacity>


            <View style={styles.ratingPill}>
              <Text style={styles.ratingText}>
                <Text style={{ color: '#FF6100' }}>★</Text> {item.astroRating || '4.5'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardSubText}>Exp: {item.astroExp || 0} yrs</Text>

          {item.astroSpec && (
            <Text style={styles.cardSubText} numberOfLines={1} ellipsizeMode="tail">
              Specialization: {item.astroSpec}
            </Text>
          )}
          {item.astroSpeakLang && (
            <Text style={styles.cardSubText} numberOfLines={1} ellipsizeMode="tail">
              Language: {item.astroSpeakLang}
            </Text>
          )}

          {/* ✅ CALL & CHAT Buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            
            {/* Call Button */}
           <View style={{ position: 'relative' }}>
 <View style={{ position: 'relative' }}>
              {/* ✅ OFFER Badge */}
              {hasValidOffer && (

               <View
 style={{
    position: 'absolute',
    top: -100,
    left: -145,
    backgroundColor: '#FFD700', // orange → gold
    transform: [{ rotate: '-45deg' }],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 1,
    elevation: 2,
    zIndex: 2,
     width: 100,
     height: 20,
     justifyContent: 'center',
     alignItems: 'center',
          // ✅ optional: sets a minimum width

  }}
>
  <Text
    style={{
      color: 'red',
      fontSize: 8,
      fontWeight: 'bold',
     
    }}
  >
    OFFER
  </Text>
</View>






  )}



</View>

  


  <TouchableOpacity
  style={styles.callBtn}
  onPress={() => handleCall(item.astroMobile)}
>
  {item.offerPrice ? (
    <View style={{ alignItems: 'center' }}>
      <Text style={[styles.callText, { color: '#fff' }]}>
        Call per min
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
        <Text style={[styles.oldPrice, { color: 'gold', textDecorationLine: 'line-through',fontWeight: 'bold', marginRight: 12 }]}>
            ₹{Math.round(item.originalRate || item.astroRatemin)}
        </Text>
        <Text style={[styles.newPrice, { color: '#fff', fontWeight: 'bold' }]}>
        ₹{Math.round(item.offerPrice)}
        </Text>
      </View>
    </View>
  ) : (
    <Text style={[styles.callText, { color: '#fff' }]}>
     Call per min{'\n'}₹{Math.round(item.astroRatemin || 10)}
    </Text>
  )}
</TouchableOpacity>


</View>


         
       {/* ✅ Chat Button with dynamic status and offer display */}
<TouchableOpacity
    style={[
    styles.chatBtn,
    {
      backgroundColor:
       getAstroStatus(item.astroId) === 'online'

          ? 'green'
          : getAstroStatus(item.astroId) === 'busy'
          ? 'orange'
          : 'red',
    },
  ]}
onPress={() => {
  const status = getAstroStatus(item.astroId);
  if (status === 'online') {
    startAstroChat(item, navigation, API_BASE_URL);
  } else if (status === 'busy') {
    setCustomAlertData({
      icon: 'time-outline',
      title: 'Wait in Queue',
      iconColor: '#FFA500',
      message: 'Astrologer is currently busy. Please wait.',
    });
    setShowCustomAlert(true);
  } else {
    setCustomAlertData({
      icon: 'close-circle-outline',
      title: 'Offline',
      iconColor: '#FF3B30',
      message: 'Astrologer is currently offline.',
    });
    setShowCustomAlert(true);
  }
}}


>
  {item.offerPrice &&  getAstroStatus(item.astroId) ===  'online' ? (
    <View style={{ alignItems: 'center' }}>
      <Text style={[styles.chatText, { color: '#fff' }]}>
        Chat per min
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
        <Text style={[styles.oldPrice, { color: 'gold', textDecorationLine: 'line-through',  fontWeight: 'bold',marginRight: 12 }]}>
          ₹{Math.round(item.originalRate || item.astroRatemin)}
        </Text>
        <Text style={[styles.newPrice, { color: '#fff', fontWeight: 'bold' }]}>
          ₹{Math.round(item.offerPrice)}

        </Text>
      </View>
    </View>
  ) : (
    <Text style={[styles.chatText, { color: '#fff' }]}>
    { getAstroStatus(item.astroId) ===  'online' && `Chat per min\n₹${item.astroRatemin || 10}`}
      { getAstroStatus(item.astroId) ===  'busy' && `Busy, Please Wait`}
      { getAstroStatus(item.astroId) ===  'offline' && `Astrologer is Offline`}
    </Text>
  )}
</TouchableOpacity>



          </View>
        </View>
      </View>
    );
  })}
 


</View>


 </ScrollView>
      {renderModalOptions()}
      <View style={[styles.footer, { paddingBottom: insets.bottom || 10 }]}>
  <TouchableOpacity style={styles.footerItem} onPress={() => setActiveTab('Home')}>
    <Ionicons name="home-outline" size={14} color={activeTab === 'Home' ? '#FF6100' : '#555'} />
    <Text style={[styles.footerLabel, activeTab === 'Home' && styles.footerActive]}>Home</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.footerItem} onPress={() => setActiveTab('TIS Astro')}>
    <Ionicons name="planet-outline" size={14} color={activeTab === 'TIS Astro' ? '#FF6100' : '#555'} />
    <Text style={[styles.footerLabel, activeTab === 'TIS Astro' && styles.footerActive]}>TIS Astro</Text>
  </TouchableOpacity>

  <TouchableOpacity
  style={styles.footerItem}
  onPress={() => {
    setActiveTab('Remedies');
    navigation.navigate('CommonRemedyScreen', {
      viewOnly: true, // ✅ Add flag to disable form
    });
  }}
>
  <Ionicons
    name="medkit-outline"
    size={14}
    color={activeTab === 'Remedies' ? '#FF6100' : '#555'}
  />
  <Text style={[styles.footerLabel, activeTab === 'Remedies' && styles.footerActive]}>
    Remedies
  </Text>
</TouchableOpacity>


  <TouchableOpacity style={styles.footerItem} onPress={() => setActiveTab('Learn Astro')}>
    <Ionicons name="book-outline" size={14} color={activeTab === 'Learn Astro' ? '#FF6100' : '#555'} />
    <Text style={[styles.footerLabel, activeTab === 'Learn Astro' && styles.footerActive]}>Learn</Text>
  </TouchableOpacity>
</View>

{/* feedback modal */}

 <Modal visible={showThankYouModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <View style={styles.contentWrapper}>
        <View style={styles.iconWrapper}>
          <AntDesign name="smileo" size={30} color="#4CAF50" />
        </View>
        <Text style={styles.modalTitle}>Thank You!</Text>
        <Text style={styles.modalMessage}>Your feedback has been submitted successfully.</Text>
      </View>

      <View style={styles.separator} />
      <LinearGradient
        colors={['#FC2A0D', '#FE9F5D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBottom}
      >
        <TouchableOpacity
          onPress={() => setShowThankYouModal(false)}
          style={styles.okButton}
        >
          <Text style={styles.okButtonText}>OK</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>

<Modal visible={showCustomAlert} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <View style={styles.contentWrapper}>
        <View style={styles.iconWrapper}>
          <Ionicons
            name={customAlertData.icon}
            size={30}
            color={customAlertData.iconColor || '#4BB543'}
          />
        </View>
        <Text style={styles.modalTitle}>{customAlertData.title}</Text>
        <Text style={styles.modalMessage}>{customAlertData.message}</Text>
      </View>

      <View style={styles.separator} />
      <LinearGradient
        colors={['#FC2A0D', '#FE9F5D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBottom}
      >
        <TouchableOpacity
          onPress={() => setShowCustomAlert(false)}
          style={styles.okButton}
        >
          <Text style={styles.okButtonText}>OK</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>
              {/* 🔹 Shared Popup Modal */}
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
                  {popupType === "success" && <AntDesign name="checkcircle" size={30} color="#4BB543" />}
                  {popupType === "error" && <AntDesign name="closecircle" size={30} color="#FF3B30" />}
                  {popupType === "offline" && <AntDesign name="closecircle" size={30} color="#FF3B30" />}
                  {popupType === "busy" && <AntDesign name="clockcircle" size={30} color="#FF9500" />}
                  {popupType === "info" && <AntDesign name="infocircle" size={24} color="blue" />
}
                  
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
        

    </View>
    </KeyboardAvoidingView>




  </SafeAreaView>
  </DrawerLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#fff3e0' },
  helloText: { fontSize: 16,marginLeft: 12  },
  loginText: { fontSize: 16, fontWeight: 'bold' },
  storyRow: { padding: 10 },
  storyCircle: { borderRadius: 50, backgroundColor: '#ffe0b2', padding: 12, marginRight: 10 },
  storyText: { fontSize: 12 },
  banner: { backgroundColor: '#ffe6e6', padding: 12, alignItems: 'center' },
  bannerText: { color: '#b71c1c', fontWeight: 'bold' },
  filterRow: {
  flexDirection: 'row',
  justifyContent: 'flex-start', // Align to the left
  paddingHorizontal: 10,
  marginTop: 10,
},
cardTitleRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

ratingPill: {
  borderWidth: 1,
  borderColor: '#FF6100',
  borderRadius: 20,
  paddingHorizontal: 8,
  paddingVertical: 2,
},

ratingText: {
  color: '#FF6100',
  fontSize: 12,
  fontWeight: 'bold',
},

filterBtn: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 10,         // Less curve than before
  paddingVertical: 6,
  paddingHorizontal: 10,
  marginRight: 4,           // Minimal space between buttons
  backgroundColor: '#fff',
},

countRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center' },
  astroCount: { fontSize: 14, fontWeight: 'bold' },
  sortBy: { fontSize: 14 },
  sortValue: { color: 'orange' },
  searchBar: {
  flexDirection: 'row',
  alignItems: 'center',
  marginHorizontal: 12,
  marginVertical: 8,
  paddingHorizontal: 12,
  backgroundColor: '#f0f0f0', // light grey background
  borderRadius: 25, // for oval shape
  height: 42, // reduced height
},
searchInput: {
  marginLeft: 10,
  flex: 1,
  fontSize: 14,
  color: '#333',
},

  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: height * 0.8 },
  resetText: { color: 'orange' },
  optionItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  optionText: { marginLeft: 10 },
  applyBtn: { backgroundColor: 'orange', padding: 12, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  applyText: { color: '#fff', fontWeight: 'bold' },
  astroCard: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    marginHorizontal: 10,
    marginVertical: 6,
    padding: 10,
    borderRadius: 10,
    elevation: 2,
    overflow: 'hidden',

  },
  astroLeft: { marginRight: 10 },
  astroImageWrapper: {
  width: 100,               // Increased size
  height: 100,
  borderRadius: 10,        // Slight rounding instead of full circle
  backgroundColor: '#eee',
},
astroImage: {
  width: 100,
  height: 100,
  justifyContent: 'flex-end', // 👈 push image to the bottom

},

  astroRight: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  cardSubText: { fontSize: 14, color: '#555', marginBottom: 2 },
 chatBtn: {
  backgroundColor: 'green',
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 6,
  width: 100,
  marginLeft: 10, // Adds gap between call and chat
},

callBtn: {
  backgroundColor: 'red',
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 6,
  width: 100,
},

chatText: {
  color: '#fff',
  textAlign: 'center',
  fontSize: 13,
  lineHeight: 16,
},

callText: {
  color: '#fff',
  textAlign: 'center',
  fontSize: 13,
  lineHeight: 16,
},



 
footer: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  backgroundColor: '#fff3e0',
  paddingTop: 10,
  borderTopWidth: 1,
  borderColor: '#ccc',
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
},
footerItem: {
  alignItems: 'center',
},
footerLabel: {
  fontSize: 11,
  color: '#555',
  marginTop: 2,
},
footerActive: {
  color: '#FF6100',
  fontWeight: 'bold',
},

offerBadge: {
  position: 'absolute',
  top: -8,
  right: -8,
  backgroundColor: 'green',
  borderRadius: 5,
  paddingHorizontal: 6,
  paddingVertical: 2,
  zIndex: 2,
},
offerBadgeText: {
  color: '#fff',
  fontSize: 5,
  fontWeight: 'bold',
},
oldPrice: {
  textDecorationLine: 'line-through',
  color: '#fff',
  fontSize: 12,
  textAlign: 'center',
},
newPrice: {
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
  textAlign: 'center',
},

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
  borderRadius: 20,        // makes the wrapper round (small)
  padding: 5,              // reduce padding to shrink gap
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 10,        // optional spacing below icon
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
  
resetBtn: {
  backgroundColor: '#ff9900',
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 20,
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 10,
},

resetText: {
  color: '#fff',
  fontWeight: 'bold',
},
resetText1:{
    color: 'orange',
  fontWeight: 'bold',

},
modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},

modalTitle: {
  fontSize: 16,
  fontWeight: 'bold',
},

});

export default AstroAppUI;