import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, Linking, Modal, FlatList
} from 'react-native';
import api from './api/apiClient';
import { useApi } from './ApiContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import { startAstroChat } from "./AstroCustChatFlow";

export default function AstroProfile({ route, navigation }) {
  const { API_BASE_URL } = useApi();
  const insets = useSafeAreaInsets();
  const { astroBasic } = route.params;


  const [astroFull, setAstroFull] = useState(null);
  const [allReviews, setAllReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [hasOffer, setHasOffer] = useState(false);
  const [astrologers, setAstrologers] = useState([]); // ✅ Added state to fix error

  const [ratingSummary, setRatingSummary] = useState({
    averageRating: 0, totalRatings: 0, totalReviews: 0, starCounts: {}
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [tempDateFilter, setTempDateFilter] = useState('all');
  const [starFilter, setStarFilter] = useState(null);
  const [sortOption, setSortOption] = useState('latest');

  const [filterVisible, setFilterVisible] = useState(false);
  const [starFilterVisible, setStarFilterVisible] = useState(false);
 
  const [thankYouModalVisible, setThankYouModalVisible] = useState(false);
  const [statusPopupVisible, setStatusPopupVisible] = useState(false);



  const [popupMessage, setPopupMessage] = useState('');
  const [popupTitle, setPopupTitle] = useState('');
  const [popupIcon, setPopupIcon] = useState({ name: '', color: '' });

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

   const handleCall = (phone) => {
     Linking.openURL(`tel:${phone}`);
  
    };

  const isWithinDateRange = (dateString, filter) => {
    if (filter === 'all') return true;
    const now = new Date();
    const reviewDate = new Date(dateString);
    let startDate;
    switch (filter) {
      case '1week': startDate = new Date(); startDate.setDate(now.getDate() - 7); break;
      case '1month': startDate = new Date(); startDate.setMonth(now.getMonth() - 1); break;
      case '3months': startDate = new Date(); startDate.setMonth(now.getMonth() - 3); break;
      case '6months': startDate = new Date(); startDate.setMonth(now.getMonth() - 6); break;
      case '1year': startDate = new Date(); startDate.setFullYear(now.getFullYear() - 1); break;
      default: return true;
    }
    return reviewDate >= startDate;
  };

  // ✅ All API calls in one useEffect
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`${API_BASE_URL}/api/astro/astrologers/${astroBasic.astroId}`);
        setAstroFull(res.data);
      } catch (err) {
        console.error('❌ Failed to load astro profile:', err);
      }
    };

    const fetchFeedback = async () => {
      try {
        const response = await api.get(`${API_BASE_URL}/astro/api/feedbacks/astro/${astroBasic.astroId}/summary`);
        const data = response.data;
        if (!data || !data.reviews) return;
        setAllReviews(data.reviews);
        setRatingSummary({
          averageRating: data.averageRating || 0,
          totalRatings: data.totalRatings || 0,
          totalReviews: data.totalReviews || 0,
          starCounts: {
            1: data.starCounts?.['1'] || 0,
            2: data.starCounts?.['2'] || 0,
            3: data.starCounts?.['3'] || 0,
            4: data.starCounts?.['4'] || 0,
            5: data.starCounts?.['5'] || 0
          }
        });
      } catch (err) {
        console.error('❌ Failed to fetch feedback summary:', err);
      }
    };

    const fetchData = async () => {
      try {
        const response = await api.get(`${API_BASE_URL}/api/astro/customer-view`);
        console.log("API Response sample:", JSON.stringify(response.data?.[0], null, 2));

        const updated = (response.data || []).map((astro) => {
          console.log(
            "Raw astro from API:",
            astro?.astroId,
            "| offerPrice:",
            astro?.offerPrice,
            "| offerActive:",
            astro?.offerActive
          );

          if (astro?.offerActive && astro?.offerPrice) {
            return {
              ...astro,
              originalRate: astro.astroRatemin,
              astroRatemin: astro.offerPrice,
              offerPrice: astro.offerPrice,
            };
          }
          return {
            ...astro,
            originalRate: astro?.astroRatemin,
          };
        });

        setAstrologers(updated);
        console.log("Astrologers after set:", updated.map(a => a.astroId));
      } catch (error) {
        console.error('Error fetching astrologers:', error);
        Alert.alert('Error', 'Failed to load astrologer data.');
      }
    };

    const fetchOfferAstrologers = async () => {
      try {
        const res = await api.get(`${API_BASE_URL}/api/offer/active/details`);
        const offerList = res.data || [];
        const found = offerList.find(a => a.astroId === astroBasic.astroId);
        if (found) {
          setHasOffer(true);
        }
      } catch (error) {
        console.error('❌ Failed to fetch offer astrologers:', error);
      }
    };

    Promise.all([fetchDetails(), fetchFeedback(), fetchData(), fetchOfferAstrologers()])
      .finally(() => setLoading(false));

  }, [API_BASE_URL, astroBasic.astroId]);

  // ✅ Review filtering
  useEffect(() => {
    let data = [...allReviews];
    data = data.filter(item => isWithinDateRange(item.feedbackTime, dateFilter));
    if (starFilter) data = data.filter(item => item.givenStar === starFilter);
    data.sort((a, b) => sortOption === 'latest'
      ? new Date(b.feedbackTime) - new Date(a.feedbackTime)
      : new Date(a.feedbackTime) - new Date(b.feedbackTime)
    );
    setFilteredReviews(data);
  }, [dateFilter, starFilter, sortOption, allReviews]);

  const applyDateFilter = () => {
    setDateFilter(tempDateFilter);
    setFilterVisible(false);
  };



  const astro = { ...astroBasic, ...astroFull };
  const photoSource =
    astroBasic.astroPhoto && astroBasic.astroPhoto.length > 50
      ? { uri: `data:image/jpeg;base64,${astroBasic.astroPhoto}` }
      : require('./assets/Astroicon.jpg');

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Section */}
      <View style={styles.topRow}>
        <Image source={photoSource} style={styles.image} />
        <View style={styles.infoRight}>
          <Text style={styles.name}>{astro.astroName}</Text>
          <Text style={styles.starRating}>
            ⭐ {ratingSummary.averageRating > 0 ? ratingSummary.averageRating.toFixed(1) : 'No rating'}
          </Text>
          <Text style={styles.special}>{astro.astroSpec}</Text>
        </View>
      </View>

      {/* Info Section */}
     <View style={styles.infoRowBoxCombined}>
  <View style={styles.infoItem}>
    <Text style={[styles.label, { color: 'gray' }]}>Languages</Text>
    <Text style={styles.value}>{astro.astroSpeakLang || 'N/A'}</Text>
  </View>

  <View style={styles.verticalDivider} />

  <View style={styles.infoItem}>
     <Text style={[styles.label, { color: 'gray' }]}>Experience</Text>
    <Text style={styles.value}>{astro.astroExp || 0} Years</Text>
  </View>

  <View style={styles.verticalDivider} />

  <View style={styles.infoItem}>
 <Text style={[styles.label, { color: 'gray' }]}>Price</Text>
  {astro?.offerActive && astro?.offerPrice ? (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text
        style={{
          color: 'black',
          textDecorationLine: 'line-through',
          
          marginRight: 8,
        }}
      >
        ₹{Math.round(astro?.originalRate || astro?.astroRatemin)}
      </Text>
      <Text style={{ color: '#000', fontWeight: 'bold' }}>
        ₹{Math.round(astro?.offerPrice)}
      </Text>
      <Text style={{ marginLeft: 4 }}>/min</Text>
    </View>
  ) : (
    <Text style={styles.value}>
      ₹{Math.round(astro?.astroRatemin || 0)}/min
    </Text>
  )}
