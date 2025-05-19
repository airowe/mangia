import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Button } from "react-native";
import AddProductModal from "../components/AddProductModal";
import PrimaryButton from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import PantryScreen from "./PantryScreen";

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <Screen>
      <View style={styles.header}>
        <AddProductModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
        <View style={styles.buttonContainer}>
          <View style={styles.button}>
            <PrimaryButton
              title="Add Manually"
              onPress={() => setModalVisible(true)}
            />
          </View>
          <View style={styles.button}>
            <PrimaryButton
              title="Scan Barcode"
              onPress={() => navigation.navigate("BarcodeScreen")}
            />
          </View>
        </View>
      </View>
      <View style={styles.content}>
        <PantryScreen />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});
