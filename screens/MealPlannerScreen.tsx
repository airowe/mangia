import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { fetchPantryItems } from '../lib/pantry';
import { generateMealPlan, AIRecipe } from '../lib/mealPlanner';
import { Product } from '../models/Product';
import { Screen } from '../components/Screen';
import { colors } from '../theme/colors';

export default function MealPlannerScreen() {
  const [pantryItems, setPantryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<AIRecipe[]>([]);

  useEffect(() => {
    const loadItems = async () => {
      const items = await fetchPantryItems();
      setPantryItems(items.map((item: Product) => item.title));
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
    <Screen>
      <View style={styles.container}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleGenerate} 
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Generating...' : 'Generate Meal Plan'}
          </Text>
        </TouchableOpacity>
        
        {loading && <ActivityIndicator style={styles.loading} size="large" color={colors.primary} />}
        
        <ScrollView style={styles.recipesContainer}>
          {recipes.length > 0 && (
            <Text style={styles.sectionTitle}>Your Meal Plan</Text>
          )}
          
          {recipes.map((recipe, index) => (
            <View key={index} style={styles.recipeCard}>
              <Text style={styles.recipeName}>{recipe.title}</Text>
              <Text style={styles.subheading}>Ingredients:</Text>
              {recipe.ingredients.map((ing, i) => (
                <Text key={i}>- {ing.quantity} {ing.unit} {ing.name}</Text>
              ))}
              <Text style={styles.subheading}>Instructions:</Text>
              <Text>{recipe.instructions}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: colors.secondary,
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    marginTop: 20,
  },
  recipesContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
  },
  recipeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: colors.text,
  },
  subheading: { 
    fontWeight: '600', 
    marginTop: 12,
    color: colors.text,
  },
  instructions: { 
    marginTop: 8,
    color: colors.text,
    lineHeight: 22,
  },
});