</View>
</View>



      {/* About Section */}
      <View style={{ marginTop: 16, marginBottom: 20 }}>
  <Text style={styles.sectionTitle}>About</Text>
  <Text style={styles.aboutText}>{astro.astroDtls?.trim() || 'No details available.'}</Text>
</View>


      {/* Reviews */}
     
<View style={{ marginTop: 10 }}>
  <View style={styles.ratingSummaryBox}>
    <Text style={styles.ratingTitle}>Customer ratings & reviews</Text>

  <View style={styles.ratingRow}>
  {[1, 2, 3, 4, 5].map((i) => {
    const rating = ratingSummary.averageRating;
    const fill = Math.max(0, Math.min(1, rating - (i - 1))); // 0 to 1

    return (
      <View
        key={i}
        style={{
          width: 20,
          height: 20,
          marginHorizontal: 2,
          position: 'relative',
        }}
      >
        {/* Base star outline */}
        <Ionicons name="star-outline" size={20} color="#FFA500" />

        {/* Filled star clipped according to fill */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 20 * fill, // e.g. 20 * 0.5 = 10px filled
            height: 20,
            overflow: 'hidden',
          }}
        >
          <Ionicons name="star" size={20} color="#FFA500" />
        </View>
      </View>
    );
  })}

  <Text style={styles.avgRatingText}>
    {ratingSummary.averageRating.toFixed(1)} out of 5
  </Text>
