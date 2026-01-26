/**
 * WantToCookScreen (Home Screen)
 *
 * Editorial home screen with "On The Menu" featured recipe and queue.
 * Matches /ui-redesign/screens/home_screen.html
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '../components/editorial/ScreenHeader';
import { FeaturedRecipeCard } from '../components/editorial/FeaturedRecipeCard';
import { QueueRecipeItem } from '../components/editorial/QueueRecipeItem';
import { GroceryTeaser } from '../components/editorial/GroceryTeaser';
import { useTheme } from '../theme';
import { mangiaColors } from '../theme/tokens/colors';
import { fontFamily } from '../theme/tokens/typography';
import { Recipe } from '../models/Recipe';
import {
  fetchRecipesByStatus,
  markAsCooked,
  archiveRecipe,
  deleteRecipe,
  RecipeWithIngredients,
} from '../lib/recipeService';

type RootStackParamList = {
  ImportRecipeScreen: undefined;
  RecipeDetailScreen: { recipeId: string };
  GroceryListScreen: { recipeIds: string[] };
  CookingModeScreen: { recipeId: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const WantToCookScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load recipes with status = 'want_to_cook'
  const loadRecipes = useCallback(async () => {
    try {
      const data = await fetchRecipesByStatus('want_to_cook');
      setRecipes(data);
    } catch (error) {
      console.error('Error loading recipes:', error);
      Alert.alert('Error', 'Failed to load recipes');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadRecipes();
  }, [loadRecipes]);

  const handleRecipePress = useCallback(
    (recipe: Recipe) => {
      navigation.navigate('RecipeDetailScreen', { recipeId: recipe.id });
    },
    [navigation]
  );

  const handleStartCooking = useCallback(
    (recipe: Recipe) => {
      navigation.navigate('CookingModeScreen', { recipeId: recipe.id });
    },
    [navigation]
  );

  const handleAddRecipe = useCallback(() => {
    navigation.navigate('ImportRecipeScreen');
  }, [navigation]);

  const handleViewGroceryList = useCallback(() => {
    if (recipes.length === 0) {
      Alert.alert('No Recipes', 'Add some recipes to your queue first!');
      return;
    }
    const recipeIds = recipes.map((r) => r.id);
    navigation.navigate('GroceryListScreen', { recipeIds });
  }, [recipes, navigation]);

  const handleAvatarPress = useCallback(() => {
    // Navigate to account screen
    (navigation as any).navigate('Account');
  }, [navigation]);

  // Get featured recipe (first one) and queue (rest)
  const featuredRecipe = recipes[0];
  const queueRecipes = recipes.slice(1);

  // Placeholder missing items count (would come from pantry/shopping service)
  const missingItemsCount = recipes.length > 0 ? 4 : 0;

  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={mangiaColors.terracotta} />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }

  // Render empty state
  if (recipes.length === 0) {
    return (
      <View style={styles.container}>
        <ScreenHeader onAvatarPress={handleAvatarPress} />
        <View style={styles.emptyContainer}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContent}>
            <Feather name="book-open" size={80} color={mangiaColors.taupe} />
            <Text style={styles.emptyTitle}>Your cooking queue is empty</Text>
            <Text style={styles.emptySubtitle}>
              Import recipes from TikTok, YouTube, or your favorite blog to get
              started
            </Text>
            <Pressable onPress={handleAddRecipe} style={styles.emptyButton}>
              <Feather name="plus" size={20} color={mangiaColors.white} />
              <Text style={styles.emptyButtonText}>Import Your First Recipe</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader onAvatarPress={handleAvatarPress} />

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={mangiaColors.terracotta}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Title Row */}
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>{'On The\nMenu'}</Text>
            <View style={styles.recipeBadge}>
              <Text style={styles.recipeBadgeText}>
                {recipes.length} Recipe{recipes.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Featured Card */}
          {featuredRecipe && (
            <FeaturedRecipeCard
              recipe={featuredRecipe}
              onPress={handleRecipePress}
            />
          )}
        </View>

        {/* Queue Section */}
        {queueRecipes.length > 0 && (
          <View style={styles.queueSection}>
            {/* Section Header */}
            <View style={styles.queueHeader}>
              <Text style={styles.queueTitle}>Up Next</Text>
              <View style={styles.queueDivider} />
            </View>

            {/* Queue Items */}
            <View style={styles.queueList}>
              {queueRecipes.map((recipe, index) => (
                <View key={recipe.id} style={styles.queueItem}>
                  <QueueRecipeItem
                    recipe={recipe}
                    index={index}
                    onPress={handleRecipePress}
                    onStartCooking={handleStartCooking}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Grocery Teaser */}
        <View style={styles.grocerySection}>
          <GroceryTeaser
            missingItemsCount={missingItemsCount}
            onPress={handleViewGroceryList}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mangiaColors.cream,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.brown,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  // Hero Section
  heroSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 32,
    fontWeight: '400',
    color: mangiaColors.dark,
    lineHeight: 34,
  },
  recipeBadge: {
    backgroundColor: mangiaColors.dark,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  recipeBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    fontWeight: '700',
    color: mangiaColors.cream,
  },
  // Queue Section
  queueSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  queueTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 20,
    fontWeight: '400',
    color: mangiaColors.dark,
  },
  queueDivider: {
    flex: 1,
    height: 1,
    backgroundColor: mangiaColors.dark,
    opacity: 0.2,
  },
  queueList: {
    gap: 16,
  },
  queueItem: {
    marginBottom: 0,
  },
  // Grocery Section
  grocerySection: {
    paddingHorizontal: 24,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: '400',
    color: mangiaColors.dark,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.brown,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: mangiaColors.terracotta,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 9999,
    // Shadow
    shadowColor: mangiaColors.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    fontWeight: '700',
    color: mangiaColors.white,
  },
});

export default WantToCookScreen;
