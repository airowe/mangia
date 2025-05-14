import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet } from "react-native";
import { fetchRecipeById } from "../lib/recipes";

import { useRoute, type RouteProp } from "@react-navigation/native";
import { Recipe } from "../models/Recipe";

type RecipeDetailScreenRouteProp = RouteProp<
  { params: { id: string } },
  "params"
>;

export default function RecipeDetailScreen() {
  const route = useRoute<RecipeDetailScreenRouteProp>();
  const { id } = route.params;
  const [recipe, setRecipe] = useState<Recipe>();

  useEffect(() => {
    fetchRecipeById(id).then(setRecipe);
  }, [id]);

  if (!recipe) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: recipe.image_url }} style={styles.image} />
      <Text style={styles.title}>{recipe.title}</Text>
      <Text>{recipe.description}</Text>
      <Text style={styles.section}>Ingredients:</Text>
      {recipe.ingredients.map((ing, idx) => (
        <Text key={idx}>• {ing.name}</Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  image: { width: "100%", height: 200, borderRadius: 8 },
  title: { fontSize: 24, fontWeight: "bold", marginVertical: 12 },
  section: { marginTop: 16, fontWeight: "bold" },
});
