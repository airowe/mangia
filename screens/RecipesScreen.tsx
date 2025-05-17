import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { fetchRecipes } from '../lib/recipes';

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/120x80.png?text=No+Image';

export const RecipesScreen = () => {
  const [recipes, setRecipes] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchRecipes();
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
            <Image
              source={{ uri: item.image || PLACEHOLDER_IMAGE }}
              style={styles.image}
              resizeMode="cover"
            />
            <Text style={styles.title}>{item.title}</Text>
            {item.recipe_ingredients?.map((ing: any) => (
              <Text key={ing.id}>
                - {ing.quantity} {ing.unit} {ing.name}
              </Text>
            ))}
          </View>
        )}
      />
      {recipes.length === 0 && (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>
          No recipes found. Please add some!
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { padding: 12, marginBottom: 12, backgroundColor: '#fff', borderRadius: 8, elevation: 2 },
  image: { width: 120, height: 80, borderRadius: 6, marginBottom: 8, backgroundColor: '#eee' },
  title: { fontWeight: 'bold', fontSize: 18, marginBottom: 4 },
});