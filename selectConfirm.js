import React from "react";
import { View } from "react-native";
import ConfirmButton from "./ConfirmButton";

const selectConfirm = () => {
  return (
    <View style={{ padding: 20 }}>
      <ConfirmButton onConfirm={() => console.log("Confirmed!")} />
    </View>
  );
};

export default selectConfirm;
