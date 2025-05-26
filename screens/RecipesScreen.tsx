import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { fetchRecipes } from '../lib/recipes';
import { Recipe } from '../models/Recipe';
import { Screen } from '../components/Screen';
import { colors } from '../theme/colors';

export const RecipesScreen = ({ navigation }: { navigation: any }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecipes = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await fetchRecipes();
      setRecipes(data);
    } catch (err) {
      console.error('Failed to load recipes:', err);
      setError('Failed to load recipes. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecipes(false);
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    
    const imageUrl = item.image_url || item.image;
    const title = item.title || item.name || 'Untitled Recipe';
    const description = item.description || 'No description available';
    const cookTime = item.cook_time || item.cookTime || 0;
    const servings = item.servings || 0;

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => {
          // Navigate to recipe detail
          navigation.navigate('RecipeDetail', { recipeId: item.id });
        }}
      >
        <View style={styles.cardContent}>
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.recipeImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="restaurant" size={48} color={colors.primary} />
            </View>
          )}
          <View style={styles.recipeInfo}>
            <Text style={styles.recipeName} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.recipeDescription} numberOfLines={2}>
              {description}
            </Text>
            <View style={styles.recipeMeta}>
              <Text style={styles.recipeMetaText}>
                {cookTime > 0 ? `${cookTime} min` : ''} {cookTime > 0 && servings > 0 ? '•' : ''} {servings > 0 ? `${servings} servings` : ''}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.heading}>Your Recipes</Text>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => loadRecipes()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={recipes}
            keyExtractor={(item) => item.id}
            renderItem={renderRecipeItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No recipes found</Text>
                <Text style={styles.emptySubtext}>Add a new recipe to get started</Text>
              </View>
            }
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
  placeholderContainer: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeholderText: {
    color: colors.secondary,
    fontSize: 12,
  },
  recipeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 8,
  },
  recipeMeta: {
    flexDirection: 'row',
  },
  recipeMetaText: {
    fontSize: 12,
    color: colors.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.secondary,
    textAlign: 'center',
  },
});