</View>




    <Text style={styles.subText}>
      {ratingSummary.totalRatings} ratings | {ratingSummary.totalReviews} reviews
    </Text>

    {[5, 4, 3, 2, 1].map(star => {
      const count = ratingSummary.starCounts[star] || 0;
      const percent = ((count / ratingSummary.totalRatings) * 100).toFixed(0);
      return (
        <View key={star} style={styles.starRow}>
          <Text style={styles.starLabel}>{star} stars</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
          <Text style={styles.starPercent}>{percent}% ({count})</Text>
        </View>
      );
    })}
  </View>



      {/* Filter Row 1 - Sort & Filter */}
<View style={styles.filterRow}>
  {/* Sort & Filter */}
  <TouchableOpacity 
    onPress={() => setFilterVisible(true)} 
    style={styles.filterButton}
  >
    <Text style={styles.filterText}>Sort & Filter</Text>
    <AntDesign name="down" size={14} color="#000" style={styles.dropdownIcon} />
  </TouchableOpacity>

  {/* Star Rating */}
  <TouchableOpacity 
    onPress={() => setStarFilterVisible(true)} 
    style={styles.filterButton}
  >
    <Text style={styles.filterText}>Star Rating</Text>
    <AntDesign name="down" size={14} color="#000" style={styles.dropdownIcon} />
  </TouchableOpacity>

  {/* Reset */}
  <TouchableOpacity
    onPress={() => {
      setDateFilter('all');
      setTempDateFilter('all');
      setStarFilter(null);
      setSortOption('latest');
    }}
    style={styles.resetButton}
  >
    <Text style={styles.resetText}>Reset</Text>
  </TouchableOpacity>
</View>



   {/* Sort & Filter Modal */}
<Modal visible={filterVisible} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.bottomSheet}>
      {/* Header */}
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>Sort & Filter</Text>
       
      </View>

      {/* Filter Options */}
      {[
  { label: 'All', value: 'all' },
  { label: 'Last Week', value: '1week' },
  { label: 'Last Month', value: '1month' },
  { label: 'Last 3 Months', value: '3months' },
  { label: 'Last 6 Months', value: '6months' },
  { label: 'Last 1 Year', value: '1year' },
].map(option => {
  const selected = tempDateFilter === option.value;
  return (
    <TouchableOpacity
      key={option.value}
      style={styles.optionRow}
      onPress={() => setTempDateFilter(option.value)}
    >
      <Ionicons
        name={selected ? 'checkbox' : 'square-outline'}
        size={22}
        color={selected ? '#f4b400' : '#aaa'}
      />
      <Text style={styles.optionText}>{option.label}</Text>
    </TouchableOpacity>
  );
})}


      {/* Apply Button */}
  <TouchableOpacity
  style={styles.applyButton}
  onPress={applyDateFilter} // ✅ Call the function here
