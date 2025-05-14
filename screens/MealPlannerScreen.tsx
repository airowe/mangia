import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { getProductsForCurrentUser } from '../storage/pantryStorage';
import { generateMealPlan, AIRecipe } from '../lib/mealPlanner';

export default function MealPlannerScreen() {
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<AIRecipe[]>([]);

  useEffect(() => {
    const loadItems = async () => {
      const items = await getProductsForCurrentUser();
      setPantryItems(items.map((item) => item.name));
    };
    loadItems();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateMealPlan(pantryItems);
    setRecipes(result);
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <Button title="Generate Meal Plan" onPress={handleGenerate} disabled={loading} />
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

      {recipes.map((recipe, idx) => (
        <View key={idx} style={styles.recipeCard}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          <Text style={styles.subheading}>Ingredients:</Text>
          {recipe.ingredients.map((ing, i) => (
            <Text key={i}>- {ing.quantity} {ing.unit} {ing.name}</Text>
          ))}
          <Text style={styles.subheading}>Instructions:</Text>
          <Text>{recipe.instructions}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  recipeCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 10,
    borderRadius: 8,
    elevation: 2,
  },
  recipeTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  subheading: { fontWeight: 'bold', marginTop: 8 },
});
