import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import { getRecipes } from '../lib/recipes';

export const RecipesScreen = () => {
  const [recipes, setRecipes] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRecipes();
        setRecipes(data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Recipes</Text>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            {item.recipe_ingredients?.map((ing: any) => (
              <Text key={ing.id}>
                - {ing.quantity} {ing.unit} {ing.name}
              </Text>
            ))}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { padding: 12, marginBottom: 12, backgroundColor: '#fff', borderRadius: 8, elevation: 2 },
  title: { fontWeight: 'bold', fontSize: 18, marginBottom: 4 },
});