>
  <Text style={styles.applyButtonText}>Apply Filter</Text>
</TouchableOpacity>


    </View>
  </View>
</Modal>




{/* Star Filter Modal */}
<Modal visible={starFilterVisible} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.bottomSheet}>
      {/* Header */}
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>Star Rating</Text>
        
      </View>

      {/* Star Options */}
      {[1, 2, 3, 4, 5].map(star => {
        const selected = starFilter === star;
        return (
          <TouchableOpacity
            key={star}
            style={styles.optionRow}
            onPress={() => setStarFilter(star)}
          >
            <Ionicons
              name={selected ? 'checkbox' : 'square-outline'}
              size={22}
              color={selected ? '#f4b400' : '#aaa'}
            />
            <Text style={styles.optionText}>
              {'★'.repeat(star)} ({star})
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Reset */}
      <TouchableOpacity
        style={styles.optionRow}
        onPress={() => setStarFilter(null)}
      >
        <Ionicons
          name={!starFilter ? 'checkbox' : 'square-outline'}
          size={22}
          color={!starFilter ? '#f4b400' : '#aaa'}
        />
        <Text style={styles.optionText}>All Stars</Text>
      </TouchableOpacity>

      {/* Apply Button */}
      <TouchableOpacity
        style={styles.applyButton}
        onPress={() => setStarFilterVisible(false)}
      >
        <Text style={styles.applyText}>Apply Filter</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

    
           {/* Reviews */}
     <Text style={styles.sectionTitle}>
  Showing  {ratingSummary.totalRatings} ratings & {ratingSummary.totalReviews} Reviews
</Text>

<FlatList
  data={filteredReviews}
  keyExtractor={(item, index) => index.toString()}
  renderItem={({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewerName}>
          {item.customer?.custName || item.custName || 'User'}
        </Text>
        <Text style={styles.reviewDate}>
          {item.feedbackTime ? formatDate(item.feedbackTime) : ''}
        </Text>
      </View>

      <Text style={styles.reviewText}>
        {item.remarks || 'No comments'}
      </Text>

      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {[...Array(item.givenStar)].map((_, i) => (
          <Text key={i} style={styles.starRating}>⭐</Text>
        ))}
      </View>
    </View>
  )}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 30 }}
/>


    
             
     
  
    
           {/* Buttons */}
      <View style={styles.buttonRow}>
    
    {/* Call Button */}
    <TouchableOpacity
       style={[styles.actionButton, { backgroundColor: '#FF0000' }]}
      onPress={() => handleCall(astro?.astroMobile)} // ✅ FIX: changed from item to astro
    >
      {astro?.offerActive && astro?.offerPrice ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.buttonTitle}>Call per min</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={[styles.oldPrice, { color: 'gold', textDecorationLine: 'line-through', fontWeight: 'bold', marginRight: 12 }]}>
              ₹{Math.round(astro?.originalRate || astro?.astroRatemin)}
            </Text>
            <Text style={[styles.newPrice, { color: '#fff', fontWeight: 'bold' }]}>
              ₹{Math.round(astro?.offerPrice)}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={[styles.buttonTitle, { textAlign: 'center' }]}>
        Call per min{'\n'}₹{Math.round(astro?.astroRatemin || 10)}
      </Text>
      )}
    </TouchableOpacity>

    
   
    
    {/* Chat Button */}
    <TouchableOpacity
      style={[
        styles.actionButton,
        {
          backgroundColor:
            astro?.astroStatus === 'online'
              ? 'green'
              : astro?.astroStatus === 'busy'
              ? 'orange'
              : 'red',
        },
      ]}
      onPress={() => {
  const status = astro?.astroStatus || "offline";

  if (status === "online") {
    // ✅ Direct chat start — no package popup
    startAstroChat(astro, navigation, API_BASE_URL);
  } 
  else if (status === "busy") {
    setPopupTitle("Wait in Queue");
    setPopupMessage("Astrologer is currently busy. Please wait.");
    setPopupIcon({ name: "time-outline", color: "#FFA500" });
    setStatusPopupVisible(true);
  } 
  else {
    setPopupTitle("Offline");
    setPopupMessage("Astrologer is currently offline.");
    setPopupIcon({ name: "close-circle-outline", color: "#FF3B30" });
    setStatusPopupVisible(true);
  }
}}

    >
      {astro?.offerActive && astro?.offerPrice && astro?.astroStatus === 'online' ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.buttonTitle}>Chat per min</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Text style={[styles.oldPrice, { color: 'gold', textDecorationLine: 'line-through', fontWeight: 'bold', marginRight: 12 }]}>
              ₹{Math.round(astro?.originalRate || astro?.astroRatemin)}
            </Text>
            <Text style={[styles.newPrice, { color: '#fff', fontWeight: 'bold' }]}>
              ₹{Math.round(astro?.offerPrice)}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={[styles.buttonTitle, { color: '#fff',textAlign: 'center', }]}>
          {astro?.astroStatus === 'online' && `Chat per min\n₹${astro?.astroRatemin || 10}`}
          {astro?.astroStatus === 'busy' && `Busy, Please Wait`}
          {astro?.astroStatus === 'offline' && `Astrologer is Offline`}
        </Text>
      )}
    </TouchableOpacity>
    
    
              </View>


     

      {/* Thank You Modal */}
      <Modal visible={thankYouModalVisible} transparent animationType="fade">
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
                onPress={() => setThankYouModalVisible(false)}
                style={styles.okButton}
              >
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Status Popup Modal */}
<Modal visible={statusPopupVisible} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <View style={styles.contentWrapper}>
        <View style={styles.iconWrapper}>
         <Ionicons name={popupIcon.name} size={30} color={popupIcon.color} />

        </View>
        <Text style={styles.modalTitle}>{popupTitle}</Text>
        <Text style={styles.modalMessage}>{popupMessage}</Text>
      </View>

      <View style={styles.separator} />
      <LinearGradient
        colors={['#FC2A0D', '#FE9F5D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBottom}
      >
        <TouchableOpacity
          onPress={() => setStatusPopupVisible(false)}
          style={styles.okButton}
        >
          <Text style={styles.okButtonText}>OK</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </View>
</Modal>
</View>

    </ScrollView>

  );
}




