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
import { Image } from 'expo-image';
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
import { Recipe, RecipeIngredient } from '../models/Recipe';
import {
  fetchRecipesByStatus,
  markAsCooked,
  archiveRecipe,
  deleteRecipe,
  createRecipe,
  RecipeWithIngredients,
} from '../lib/recipeService';
import { SAMPLE_RECIPES, SampleRecipe } from '../lib/sampleRecipes';

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
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);

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

  // Load sample recipes for new users
  const handleLoadSampleRecipes = useCallback(async () => {
    setIsLoadingSamples(true);
    try {
      for (const sample of SAMPLE_RECIPES) {
        await createRecipe(
          {
            title: sample.title,
            description: sample.description,
            image_url: sample.imageUrl,
            prep_time: sample.prepTime,
            cook_time: sample.cookTime,
            servings: sample.servings,
            instructions: sample.instructions,
            source_type: sample.sourceType,
            status: 'want_to_cook',
          },
          sample.ingredients as RecipeIngredient[]
        );
      }
      // Reload recipes after adding samples
      await loadRecipes();
      Alert.alert(
        'Recipes Added!',
        'We\'ve added 3 delicious recipes to your cooking queue. Enjoy exploring!'
      );
    } catch (error) {
      console.error('Error loading sample recipes:', error);
      Alert.alert('Error', 'Failed to load sample recipes. Please try again.');
    } finally {
      setIsLoadingSamples(false);
    }
  }, [loadRecipes]);

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
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContent}>
            {/* Editorial illustration area - compact */}
            <View style={styles.emptyIllustration}>
              <View style={styles.emptyIconCircle}>
                <Feather name="book-open" size={28} color={mangiaColors.terracotta} />
              </View>
              {/* Decorative elements */}
              <View style={[styles.decorDot, styles.decorDot1]} />
              <View style={[styles.decorDot, styles.decorDot2]} />
            </View>

            {/* Main messaging */}
            <Text style={styles.emptyTitle}>Your Kitchen Awaits</Text>
            <Text style={styles.emptySubtitle}>
              Start building your personal cookbook. Import recipes from TikTok, YouTube,
              or any website — or explore our curated starters.
            </Text>

            {/* Primary CTA - Import */}
            <Pressable onPress={handleAddRecipe} style={styles.emptyButtonPrimary}>
              <Feather name="plus" size={20} color={mangiaColors.cream} />
              <Text style={styles.emptyButtonPrimaryText}>Import Your First Recipe</Text>
            </Pressable>

            {/* Divider */}
            <View style={styles.emptyDividerRow}>
              <View style={styles.emptyDivider} />
              <Text style={styles.emptyDividerText}>or</Text>
              <View style={styles.emptyDivider} />
            </View>

            {/* Secondary CTA - Sample recipes */}
            <Pressable
              onPress={handleLoadSampleRecipes}
              style={styles.emptyButtonSecondary}
              disabled={isLoadingSamples}
            >
              {isLoadingSamples ? (
                <ActivityIndicator size="small" color={mangiaColors.terracotta} />
              ) : (
                <>
                  <Feather name="star" size={18} color={mangiaColors.terracotta} />
                  <Text style={styles.emptyButtonSecondaryText}>
                    Try 3 Curated Recipes
                  </Text>
                </>
              )}
            </Pressable>

            {/* Sample recipe preview cards */}
            <View style={styles.samplePreviewContainer}>
              <Text style={styles.samplePreviewLabel}>What you'll get:</Text>
              <View style={styles.samplePreviewCards}>
                {SAMPLE_RECIPES.slice(0, 3).map((recipe, index) => (
                  <View key={index} style={styles.samplePreviewCard}>
                    <Image
                      source={{ uri: recipe.imageUrl }}
                      style={styles.samplePreviewImage}
                    />
                    <Text style={styles.samplePreviewTitle} numberOfLines={2}>
                      {recipe.title}
                    </Text>
                    <Text style={styles.samplePreviewMeta}>
                      {recipe.prepTime + recipe.cookTime} min
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        </ScrollView>
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
  emptyScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 140,
    paddingTop: 8,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIllustration: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: mangiaColors.creamDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: mangiaColors.terracotta,
  },
  decorDot: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: mangiaColors.sage,
  },
  decorDot1: {
    width: 8,
    height: 8,
    top: 5,
    right: 8,
  },
  decorDot2: {
    width: 6,
    height: 6,
    bottom: 10,
    left: 8,
    backgroundColor: mangiaColors.terracotta,
    opacity: 0.6,
  },
  emptyTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: '400',
    color: mangiaColors.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: mangiaColors.brown,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  emptyButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: mangiaColors.terracotta,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 9999,
    width: '100%',
    maxWidth: 280,
    shadowColor: mangiaColors.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyButtonPrimaryText: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    fontWeight: '600',
    color: mangiaColors.cream,
  },
  emptyDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 200,
    marginVertical: 16,
    gap: 12,
  },
  emptyDivider: {
    flex: 1,
    height: 1,
    backgroundColor: mangiaColors.brown,
    opacity: 0.2,
  },
  emptyDividerText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: mangiaColors.brown,
    opacity: 0.6,
  },
  emptyButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: mangiaColors.cream,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: mangiaColors.terracotta,
    width: '100%',
    maxWidth: 280,
  },
  emptyButtonSecondaryText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    fontWeight: '600',
    color: mangiaColors.terracotta,
  },
  samplePreviewContainer: {
    marginTop: 28,
    width: '100%',
    alignItems: 'center',
  },
  samplePreviewLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: mangiaColors.brown,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  samplePreviewCards: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  samplePreviewCard: {
    flex: 1,
    maxWidth: 110,
    alignItems: 'center',
  },
  samplePreviewImage: {
    width: 88,
    height: 88,
    borderRadius: 14,
    backgroundColor: mangiaColors.creamDark,
    marginBottom: 10,
  },
  samplePreviewTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    fontWeight: '600',
    color: mangiaColors.dark,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 16,
  },
  samplePreviewMeta: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: mangiaColors.brown,
    textAlign: 'center',
  },
});

export default WantToCookScreen;
