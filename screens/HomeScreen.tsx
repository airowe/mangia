import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Button } from "react-native";
import AddProductModal from "../components/AddProductModal";
import PrimaryButton from "../components/PrimaryButton";
import PantryScreen from "./PantryScreen";

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <AddProductModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
        <PrimaryButton
          title="Add Manually"
          onPress={() => setModalVisible(true)}
        />
        <PrimaryButton
          title="Scan Barcode"
          onPress={() => navigation.navigate("ScanBarcode")}
        />
      </View>
      <PantryScreen />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f4f6f8",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
});
