import React from "react";
import { View, Text, StyleSheet, ScrollView, Button } from "react-native";
import { PantryScreen } from "./PantryScreen";

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to Pantry Planner</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Button
          title="Manual"
          onPress={() => navigation.navigate("ManualEntry")}
        />
        <Button
          title="Barcode Scanner"
          onPress={() => navigation.navigate("BarcodeScanner")}
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
