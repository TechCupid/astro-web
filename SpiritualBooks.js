import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useApi } from "./ApiContext";
import api from "./api/apiClient";

const localBookImages = {
  "spiritualbook.jpeg": require("./assets/spiritualbook.jpeg"),
  "divyadesangal.jpeg": require("./assets/divyadesangal.jpeg"),
  "Sandhyaavandanam.jpg": require("./assets/Sandhyaavandanam.jpg"),
};

const SpiritualBooks = () => {
  const { API_BASE_URL } = useApi();
  const navigation = useNavigation();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await api.get(`${API_BASE_URL}/api/astro/spirit-books`);
      setBooks(res.data || []);
    } catch (err) {
      console.log("❌ Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const getBookImage = (img) => {
    if (!img) return require("./assets/spiritualbook.jpeg");
    if (localBookImages[img]) return localBookImages[img];
    if (!img.startsWith("http"))
      return { uri: `${API_BASE_URL}/images/${img}` };
    return { uri: img };
  };

  const changeQuantity = (item, delta) => {
    setCart((prev) => {
      const currentQty = prev[item.bookId]?.quantity || 0;
      const newQty = Math.max(currentQty + delta, 0);
      return { ...prev, [item.bookId]: { item, quantity: newQty } };
    });
  };

  const getTotalItems = () =>
    Object.values(cart).reduce((sum, c) => sum + c.quantity, 0);

  if (loading)
    return <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 50 }} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainWrapper}>
        
        {/* ✅ CUSTOM ORANGE HEADER (Matches your other screens) */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Spiritual Books</Text>
          </View>

          {/* Cart Icon inside Header */}
          <TouchableOpacity
            onPress={() => navigation.navigate("CartScreen", { cart })}
            style={styles.cartBtn}
          >
            <Ionicons name="cart-outline" size={26} color="#fff" />
            {getTotalItems() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Books list with Web Scroll Fix */}
        <FlatList
          data={books}
          keyExtractor={(item) => item.bookId.toString()}
          style={styles.scrollArea}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Image source={getBookImage(item.bookImg)} style={styles.image} />
                <View style={styles.quantityContainer}>
                  <TouchableOpacity onPress={() => changeQuantity(item, -1)}>
                    <Text style={styles.qtyBtn}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{cart[item.bookId]?.quantity || 0}</Text>
                  <TouchableOpacity onPress={() => changeQuantity(item, 1)}>
                    <Text style={styles.qtyBtn}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.details}>
                <Text style={styles.title}>{item.bookName}</Text>
                <Text style={styles.price}>₹ {item.bookPrice}</Text>
                <Text style={styles.publisher}>{item.bookPublisher}</Text>
                
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => changeQuantity(item, 1)}
                >
                  <Text style={styles.addButtonText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default SpiritualBooks;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FF6600", // Header background color
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    height: Platform.OS === 'web' ? '100vh' : '100%',
  },
  header: {
    height: 60,
    backgroundColor: "#FF6600",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    marginRight: 15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  cartBtn: {
    padding: 5,
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "red",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  cartBadgeText: { 
    color: "#fff", 
    fontSize: 10, 
    fontWeight: "bold" 
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
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: { width: 100, height: 140, borderRadius: 8 },
  details: { flex: 1, marginLeft: 16, justifyContent: "space-between" },
  title: { fontSize: 17, fontWeight: "bold", color: "#333" },
  price: { fontSize: 16, fontWeight: "700", color: "#FF6600" },
  publisher: { fontSize: 13, color: "#777" },
  addButton: {
    backgroundColor: '#FF6600',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    backgroundColor: '#fff3e0',
    borderRadius: 20,
  },
  qtyBtn: {
    fontSize: 22,
    paddingHorizontal: 12,
    color: "#FF6600",
    fontWeight: "bold",
  },
  qtyText: { fontSize: 16, marginHorizontal: 4, fontWeight: "bold" },
});