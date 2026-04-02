import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  SafeAreaView,
  Platform, // Added Platform
} from "react-native";
import api from './api/apiClient';
import { useApi } from "./ApiContext";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const AstroBlogScreen = ({ route, navigation }) => { // Added navigation prop
  const { API_BASE_URL } = useApi();
  const astrologerName = route.params?.astroDetails?.astroName || "Expert Astrologer";
  const BLOG_API = `${API_BASE_URL}/api/blogs`;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Popups
  const [successVisible, setSuccessVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteBlogId, setDeleteBlogId] = useState(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Fetch all blogs
  const fetchBlogs = async () => {
    try {
      const res = await api.get(`${BLOG_API}/all`);
      setBlogs(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to load blogs");
    }
  };

  // Submit blog
  const submitBlog = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Validation", "Title and content are required");
      return;
    }

    setLoading(true);
    try {
      await api.post(`${BLOG_API}/create`, { title, content, astrologerName: astrologerName, createdAt: Date.now()});
      setSuccessVisible(true);
      clearForm();
      fetchBlogs();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to post blog");
    } finally {
      setLoading(false);
    }
  };

  // Clear form
  const clearForm = () => {
    setTitle("");
    setContent("");
  };

  // Prepare delete blog modal
  const confirmDeleteBlog = (id) => {
    setDeleteBlogId(id);
    setDeleteVisible(true);
  };

  // Delete blog
  const handleDeleteBlog = async () => {
    try {
      await api.delete(`${BLOG_API}/delete/${deleteBlogId}`);
      setDeleteVisible(false);
      fetchBlogs();
    } catch (error) {
      Alert.alert("Error", "Failed to delete blog");
    }
  };

  // Render blog card
  const renderBlog = ({ item }) => (
    <View style={styles.blogCard}>
      <Text style={styles.blogTitle}>{item.title}</Text>
      <Text style={styles.blogContent}>{item.content}</Text>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => confirmDeleteBlog(item.blogId)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FF6600" }}>
      {/* Container with fixed height for Web scrolling */}
      <View style={{ flex: 1, height: Platform.OS === 'web' ? '100vh' : '100%', backgroundColor: '#fff' }}>
        
        {/* HEADER WITH BACK ARROW */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Blog</Text>
        </View>

        {/* CONTENT */}
        <ScrollView
          style={styles.scrollArea} // Added specific web scroll style
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title input */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter blog title"
            value={title}
            onChangeText={setTitle}
          />

          {/* Content input */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Write your article here..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
          />

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={submitBlog}
              disabled={loading}
            >
              <Text style={styles.btnText}>
                {loading ? "Posting..." : "Submit"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearBtn} onPress={clearForm}>
              <Text style={styles.btnText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Blog list */}
          <FlatList
            data={blogs}
            keyExtractor={(item) => item.blogId.toString()}
            renderItem={renderBlog}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No blogs posted yet</Text>
            }
          />
        </ScrollView>
      </View>

      {/* ===================== SUCCESS MODAL ===================== */}
      <Modal
        visible={successVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="checkmark" size={28} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalMessage}>Blog posted successfully.</Text>

            <LinearGradient
              colors={['#FC2A0D', '#FE9F5D']}
              style={styles.gradientBtn}
            >
              <TouchableOpacity
                onPress={() => setSuccessVisible(false)}
                style={styles.okButton}
              >
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* ===================== DELETE CONFIRM MODAL ===================== */}
      <Modal
        visible={deleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#FF6B00' }]}>
              <Ionicons name="trash-outline" size={28} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this blog?
            </Text>

            <LinearGradient
              colors={['#FC2A0D', '#FE9F5D']}
              style={styles.modalButtonRow}
            >
              <TouchableOpacity
                onPress={() => setDeleteVisible(false)}
                style={styles.modalBtn}
              >
                <Text style={styles.modalBtnTextRed}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteBlog}
                style={styles.modalBtn}
              >
                <Text style={styles.modalBtnTextRed}>Delete</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#ffffff",
  },
  scrollArea: {
    flex: 1,
    ...Platform.select({
      web: {
        flexBasis: 0,
        overflowY: 'auto',
      }
    })
  },
  headerContainer: {
    height: 56,
    backgroundColor: "#FF6600",
    flexDirection: 'row',
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 15,
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    height: 140,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginLeft: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  submitBtn: {
    backgroundColor: "#FF6600",
    padding: 14,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  clearBtn: {
    backgroundColor: "#9E9E9E",
    padding: 14,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  blogCard: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  blogTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    color: "black",
  },
  blogContent: {
    fontSize: 14,
    color: "black",
  },
  deleteBtn: {
    marginTop: 10,
    alignSelf: "flex-end",
  },
  deleteText: {
    color: "#D32F2F",
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFEFE6',
    borderRadius: 16,
    width: '80%',
    overflow: 'hidden',
    alignItems: 'center',
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  gradientBtn: {
    width: '80%',
    borderRadius: 25,
    marginBottom: 20,
  },
  okButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  okButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalButtonRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 15,
  },
  modalBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  modalBtnTextRed: {
    color: '#FC2A0D',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default AstroBlogScreen;