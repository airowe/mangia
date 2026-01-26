import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Linking,
  Alert,
  FlatList,
  Dimensions,
} from "react-native";
import {
  useRoute,
  useNavigation,
  type RouteProp,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Portal, Modal, RadioButton } from "react-native-paper";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Screen } from "../components/Screen";
import { useTheme } from "../theme";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 320;
import { Recipe, RecipeSourceType, RecipeNote } from "../models/Recipe";
import { RecipeRatingNotes } from "../components/RecipeRatingNotes";
import {
  fetchRecipeById,
  markAsCooked,
  archiveRecipe,
  deleteRecipe,
  restoreRecipe,
  RecipeWithIngredients,
} from "../lib/recipeService";
import { ServingAdjuster } from "../components/ServingAdjuster";
import { getScaledIngredientDisplay } from "../utils/recipeScaling";
import { CollectionWithCount } from "../models/Collection";
import {
  fetchCollections,
  addRecipeToCollection,
  getCollectionsForRecipe,
} from "../lib/collectionService";
import { shareRecipe, shareIngredients } from "../lib/recipeSharing";

type RecipeDetailScreenRouteProp = RouteProp<
  { params: { recipeId: string } },
  "params"
>;

type RootStackParamList = {
  WantToCookScreen: undefined;
  GroceryListScreen: { recipeIds: string[] };
  CookingModeScreen: { recipeId: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function RecipeDetailScreen() {
  const route = useRoute<RecipeDetailScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { recipeId } = route.params;
  const { theme, isDark } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

  // Platform icons and colors - using dynamic primary color
  const PLATFORM_CONFIG: Record<
    RecipeSourceType,
    {
      icon: keyof typeof MaterialCommunityIcons.glyphMap;
      color: string;
      label: string;
    }
  > = useMemo(() => ({
    tiktok: { icon: "music-note", color: isDark ? "#FFFFFF" : "#000000", label: "TikTok" },
    youtube: { icon: "youtube", color: "#FF0000", label: "YouTube" },
    instagram: { icon: "instagram", color: "#E4405F", label: "Instagram" },
    blog: { icon: "web", color: "#4CAF50", label: "Blog" },
    manual: { icon: "pencil", color: colors.primary, label: "Manual" },
  }), [colors.primary, isDark]);

  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentServings, setCurrentServings] = useState<number>(0);
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [collections, setCollections] = useState<CollectionWithCount[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [recipeCollections, setRecipeCollections] = useState<string[]>([]);
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);

  const loadRecipe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRecipeById(recipeId);
      setRecipe(data);
    } catch (err) {
      console.error("Failed to load recipe:", err);
      setError("Failed to load recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  // Set initial servings when recipe loads
  useEffect(() => {
    if (recipe?.servings) {
      setCurrentServings(recipe.servings);
    }
  }, [recipe?.servings]);

  // Calculate scale factor for ingredients
  const scaleFactor = useMemo(() => {
    if (!recipe?.servings || recipe.servings === 0 || currentServings === 0) {
      return 1;
    }
    return currentServings / recipe.servings;
  }, [recipe?.servings, currentServings]);

  const handleShare = async () => {
    if (!recipe) return;

    Alert.alert("Share Recipe", "What would you like to share?", [
      {
        text: "Full Recipe",
        onPress: async () => {
          try {
            await shareRecipe(recipe);
          } catch (error) {
            console.error("Error sharing recipe:", error);
          }
        },
      },
      {
        text: "Ingredients Only",
        onPress: async () => {
          try {
            await shareIngredients(recipe);
          } catch (error) {
            console.error("Error sharing ingredients:", error);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openSourceLink = () => {
    if (recipe?.source_url) {
      Linking.openURL(recipe.source_url);
    }
  };

  // Mark recipe as cooked
  const handleMarkCooked = useCallback(async () => {
    if (!recipe) return;

    Alert.alert("Mark as Cooked", `Did you make "${recipe.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, I made it!",
        onPress: async () => {
          setIsUpdating(true);
          try {
            await markAsCooked(recipe.id);
            // Show celebration
            Alert.alert("Delicious!", "Recipe marked as cooked. Nice work!", [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ]);
          } catch (error) {
            Alert.alert("Error", "Failed to update recipe");
          } finally {
            setIsUpdating(false);
          }
        },
      },
    ]);
  }, [recipe, navigation]);

  // Archive recipe
  const handleArchive = useCallback(async () => {
    if (!recipe) return;

    setIsUpdating(true);
    try {
      await archiveRecipe(recipe.id);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to archive recipe");
    } finally {
      setIsUpdating(false);
    }
  }, [recipe, navigation]);

  // Restore to Want to Cook
  const handleRestore = useCallback(async () => {
    if (!recipe) return;

    setIsUpdating(true);
    try {
      await restoreRecipe(recipe.id);
      setRecipe({ ...recipe, status: "want_to_cook" });
      Alert.alert("Restored", "Recipe added back to your queue");
    } catch (error) {
      Alert.alert("Error", "Failed to restore recipe");
    } finally {
      setIsUpdating(false);
    }
  }, [recipe]);

  // Delete recipe
  const handleDelete = useCallback(() => {
    if (!recipe) return;

    Alert.alert(
      "Delete Recipe",
      `Are you sure you want to delete "${recipe.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsUpdating(true);
            try {
              await deleteRecipe(recipe.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to delete recipe");
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ],
    );
  }, [recipe, navigation]);

  // Add to grocery list
  const handleAddToGroceryList = useCallback(() => {
    if (!recipe) return;
    navigation.navigate("GroceryListScreen", { recipeIds: [recipe.id] });
  }, [recipe, navigation]);

  // Start cooking mode
  const handleStartCooking = useCallback(() => {
    if (!recipe) return;
    if (!recipe.instructions || recipe.instructions.length === 0) {
      Alert.alert("No Instructions", "This recipe doesn't have any instructions to follow.");
      return;
    }
    navigation.navigate("CookingModeScreen", { recipeId: recipe.id });
  }, [recipe, navigation]);

  // Open add to collection modal
  const handleOpenCollectionModal = useCallback(async () => {
    try {
      const [allCollections, existingCollections] = await Promise.all([
        fetchCollections(),
        recipe ? getCollectionsForRecipe(recipe.id) : [],
      ]);
      setCollections(allCollections);
      setRecipeCollections(existingCollections.map((c) => c.id));
      setSelectedCollectionId(null);
      setCollectionModalVisible(true);
    } catch (error) {
      console.error("Error loading collections:", error);
      Alert.alert("Error", "Failed to load collections");
    }
  }, [recipe]);

  // Add recipe to selected collection
  const handleAddToCollection = useCallback(async () => {
    if (!recipe || !selectedCollectionId) return;

    setIsAddingToCollection(true);
    try {
      await addRecipeToCollection(selectedCollectionId, recipe.id);
      const selectedCollection = collections.find((c) => c.id === selectedCollectionId);
      Alert.alert(
        "Added!",
        `"${recipe.title}" has been added to "${selectedCollection?.name || 'collection'}".`
      );
      setCollectionModalVisible(false);
    } catch (error: any) {
      if (error.message?.includes("already in this collection")) {
        Alert.alert("Already Added", "This recipe is already in that collection.");
      } else {
        Alert.alert("Error", "Failed to add recipe to collection");
      }
    } finally {
      setIsAddingToCollection(false);
    }
  }, [recipe, selectedCollectionId, collections]);

  // Get platform config
  const sourceType = recipe?.source_type || "manual";
  const platform = PLATFORM_CONFIG[sourceType] || PLATFORM_CONFIG.manual;

  // Dynamic styles based on theme - Editorial magazine design
  const dynamicStyles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      padding: spacing.xl,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      padding: spacing.xl,
    },
    errorText: {
      ...typography.styles.body,
      color: colors.error,
      marginBottom: spacing.lg,
      textAlign: "center" as const,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
    },
    retryButtonText: {
      color: colors.textOnPrimary,
      fontWeight: "600" as const,
    },
    // Hero image section - editorial magazine style
    heroContainer: {
      position: 'relative' as const,
      height: HERO_HEIGHT,
      width: '100%' as const,
    },
    heroImage: {
      width: '100%' as const,
      height: '100%' as const,
    },
    heroGradient: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: HERO_HEIGHT * 0.7,
    },
    heroContent: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      padding: spacing.xl,
    },
    heroTitle: {
      ...typography.editorialStyles.recipeTitle,
      color: '#FFFFFF',
      marginBottom: spacing.sm,
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    heroShareButton: {
      position: 'absolute' as const,
      top: 50,
      right: spacing.md,
      backgroundColor: 'rgba(0,0,0,0.4)',
      borderRadius: borderRadius.full,
      padding: spacing.sm,
    },
    placeholderImage: {
      width: "100%" as const,
      height: 200,
      backgroundColor: colors.surfaceElevated,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    // Quick info bar - horizontal pills
    quickInfoBar: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
      padding: spacing.lg,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    quickInfoPill: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
    },
    quickInfoText: {
      ...typography.editorialStyles.byline,
      color: colors.textSecondary,
    },
    header: {
      padding: spacing.xl,
      backgroundColor: colors.card,
    },
    titleRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "flex-start" as const,
    },
    title: {
      flex: 1,
      ...typography.editorialStyles.recipeTitle,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    shareButton: {
      padding: spacing.sm,
      marginLeft: spacing.sm,
    },
    platformBadge: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    platformLabel: {
      ...typography.editorialStyles.byline,
      fontWeight: "500" as const,
    },
    viewOriginal: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
      marginLeft: spacing.md,
    },
    viewOriginalText: {
      ...typography.editorialStyles.byline,
      color: colors.primary,
    },
    description: {
      ...typography.editorialStyles.recipeBody,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    metaContainer: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: spacing.lg,
      marginBottom: spacing.sm,
    },
    metaItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
    },
    metaText: {
      ...typography.styles.subheadline,
      color: colors.textSecondary,
    },
    statusBadge: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.surfaceElevated,
      borderRadius: borderRadius.full,
      alignSelf: "flex-start" as const,
    },
    statusText: {
      ...typography.editorialStyles.byline,
      fontWeight: "600" as const,
    },
    // Sections - editorial spacing, no borders
    section: {
      padding: spacing.xl,
      backgroundColor: colors.card,
      marginTop: spacing.xs,
    },
    sectionTitle: {
      ...typography.editorialStyles.sectionHeading,
      color: colors.text,
      marginBottom: spacing.xl,
    },
    ingredientsHeader: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      marginBottom: spacing.xl,
    },
    scaledBadge: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: `${colors.info}15`,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      gap: spacing.xs,
    },
    scaledBadgeText: {
      ...typography.editorialStyles.byline,
      color: colors.info,
      fontWeight: "600" as const,
    },
    ingredientsList: {
      marginLeft: spacing.xs,
    },
    ingredientItem: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      marginBottom: spacing.lg,
    },
    bulletPoint: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginTop: 7,
      marginRight: spacing.lg,
    },
    ingredientText: {
      flex: 1,
      ...typography.editorialStyles.ingredient,
      color: colors.text,
    },
    instructionsContainer: {
      gap: spacing.xl,
    },
    instructionStep: {
      flexDirection: "row" as const,
      gap: spacing.lg,
    },
    stepNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    stepNumberText: {
      ...typography.editorialStyles.byline,
      color: colors.textOnPrimary,
      fontWeight: "700" as const,
      fontSize: 14,
    },
    instructionText: {
      flex: 1,
      ...typography.editorialStyles.recipeBody,
      color: colors.text,
    },
    noContent: {
      fontStyle: "italic" as const,
      color: colors.textSecondary,
    },
    // CTA section - prominent Start Cooking button
    actionsSection: {
      padding: spacing.xl,
      backgroundColor: colors.card,
      marginTop: spacing.xs,
      gap: spacing.md,
    },
    cookingButton: {
      borderRadius: borderRadius.full,
      marginBottom: spacing.md,
    },
    cookingButtonContent: {
      paddingVertical: spacing.md,
    },
    primaryButton: {
      borderRadius: borderRadius.full,
    },
    secondaryButton: {
      borderRadius: borderRadius.full,
      borderColor: colors.primary,
    },
    buttonContent: {
      paddingVertical: spacing.sm,
    },
    textButton: {
      alignSelf: "center" as const,
    },
    deleteButton: {
      alignSelf: "center" as const,
      marginTop: spacing.sm,
    },
    footer: {
      height: 40,
    },
    collectionModal: {
      backgroundColor: colors.card,
      margin: spacing.xl,
      padding: spacing.xl,
      borderRadius: borderRadius.lg,
      maxHeight: '70%' as const,
    },
    collectionModalTitle: {
      ...typography.editorialStyles.sectionHeading,
      color: colors.text,
      marginBottom: spacing.lg,
    },
    collectionList: {
      maxHeight: 300,
    },
    collectionOption: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
      backgroundColor: colors.background,
    },
    collectionOptionSelected: {
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    collectionOptionDisabled: {
      opacity: 0.6,
    },
    collectionOptionIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    collectionOptionInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    collectionOptionName: {
      ...typography.styles.body,
      fontWeight: '500' as const,
      color: colors.text,
    },
    collectionOptionCount: {
      ...typography.styles.caption1,
      color: colors.textSecondary,
    },
    collectionModalActions: {
      flexDirection: 'row' as const,
      justifyContent: 'flex-end' as const,
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    collectionModalButton: {
      minWidth: 80,
    },
    noCollectionsContainer: {
      alignItems: 'center' as const,
      padding: spacing.xxxl,
    },
    noCollectionsText: {
      ...typography.styles.subheadline,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      marginTop: spacing.md,
    },
  }), [colors, spacing, borderRadius, typography]);

  if (loading) {
    return (
      <Screen>
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !recipe) {
    return (
      <Screen>
        <View style={dynamicStyles.errorContainer}>
          <Text style={dynamicStyles.errorText}>{error || "Recipe not found"}</Text>
          <TouchableOpacity style={dynamicStyles.retryButton} onPress={loadRecipe}>
            <Text style={dynamicStyles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const isWantToCook = recipe.status === "want_to_cook";
  const isCooked = recipe.status === "cooked";
  const isArchived = recipe.status === "archived";

  // Calculate total time for quick info bar
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <Screen noPadding>
      <ScrollView style={dynamicStyles.container}>
        {/* Hero Image with Gradient Overlay */}
        {recipe.image_url ? (
          <Animated.View entering={FadeIn.duration(400)} style={dynamicStyles.heroContainer}>
            <Image
              source={{ uri: recipe.image_url }}
              style={dynamicStyles.heroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={dynamicStyles.heroGradient}
            />
            <View style={dynamicStyles.heroContent}>
              {recipe.meal_type && (
                <Animated.Text
                  entering={FadeInDown.delay(100).duration(300)}
                  style={[dynamicStyles.platformLabel, { color: colors.accent, marginBottom: spacing.xs }]}
                >
                  {recipe.meal_type.toUpperCase()}
                </Animated.Text>
              )}
              <Animated.Text
                entering={FadeInDown.delay(200).duration(300)}
                style={dynamicStyles.heroTitle}
                numberOfLines={3}
              >
                {recipe.title}
              </Animated.Text>
            </View>
            <TouchableOpacity onPress={handleShare} style={dynamicStyles.heroShareButton}>
              <Ionicons name="share-social-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={dynamicStyles.placeholderImage}>
            <MaterialCommunityIcons
              name="food"
              size={80}
              color={colors.textTertiary}
            />
          </View>
        )}

        {/* Quick Info Bar - Horizontal Pills */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={dynamicStyles.quickInfoBar}>
          {totalTime > 0 && (
            <View style={dynamicStyles.quickInfoPill}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={colors.primary} />
              <Text style={dynamicStyles.quickInfoText}>{totalTime} min</Text>
            </View>
          )}
          {recipe.servings && recipe.servings > 0 && (
            <View style={dynamicStyles.quickInfoPill}>
              <MaterialCommunityIcons name="account-group-outline" size={16} color={colors.primary} />
              <Text style={dynamicStyles.quickInfoText}>{recipe.servings} servings</Text>
            </View>
          )}
          {/* Platform source */}
          <TouchableOpacity
            style={dynamicStyles.quickInfoPill}
            onPress={recipe.source_url ? openSourceLink : undefined}
            disabled={!recipe.source_url}
          >
            <MaterialCommunityIcons name={platform.icon} size={16} color={platform.color} />
            <Text style={[dynamicStyles.quickInfoText, { color: platform.color }]}>
              {platform.label}
            </Text>
            {recipe.source_url && (
              <Ionicons name="open-outline" size={12} color={platform.color} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Header - Only shown if no hero image */}
        {!recipe.image_url && (
          <View style={dynamicStyles.header}>
            <View style={dynamicStyles.titleRow}>
              <Text style={dynamicStyles.title}>{recipe.title}</Text>
              <TouchableOpacity onPress={handleShare} style={dynamicStyles.shareButton}>
                <Ionicons
                  name="share-social-outline"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Platform Badge */}
            <View style={dynamicStyles.platformBadge}>
              <MaterialCommunityIcons
                name={platform.icon}
                size={16}
                color={platform.color}
              />
              <Text style={[dynamicStyles.platformLabel, { color: platform.color }]}>
                {platform.label}
              </Text>
              {recipe.source_url && (
                <TouchableOpacity
                  onPress={openSourceLink}
                  style={dynamicStyles.viewOriginal}
                >
                  <Text style={dynamicStyles.viewOriginalText}>View Original</Text>
                  <Ionicons
                    name="open-outline"
                    size={14}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Description Section */}
        {recipe.description && (
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={dynamicStyles.section}>
            <Text style={dynamicStyles.description}>{recipe.description}</Text>
          </Animated.View>
        )}

        {/* Status Badge */}
        {(isCooked || isArchived) && (
          <View style={[dynamicStyles.section, { paddingVertical: spacing.md }]}>
            {isCooked && (
              <View style={dynamicStyles.statusBadge}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={[dynamicStyles.statusText, { color: colors.success }]}>
                  COOKED
                </Text>
              </View>
            )}
            {isArchived && (
              <View style={dynamicStyles.statusBadge}>
                <MaterialCommunityIcons
                  name="archive"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={[dynamicStyles.statusText, { color: colors.textSecondary }]}
                >
                  ARCHIVED
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Serving Adjuster */}
        {recipe.servings && recipe.servings > 0 && (
          <View style={dynamicStyles.section}>
            <ServingAdjuster
              originalServings={recipe.servings}
              currentServings={currentServings || recipe.servings}
              onServingsChange={setCurrentServings}
            />
          </View>
        )}

        {/* Ingredients - Editorial list style */}
        <Animated.View entering={FadeInDown.delay(300).duration(300)} style={dynamicStyles.section}>
          <View style={dynamicStyles.ingredientsHeader}>
            <Text style={[dynamicStyles.sectionTitle, { marginBottom: 0 }]}>
              Ingredients
            </Text>
            {scaleFactor !== 1 && (
              <View style={dynamicStyles.scaledBadge}>
                <MaterialCommunityIcons name="scale" size={14} color={colors.info} />
                <Text style={dynamicStyles.scaledBadgeText}>SCALED</Text>
              </View>
            )}
          </View>
          <View style={dynamicStyles.ingredientsList}>
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              recipe.ingredients.map((ing, idx) => (
                <Animated.View
                  key={idx}
                  entering={FadeInDown.delay(350 + idx * 30).duration(300)}
                  style={dynamicStyles.ingredientItem}
                >
                  <View style={dynamicStyles.bulletPoint} />
                  <Text style={dynamicStyles.ingredientText}>
                    {getScaledIngredientDisplay(ing, scaleFactor)}
                  </Text>
                </Animated.View>
              ))
            ) : (
              <Text style={dynamicStyles.noContent}>No ingredients listed</Text>
            )}
          </View>
        </Animated.View>

        {/* Instructions - Editorial step layout */}
        <Animated.View entering={FadeInDown.delay(400).duration(300)} style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Instructions</Text>
          <View style={dynamicStyles.instructionsContainer}>
            {recipe.instructions && recipe.instructions.length > 0 ? (
              recipe.instructions.map((step, idx) => (
                <Animated.View
                  key={idx}
                  entering={FadeInDown.delay(450 + idx * 50).duration(300)}
                  style={dynamicStyles.instructionStep}
                >
                  <View style={dynamicStyles.stepNumber}>
                    <Text style={dynamicStyles.stepNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={dynamicStyles.instructionText}>{step}</Text>
                </Animated.View>
              ))
            ) : (
              <Text style={dynamicStyles.noContent}>No instructions provided</Text>
            )}
          </View>
        </Animated.View>

        {/* Rating & Notes */}
        <RecipeRatingNotes
          recipeId={recipeId}
          currentRating={recipe.rating}
          onRatingChange={(newRating) => {
            setRecipe((prev) => (prev ? { ...prev, rating: newRating } : null));
          }}
        />

        {/* Action Buttons - Prominent Start Cooking CTA */}
        <Animated.View entering={FadeInDown.delay(500).duration(300)} style={dynamicStyles.actionsSection}>
          {isWantToCook && (
            <>
              {/* Primary CTA - Start Cooking */}
              <Button
                mode="contained"
                onPress={handleStartCooking}
                disabled={isUpdating}
                icon="chef-hat"
                style={dynamicStyles.cookingButton}
                contentStyle={dynamicStyles.cookingButtonContent}
                buttonColor={colors.primary}
                labelStyle={{ fontSize: 16, fontWeight: '600' }}
              >
                Start Cooking
              </Button>

              <Button
                mode="contained"
                onPress={handleMarkCooked}
                loading={isUpdating}
                disabled={isUpdating}
                icon="check"
                style={dynamicStyles.primaryButton}
                contentStyle={dynamicStyles.buttonContent}
                buttonColor={colors.success}
              >
                Mark as Cooked
              </Button>

              <Button
                mode="outlined"
                onPress={handleAddToGroceryList}
                disabled={isUpdating}
                icon="cart"
                style={dynamicStyles.secondaryButton}
                contentStyle={dynamicStyles.buttonContent}
              >
                Add to Grocery List
              </Button>

              <Button
                mode="outlined"
                onPress={handleOpenCollectionModal}
                disabled={isUpdating}
                icon="folder-plus"
                style={dynamicStyles.secondaryButton}
                contentStyle={dynamicStyles.buttonContent}
              >
                Add to Collection
              </Button>

              <Button
                mode="text"
                onPress={handleArchive}
                disabled={isUpdating}
                icon="archive"
                textColor={colors.textSecondary}
                style={dynamicStyles.textButton}
              >
                Archive
              </Button>
            </>
          )}

          {(isCooked || isArchived) && (
            <Button
              mode="outlined"
              onPress={handleRestore}
              loading={isUpdating}
              disabled={isUpdating}
              icon="restore"
              style={dynamicStyles.secondaryButton}
              contentStyle={dynamicStyles.buttonContent}
            >
              Add Back to Queue
            </Button>
          )}

          <Button
            mode="text"
            onPress={handleDelete}
            disabled={isUpdating}
            icon="delete"
            textColor={colors.error}
            style={dynamicStyles.deleteButton}
          >
            Delete Recipe
          </Button>
        </Animated.View>

        <View style={dynamicStyles.footer} />
      </ScrollView>

      {/* Add to Collection Modal */}
      <Portal>
        <Modal
          visible={collectionModalVisible}
          onDismiss={() => setCollectionModalVisible(false)}
          contentContainerStyle={dynamicStyles.collectionModal}
        >
          <Text style={dynamicStyles.collectionModalTitle}>Add to Collection</Text>

          {collections.length === 0 ? (
            <View style={dynamicStyles.noCollectionsContainer}>
              <MaterialCommunityIcons
                name="folder-plus"
                size={48}
                color={colors.textTertiary}
              />
              <Text style={dynamicStyles.noCollectionsText}>
                No collections yet. Create one from the Recipes tab.
              </Text>
            </View>
          ) : (
            <>
              <FlatList
                data={collections}
                keyExtractor={(item) => item.id}
                style={dynamicStyles.collectionList}
                renderItem={({ item }) => {
                  const isInCollection = recipeCollections.includes(item.id);
                  return (
                    <TouchableOpacity
                      style={[
                        dynamicStyles.collectionOption,
                        selectedCollectionId === item.id && dynamicStyles.collectionOptionSelected,
                        isInCollection && dynamicStyles.collectionOptionDisabled,
                      ]}
                      onPress={() => !isInCollection && setSelectedCollectionId(item.id)}
                      disabled={isInCollection}
                    >
                      <View style={[dynamicStyles.collectionOptionIcon, { backgroundColor: item.color + '20' }]}>
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={20}
                          color={item.color}
                        />
                      </View>
                      <View style={dynamicStyles.collectionOptionInfo}>
                        <Text style={dynamicStyles.collectionOptionName}>{item.name}</Text>
                        <Text style={dynamicStyles.collectionOptionCount}>
                          {item.recipe_count} recipe{item.recipe_count !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      {isInCollection ? (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={24}
                          color={colors.success}
                        />
                      ) : (
                        <RadioButton
                          value={item.id}
                          status={selectedCollectionId === item.id ? 'checked' : 'unchecked'}
                          onPress={() => setSelectedCollectionId(item.id)}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />

              <View style={dynamicStyles.collectionModalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setCollectionModalVisible(false)}
                  style={dynamicStyles.collectionModalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAddToCollection}
                  loading={isAddingToCollection}
                  disabled={!selectedCollectionId || isAddingToCollection}
                  style={dynamicStyles.collectionModalButton}
                >
                  Add
                </Button>
              </View>
            </>
          )}
        </Modal>
      </Portal>
    </Screen>
  );
}