const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor:  '#fff3e0',
    minHeight: '100%',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

 
  reviewItem: { padding: 10, borderBottomWidth: 1, borderColor: '#ccc' },
  reviewDate: { color: '#999' },
    popupBox: { backgroundColor: 'white', padding: 20, width: 250, borderRadius: 8 },
  optionText: { fontSize: 16, marginVertical: 8, fontWeight: '600' },

  topRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 16,
    backgroundColor: '#eee',
     borderRadius: 45,
      borderWidth: 2,             // add border thickness
  borderColor: 'black',  
  },
  infoRight: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  starRating: {
    color: '#FFA500',
    fontWeight: 'bold',
    marginTop: 4,
  },
  special: {
    color: '#666',
    marginTop: 4,
  },
 infoRowBox: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 10,
  gap: 8, // Add gap between boxes
},
ratingRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 6,
},
avgRatingText: {
  fontSize: 14,
  color: '#333',
  marginLeft: 8,
  fontWeight: 'bold',
},

infoRowBoxCombined: {
  flexDirection: 'row',
  backgroundColor: 'white',
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#fff',
  marginVertical: 16,
  paddingVertical: 8,  // added padding to make box taller
  overflow: 'hidden',
},

infoItem: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  marginBottom: 4,   // small gap at the bottom
},
bottomSheet: {
  backgroundColor: '#fff',
  borderTopLeftRadius: 15,
  borderTopRightRadius: 15,
  paddingVertical: 10,
  paddingHorizontal: 15,
  width: '100%',
  position: 'absolute',
  bottom: 0,
},
sheetHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},
sheetTitle: {
  fontSize: 18,
  fontWeight: 'bold',
},
optionRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 10,
},
applyButton: {
  backgroundColor: '#f4b400',
  paddingVertical: 14,
  borderRadius: 8,
  marginTop: 10,
  alignItems: 'center',
},
applyText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 16,
},

