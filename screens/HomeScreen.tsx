import React from "react";
import { View, Text, StyleSheet, ScrollView, Button } from "react-native";
import { PantryScreen } from "./PantryScreen";

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to Pantry Planner</Text>
      <Button
        title="Add Items Manually"
        onPress={() => navigation.navigate("ManualEntry")}
      />

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
