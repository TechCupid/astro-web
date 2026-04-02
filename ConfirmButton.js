import React from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";

const ConfirmButton = ({ onOk ,onNotOk , dispOk,dispNotOk}) => {
  const handlePress = () => {
    Alert.alert(
      "Confirmation",
      "Are you sure you want to proceed?",
      [
        { text: dispOk, onPress: onNotOk  },
        { text: dispNotOk, onPress: onOk },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress}>
      <Text style={styles.buttonText}>Confirm</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ConfirmButton;
