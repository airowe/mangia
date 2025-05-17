import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";

export default function SeedRecipesScreen() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("API URL is not defined");
  }

  const seedRecipes = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const results = [];
      for (let i = 0; i < 10; i++) {
        const res = await fetch(`${baseUrl}/recipes/seed-recipes`);
        results.push(res);
        if (i < 9) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      const lastRes = results[results.length - 1];
      const json = await lastRes.json();
      if (!lastRes.ok) throw new Error(json.error || "Request failed");
      setResponse(`Seeded ${json.added} recipes for query: ${json.query}`);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to seed recipes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manual Recipe Seeder</Text>
      <Button
        title="Seed Recipes from API Ninjas"
        onPress={seedRecipes}
        disabled={loading}
      />
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
      {response && <Text style={styles.result}>{response}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  result: {
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
  },
});
