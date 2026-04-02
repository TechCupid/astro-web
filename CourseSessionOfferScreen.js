import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import api from './api/apiClient';
import { useApi } from './ApiContext';
import moment from 'moment';
import { AntDesign } from '@expo/vector-icons'; // for arrow icon

const CourseSessionOfferScreen = () => {
  const { API_BASE_URL } = useApi();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState('Completed Courses');

  const today = moment();

  const runningCourses = [];
  const completedCourses = [];
  const upcomingCourses = [];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get(`${API_BASE_URL}/api/course-session/all`);
      setCourses(res.data || []);
    } catch (err) {
      console.error('❌ Error fetching course sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  courses.forEach((c) => {
    const start = moment(c.startDate);
    const end = moment(c.endDate);
    if (today.isBetween(start, end, 'day', '[]')) {
      runningCourses.push(c);
    } else if (today.isBefore(start)) {
      upcomingCourses.push(c);
    } else if (today.isAfter(end)) {
      completedCourses.push(c);
    }
  });

  const renderSection = (title, items) => {
    const isExpanded = expandedSection === title;

    return (
      <View style={styles.section}>
        <TouchableOpacity
          onPress={() => setExpandedSection(isExpanded ? null : title)}
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>{title}</Text>
          <AntDesign name={isExpanded ? 'up' : 'down'} size={18} color="white" />
        </TouchableOpacity>

        {isExpanded &&
          (items.length === 0 ? (
            <Text style={styles.empty}>No {title.toLowerCase()} available.</Text>
          ) : (
            items.map((item, idx) => (
              <View key={idx} style={styles.card}>
                <View style={styles.row}>
                  <Image
                    source={
                      item.astroPhotoBase64
                        ? { uri: `data:image/jpeg;base64,${item.astroPhotoBase64}` }
                        : require('./assets/Astroicon.jpg') // fallback
                    }
                    style={styles.photo}
                  />
                  <View style={styles.details}>
                    <Text style={styles.label}>{item.astroName || 'Unknown'}</Text>
    
                    <Text style={{ color: 'black' }}>
                      Title: {item.courseTitle}
                    </Text>
                    <Text style={{ color: 'black' }}>
                      Desc: {item.courseDescription}
                    </Text>
                    <Text style={{ color: 'black'}}>
                      Original Amount: <Text style={{ textDecorationLine: 'line-through' }}>₹{item.courseAmount}</Text>
                    </Text>

                    <Text style={{ color: 'black' }}>
                      Offer Amount: <Text style={{ fontWeight:'bold' }}>₹{item.offerAmount}</Text>
                    </Text>
                    <Text style={styles.date}>
                      Start: {moment(item.startDate).format('DD/MM/YYYY')}
                    </Text>
                    <Text style={styles.date}>
                      End: {moment(item.endDate).format('DD/MM/YYYY')}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#FF7300" style={{ marginTop: 30 }} />
      ) : (
        <>
          {renderSection('Completed Courses', completedCourses)}
          {renderSection('Running Courses', runningCourses)}
          {renderSection('Future Courses', upcomingCourses)}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  section: { marginBottom: 10 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FF7300',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF7300',
    marginBottom: 6,
    
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFF7F0',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF7300',
    marginBottom: 10,
  },
  row: { flexDirection: 'row' },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 14,
  },
  details: { flex: 1 },
  label: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
    color: '#333',
  },
  date: {
    color: 'black',
    fontSize: 14,
    marginTop: 2,
  },
  empty: {
    fontStyle: 'italic',
    color: '#999',
    marginLeft: 6,
  },
  originalAmountText: {
  color: 'black',
  fontWeight: 'bold',
  fontSize: 14,
},

strikeLine: {
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  height: 1,
  borderStyle: 'dashed',
  borderWidth: 1,
  borderColor: 'gray', // or gray
  zIndex: 1,
},

});

export default CourseSessionOfferScreen;
