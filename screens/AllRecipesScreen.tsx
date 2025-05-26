import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { fetchAllRecipes } from '../lib/recipes';
import { Screen } from '../components/Screen';
import { colors } from '../theme/colors';

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
    <Screen>
      <View style={styles.container}>
        <Text style={styles.heading}>All Recipes</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={recipes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Image
                  source={{ uri: item.image_url || item.image }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <View style={styles.cardContent}>
                  <Text style={styles.title}>{item.title || item.name}</Text>
                  {item.recipe_ingredients?.map((ing: any) => (
                    <Text key={ing.id} style={styles.ingredient}>
                      • {ing.quantity} {ing.unit} {ing.name}
                    </Text>
                  ))}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No recipes found</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    width: 100,
    height: 100,
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 8,
    color: colors.text,
  },
  ingredient: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  listContent: {
    paddingBottom: 16,
  },
});