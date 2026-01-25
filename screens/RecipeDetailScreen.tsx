import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Linking,
  Alert,
  FlatList,
} from "react-native";
import {
  useRoute,
  useNavigation,
  type RouteProp,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Portal, Modal, RadioButton } from "react-native-paper";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";
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

// Platform icons and colors
const PLATFORM_CONFIG: Record<
  RecipeSourceType,
  {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
    label: string;
  }
> = {
  tiktok: { icon: "music-note", color: "#000000", label: "TikTok" },
  youtube: { icon: "youtube", color: "#FF0000", label: "YouTube" },
  instagram: { icon: "instagram", color: "#E4405F", label: "Instagram" },
  blog: { icon: "web", color: "#4CAF50", label: "Blog" },
  manual: { icon: "pencil", color: colors.primary, label: "Manual" },
};

export default function RecipeDetailScreen() {
  const route = useRoute<RecipeDetailScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { recipeId } = route.params;

  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [collections, setCollections] = useState<CollectionWithCount[]>([]);
  const [recipeCollections, setRecipeCollections] = useState<string[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
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

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !recipe) {
    return (
      <Screen>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Recipe not found"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRecipe}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const isWantToCook = recipe.status === "want_to_cook";
  const isCooked = recipe.status === "cooked";
  const isArchived = recipe.status === "archived";

  return (
    <Screen noPadding>
      <ScrollView style={styles.container}>
        {/* Recipe Image */}
        {recipe.image_url ? (
          <Image
            source={{ uri: recipe.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialCommunityIcons
              name="food"
              size={80}
              color={colors.textTertiary}
            />
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{recipe.title}</Text>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Ionicons
                name="share-social-outline"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Platform Badge */}
          <View style={styles.platformBadge}>
            <MaterialCommunityIcons
              name={platform.icon}
              size={16}
              color={platform.color}
            />
            <Text style={[styles.platformLabel, { color: platform.color }]}>
              {platform.label}
            </Text>
            {recipe.source_url && (
              <TouchableOpacity
                onPress={openSourceLink}
                style={styles.viewOriginal}
              >
                <Text style={styles.viewOriginalText}>View Original</Text>
                <Ionicons
                  name="open-outline"
                  size={14}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            {recipe.prep_time && recipe.prep_time > 0 && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="timer-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>
                  Prep: {recipe.prep_time} min
                </Text>
              </View>
            )}
            {recipe.cook_time && recipe.cook_time > 0 && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="flame-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>
                  Cook: {recipe.cook_time} min
                </Text>
              </View>
            )}
            {recipe.servings && recipe.servings > 0 && (
              <View style={styles.metaItem}>
                <Ionicons
                  name="people-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>{recipe.servings} servings</Text>
              </View>
            )}
          </View>

          {/* Status Badge */}
          {isCooked && (
            <View style={styles.statusBadge}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color={colors.success}
              />
              <Text style={[styles.statusText, { color: colors.success }]}>
                Cooked
              </Text>
            </View>
          )}
          {isArchived && (
            <View style={styles.statusBadge}>
              <MaterialCommunityIcons
                name="archive"
                size={16}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.statusText, { color: colors.textSecondary }]}
              >
                Archived
              </Text>
            </View>
          )}
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Ingredients ({recipe.ingredients?.length || 0})
          </Text>
          <View style={styles.ingredientsList}>
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              recipe.ingredients.map((ing, idx) => (
                <View key={idx} style={styles.ingredientItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.ingredientText}>
                    {ing.quantity ? `${ing.quantity} ` : ""}
                    {ing.unit ? `${ing.unit} ` : ""}
                    {ing.name}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noContent}>No ingredients listed</Text>
            )}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <View style={styles.instructionsContainer}>
            {recipe.instructions && recipe.instructions.length > 0 ? (
              recipe.instructions.map((step, idx) => (
                <View key={idx} style={styles.instructionStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{step}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noContent}>No instructions provided</Text>
            )}
          </View>
        </View>

        {/* Rating & Notes */}
        <RecipeRatingNotes
          recipeId={recipeId}
          currentRating={recipe.rating}
          onRatingChange={(newRating) => {
            setRecipe((prev) => (prev ? { ...prev, rating: newRating } : null));
          }}
        />

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {isWantToCook && (
            <>
              <Button
                mode="contained"
                onPress={handleStartCooking}
                disabled={isUpdating}
                icon="chef-hat"
                style={styles.cookingButton}
                contentStyle={styles.buttonContent}
                buttonColor={colors.success}
              >
                Start Cooking
              </Button>

              <Button
                mode="contained"
                onPress={handleMarkCooked}
                loading={isUpdating}
                disabled={isUpdating}
                icon="check"
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
              >
                Mark as Cooked
              </Button>

              <Button
                mode="outlined"
                onPress={handleAddToGroceryList}
                disabled={isUpdating}
                icon="cart"
                style={styles.secondaryButton}
                contentStyle={styles.buttonContent}
              >
                Add to Grocery List
              </Button>

              <Button
                mode="outlined"
                onPress={handleOpenCollectionModal}
                disabled={isUpdating}
                icon="folder-plus"
                style={styles.secondaryButton}
                contentStyle={styles.buttonContent}
              >
                Add to Collection
              </Button>

              <Button
                mode="text"
                onPress={handleArchive}
                disabled={isUpdating}
                icon="archive"
                textColor={colors.textSecondary}
                style={styles.textButton}
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
              style={styles.secondaryButton}
              contentStyle={styles.buttonContent}
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
            style={styles.deleteButton}
          >
            Delete Recipe
          </Button>
        </View>

        <View style={styles.footer} />
      </ScrollView>

      {/* Add to Collection Modal */}
      <Portal>
        <Modal
          visible={collectionModalVisible}
          onDismiss={() => setCollectionModalVisible(false)}
          contentContainerStyle={styles.collectionModal}
        >
          <Text style={styles.collectionModalTitle}>Add to Collection</Text>

          {collections.length === 0 ? (
            <View style={styles.noCollectionsContainer}>
              <MaterialCommunityIcons
                name="folder-plus"
                size={48}
                color={colors.textTertiary}
              />
              <Text style={styles.noCollectionsText}>
                No collections yet. Create one from the Recipes tab.
              </Text>
            </View>
          ) : (
            <>
              <FlatList
                data={collections}
                keyExtractor={(item) => item.id}
                style={styles.collectionList}
                renderItem={({ item }) => {
                  const isInCollection = recipeCollections.includes(item.id);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.collectionOption,
                        selectedCollectionId === item.id && styles.collectionOptionSelected,
                        isInCollection && styles.collectionOptionDisabled,
                      ]}
                      onPress={() => !isInCollection && setSelectedCollectionId(item.id)}
                      disabled={isInCollection}
                    >
                      <View style={[styles.collectionOptionIcon, { backgroundColor: item.color + '20' }]}>
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={20}
                          color={item.color}
                        />
                      </View>
                      <View style={styles.collectionOptionInfo}>
                        <Text style={styles.collectionOptionName}>{item.name}</Text>
                        <Text style={styles.collectionOptionCount}>
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

              <View style={styles.collectionModalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setCollectionModalVisible(false)}
                  style={styles.collectionModalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAddToCollection}
                  loading={isAddingToCollection}
                  disabled={!selectedCollectionId || isAddingToCollection}
                  style={styles.collectionModalButton}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  image: {
    width: "100%",
    height: 250,
  },
  placeholderImage: {
    width: "100%",
    height: 200,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  shareButton: {
    padding: 8,
    marginLeft: 8,
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  platformLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  viewOriginal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 12,
  },
  viewOriginalText: {
    fontSize: 14,
    color: colors.primary,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  ingredientsList: {
    marginLeft: 4,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
    marginRight: 12,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  instructionsContainer: {
    gap: 16,
  },
  instructionStep: {
    flexDirection: "row",
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  noContent: {
    fontStyle: "italic",
    color: colors.textSecondary,
  },
  actionsSection: {
    padding: 20,
    backgroundColor: colors.card,
    marginTop: 8,
    gap: 12,
  },
  cookingButton: {
    borderRadius: 8,
    marginBottom: 8,
  },
  primaryButton: {
    borderRadius: 8,
  },
  secondaryButton: {
    borderRadius: 8,
    borderColor: colors.primary,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  textButton: {
    alignSelf: "center",
  },
  deleteButton: {
    alignSelf: "center",
    marginTop: 8,
  },
  footer: {
    height: 40,
  },
  collectionModal: {
    backgroundColor: colors.card,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '70%',
  },
  collectionModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  collectionList: {
    maxHeight: 300,
  },
  collectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  collectionOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  collectionOptionCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  collectionModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  collectionModalButton: {
    minWidth: 80,
  },
  noCollectionsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noCollectionsText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
});