verticalDivider: {
  width: 1,
  backgroundColor: 'gray',  // change color to gray
  marginTop: 5,              // gap at the top
  marginBottom: 5,           // gap at the bottom
},
aboutBox: {
  backgroundColor: '#fff3e0',
  padding: 12,
  borderRadius: 10,
  marginTop: 16,
  marginBottom: 20,
  borderWidth: 1,
  borderColor: '#000',
},

 sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    marginTop: 20,  // add this to move it down
},

  aboutText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },


  ratingSummaryBox: {
  padding: 16,
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 10,
  backgroundColor: '#fdfdfd',
  marginBottom: 20,
},
ratingTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 4,
},
avgRatingText: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#000',
},
subText: {
  fontSize: 14,
  color: '#555',
  marginBottom: 10,
},
starRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},
starLabel: {
  width: 60,
  fontSize: 14,
},
progressBar: {
  flex: 1,
  height: 8,
  backgroundColor: '#e0e0e0',
  borderRadius: 4,
  marginHorizontal: 10,
},
progressFill: {
  height: 8,
  backgroundColor: '#2196F3',
  borderRadius: 4,
},
starPercent: {
  width: 60,
  fontSize: 12,
  color: '#333',
},

reviewCard: {
  width: '100%', // full width for vertical layout
  marginBottom: 12, // space between cards
},

reviewText: {
  fontSize: 13,
  color: '#333',
  lineHeight: 18,
  marginVertical: 2,  // reduce spacing
},
reviewHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 4,  // reduce space
},

reviewerName: {
  fontWeight: 'bold',
  color: '#222',
  fontSize: 13,
},
reviewDate: {
  fontSize: 11,
  color: '#999',
},


 buttonRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 30,
  paddingHorizontal: 10,
},

 actionButton: {
  flex: 1,
  paddingVertical: 12,
  paddingHorizontal: 10,
  marginHorizontal: 5,
  borderRadius: 6,             // smaller curve
  alignItems: 'center',
  minHeight: 30,               // gives rectangle feel
  justifyContent: 'center',
  elevation: 2,
},

  buttonTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
    strike: {
    textDecorationLine: 'line-through',
    color: 'yellow',
    fontSize: 14,
  },
  offerRate: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
filterRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 10,
},

filterButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center', // ✅ center text and icon vertically
  justifyContent: 'center',
  paddingHorizontal: 8,
  paddingVertical: 8,
  marginHorizontal: 4,
  backgroundColor: '#fff',
  borderRadius: 20,
},

filterText: {
  fontSize: 14,
  color: '#000',
},

dropdownIcon: {
  marginLeft: 5,
  marginTop: 1.5, // ✅ small lift for perfect vertical alignment
},

resetButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 8,
  paddingVertical: 8,
  marginHorizontal: 4,
  backgroundColor: '#FFA500',
  borderRadius: 20,
},

resetText: {
  fontSize: 14,
  color: '#333',
  fontWeight: '500',
},


optionText: {
  fontSize: 16,
  paddingVertical: 10,
  color: '#333',
  textAlign: 'center',
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center',
},
popupBox: {
  backgroundColor: '#fff',
  padding: 20,
  width: '80%',
  borderRadius: 10,
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
  
}); 