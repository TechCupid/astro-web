import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const localBookImages = {
  "spiritualbook.jpeg": require("./assets/spiritualbook.jpeg"),
  "divyadesangal.jpeg": require("./assets/divyadesangal.jpeg"),
  "Sandhyaavandanam.jpg": require("./assets/Sandhyaavandanam.jpg"),
};

const CartScreen = ({ route }) => {
  const { cart } = route.params;
  const cartItems = Object.values(cart).filter(c => c.quantity > 0);

  const getBookImage = (img) => {
    if (!img) return require("./assets/spiritualbook.jpeg");
    if (localBookImages[img]) return localBookImages[img];
    return { uri: img };
  };

  const subtotal = cartItems.reduce(
    (sum, c) => sum + Number(c.item.bookPrice) * c.quantity,
    0
  );
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const total = subtotal + deliveryFee;

  if (cartItems.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 16 }}>Your cart is empty!</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
      </View>

      {/* Cart Items */}
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.item.bookId.toString()}
        contentContainerStyle={{ padding: 12, paddingBottom: 160 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={getBookImage(item.item.bookImg)}
              style={styles.image}
            />
            <View style={styles.details}>
              <Text style={styles.title}>{item.item.bookName}</Text>
              <Text style={styles.price}>₹ {item.item.bookPrice}</Text>
              <Text style={styles.qty}>Quantity: {item.quantity}</Text>
            </View>
          </View>
        )}
      />

      {/* Order Summary */}
      <View style={styles.summary}>
        <View style={styles.row}>
          <Text style={styles.label}>Subtotal</Text>
          <Text style={styles.value}>₹ {subtotal}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Delivery Fee</Text>
          <Text style={styles.value}>₹ {deliveryFee}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹ {total}</Text>
        </View>

        <TouchableOpacity
          style={styles.placeOrderBtn}
          onPress={() => alert("Order placed successfully!")}
        >
          <Text style={styles.placeOrderText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  header: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  card: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  image: {
    width: 80,
    height: 100,
    borderRadius: 6,
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e40af",
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
  },
  qty: {
    fontSize: 13,
    color: "#555",
  },
  summary: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: "#555",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e40af",
  },
  placeOrderBtn: {
    marginTop: 12,
    backgroundColor: "#1e40af",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  placeOrderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
