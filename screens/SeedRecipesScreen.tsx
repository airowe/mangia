// screens/SeedRecipesScreen.tsx
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

  const baseUrl =
    process.env.EXPO_PUBLIC_API_URL || "https://your-vercel-app.vercel.app/api";

  const seedRecipes = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(`${baseUrl}/fetch-recipes`);
      const json = await res.json();
      console.log('Seeded recipes:', json);
      if (!res.ok) throw new Error(json.error || "Request failed");
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
