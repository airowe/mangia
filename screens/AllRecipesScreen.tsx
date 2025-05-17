import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { fetchAllRecipes } from '../lib/recipes'; // You need to implement this function

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/120x80.png?text=No+Image';

export const AllRecipesScreen = () => {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAllRecipes(); // Should fetch all recipes, not filtered by user
        setRecipes(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>All Recipes</Text>
      {loading ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image
                source={{ uri: item.image }}
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
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20 }}>
              No recipes found.
            </Text>
          }
        />
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