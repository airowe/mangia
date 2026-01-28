/**
 * RecipeDetailScreen
 *
 * Editorial recipe detail screen with hero image, metadata pills,
 * ingredient checkboxes, and prominent "Start Cooking" CTA.
 *
 * Reference: /ui-redesign/screens/recipe_detail.html
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  useRoute,
  useNavigation,
  type RouteProp,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Portal, Modal, RadioButton } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '../components/Screen';
import { mangiaColors } from '../theme/tokens/colors';

import { Recipe, RecipeSourceType, RecipeIngredient } from '../models/Recipe';
import { RecipeRatingNotes } from '../components/RecipeRatingNotes';
import {
  fetchRecipeById,
  markAsCooked,
  archiveRecipe,
  deleteRecipe,
  restoreRecipe,
  RecipeWithIngredients,
} from '../lib/recipeService';
// ServingAdjuster removed - scaling now integrated into IngredientList
import { getScaledIngredientDisplay } from '../utils/recipeScaling';
import { CollectionWithCount } from '../models/Collection';
import {
  fetchCollections,
  addRecipeToCollection,
  getCollectionsForRecipe,
} from '../lib/collectionService';
import { shareRecipe, shareIngredients } from '../lib/recipeSharing';

// Recipe components
import {
  RecipeHero,
  MetadataPills,
  IngredientList,
  InstructionsPreview,
  StartCookingButton,
} from '../components/recipe';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type RecipeDetailScreenRouteProp = RouteProp<
  { params: { recipeId: string } },
  'params'
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
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);

  const loadRecipe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRecipeById(recipeId);
      setRecipe(data);
    } catch (err) {
      console.error('Failed to load recipe:', err);
      setError('Failed to load recipe. Please try again.');
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

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleShare = async () => {
    if (!recipe) return;

    Alert.alert('Share Recipe', 'What would you like to share?', [
      {
        text: 'Full Recipe',
        onPress: async () => {
          try {
            await shareRecipe(recipe);
          } catch (error) {
            console.error('Error sharing recipe:', error);
          }
        },
      },
      {
        text: 'Ingredients Only',
        onPress: async () => {
          try {
            await shareIngredients(recipe);
          } catch (error) {
            console.error('Error sharing ingredients:', error);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleMore = () => {
    setMoreMenuVisible(true);
  };

  const openSourceLink = () => {
    if (recipe?.source_url) {
      Linking.openURL(recipe.source_url);
    }
  };

  // Mark recipe as cooked
  const handleMarkCooked = useCallback(async () => {
    if (!recipe) return;

    Alert.alert('Mark as Cooked', `Did you make "${recipe.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: "Yes, I made it!",
        onPress: async () => {
          setIsUpdating(true);
          try {
            await markAsCooked(recipe.id);
            Alert.alert('Delicious!', 'Recipe marked as cooked. Nice work!', [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]);
          } catch (error) {
            Alert.alert('Error', 'Failed to update recipe');
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
      Alert.alert('Error', 'Failed to archive recipe');
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
      setRecipe({ ...recipe, status: 'want_to_cook' });
      Alert.alert('Restored', 'Recipe added back to your queue');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore recipe');
    } finally {
      setIsUpdating(false);
    }
  }, [recipe]);

  // Delete recipe
  const handleDelete = useCallback(() => {
    if (!recipe) return;

    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await deleteRecipe(recipe.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recipe');
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
    navigation.navigate('GroceryListScreen', { recipeIds: [recipe.id] });
  }, [recipe, navigation]);

  // Start cooking mode
  const handleStartCooking = useCallback(() => {
    if (!recipe) return;
    if (!recipe.instructions || recipe.instructions.length === 0) {
      Alert.alert('No Instructions', "This recipe doesn't have any instructions to follow.");
      return;
    }
    navigation.navigate('CookingModeScreen', { recipeId: recipe.id });
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
      console.error('Error loading collections:', error);
      Alert.alert('Error', 'Failed to load collections');
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
        'Added!',
        `"${recipe.title}" has been added to "${selectedCollection?.name || 'collection'}".`
      );
      setCollectionModalVisible(false);
    } catch (error: any) {
      if (error.message?.includes('already in this collection')) {
        Alert.alert('Already Added', 'This recipe is already in that collection.');
      } else {
        Alert.alert('Error', 'Failed to add recipe to collection');
      }
    } finally {
      setIsAddingToCollection(false);
    }
  }, [recipe, selectedCollectionId, collections]);

  // Get category for display
  const getCategory = () => {
    if (recipe?.meal_type) {
      return recipe.meal_type.charAt(0).toUpperCase() + recipe.meal_type.slice(1);
    }
    return 'Recipe';
  };

  // Loading state
  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={mangiaColors.terracotta} />
        </View>
      </Screen>
    );
  }

  // Error state
  if (error || !recipe) {
    return (
      <Screen>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Recipe not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRecipe}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const isWantToCook = recipe.status === 'want_to_cook';
  const isCooked = recipe.status === 'cooked';
  const isArchived = recipe.status === 'archived';
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  const hasInstructions = recipe.instructions && recipe.instructions.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Section */}
        <RecipeHero
          imageUrl={recipe.image_url}
          title={recipe.title}
          author={recipe.source_type === 'manual' ? 'My Recipe' : undefined}
          category={getCategory()}
          onBack={handleBack}
          onSave={handleOpenCollectionModal}
          onMore={handleMore}
        />

        {/* Content Area - Overlaps Hero */}
        <View style={styles.contentArea}>
          {/* Metadata Pills */}
          <MetadataPills
            cookTime={totalTime}
            servings={recipe.servings}
          />

          {/* Description */}
          {recipe.description && (
            <Animated.View
              entering={FadeInDown.delay(150).duration(300)}
              style={styles.descriptionSection}
            >
              <Text style={styles.descriptionText}>{recipe.description}</Text>
            </Animated.View>
          )}

          {/* Status Badge */}
          {(isCooked || isArchived) && (
            <Animated.View
              entering={FadeInDown.delay(180).duration(300)}
              style={styles.statusSection}
            >
              {isCooked && (
                <View style={[styles.statusBadge, styles.statusBadgeCooked]}>
                  <Feather name="check-circle" size={16} color={mangiaColors.sage} />
                  <Text style={[styles.statusText, { color: mangiaColors.sage }]}>
                    COOKED
                  </Text>
                </View>
              )}
              {isArchived && (
                <View style={styles.statusBadge}>
                  <Feather name="archive" size={16} color={mangiaColors.taupe} />
                  <Text style={[styles.statusText, { color: mangiaColors.taupe }]}>
                    ARCHIVED
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Ingredients with integrated scale button */}
          <IngredientList
            ingredients={recipe.ingredients || []}
            scaleFactor={scaleFactor}
            originalServings={recipe.servings}
            onScaleChange={(scale) => {
              if (recipe.servings) {
                setCurrentServings(Math.round(recipe.servings * scale));
              }
            }}
          />

          {/* Instructions Preview */}
          {hasInstructions && (
            <InstructionsPreview instructions={recipe.instructions} />
          )}

          {/* Rating & Notes */}
          <View style={styles.ratingSection}>
            <RecipeRatingNotes
              recipeId={recipeId}
              currentRating={recipe.rating}
              onRatingChange={(newRating) => {
                setRecipe((prev) => (prev ? { ...prev, rating: newRating } : null));
              }}
            />
          </View>

          {/* Action Buttons */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(300)}
            style={styles.actionsSection}
          >
            {isWantToCook && (
              <>
                <Button
                  mode="contained"
                  onPress={handleMarkCooked}
                  loading={isUpdating}
                  disabled={isUpdating}
                  icon="check"
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                  buttonColor={mangiaColors.sage}
                >
                  Mark as Cooked
                </Button>

                <Button
                  mode="outlined"
                  onPress={handleAddToGroceryList}
                  disabled={isUpdating}
                  icon="cart"
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                  textColor={mangiaColors.dark}
                >
                  Add to Grocery List
                </Button>

                <Button
                  mode="text"
                  onPress={handleArchive}
                  disabled={isUpdating}
                  icon="archive"
                  textColor={mangiaColors.taupe}
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
                icon="refresh-cw"
                style={styles.actionButton}
                contentStyle={styles.buttonContent}
                textColor={mangiaColors.dark}
              >
                Add Back to Queue
              </Button>
            )}

            <Button
              mode="text"
              onPress={handleDelete}
              disabled={isUpdating}
              icon="trash-2"
              textColor="#D32F2F"
              style={styles.deleteButton}
            >
              Delete Recipe
            </Button>
          </Animated.View>

          {/* Footer spacer for floating button */}
          <View style={styles.footerSpacer} />
        </View>
      </ScrollView>

      {/* Floating Start Cooking Button */}
      {isWantToCook && hasInstructions && (
        <StartCookingButton
          onPress={handleStartCooking}
          disabled={isUpdating}
        />
      )}

      {/* More Menu Modal */}
      <Portal>
        <Modal
          visible={moreMenuVisible}
          onDismiss={() => setMoreMenuVisible(false)}
          contentContainerStyle={styles.moreMenuModal}
        >
          <Text style={styles.modalTitle}>Options</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => {
            setMoreMenuVisible(false);
            handleShare();
          }}>
            <Feather name="share" size={20} color={mangiaColors.dark} />
            <Text style={styles.menuItemText}>Share Recipe</Text>
          </TouchableOpacity>

          {recipe.source_url && (
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setMoreMenuVisible(false);
              openSourceLink();
            }}>
              <Feather name="external-link" size={20} color={mangiaColors.dark} />
              <Text style={styles.menuItemText}>View Original</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={() => {
            setMoreMenuVisible(false);
            handleOpenCollectionModal();
          }}>
            <Feather name="folder-plus" size={20} color={mangiaColors.dark} />
            <Text style={styles.menuItemText}>Add to Collection</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemCancel]}
            onPress={() => setMoreMenuVisible(false)}
          >
            <Text style={styles.menuItemCancelText}>Cancel</Text>
          </TouchableOpacity>
        </Modal>
      </Portal>

      {/* Add to Collection Modal */}
      <Portal>
        <Modal
          visible={collectionModalVisible}
          onDismiss={() => setCollectionModalVisible(false)}
          contentContainerStyle={styles.collectionModal}
        >
          <Text style={styles.modalTitle}>Add to Collection</Text>

          {collections.length === 0 ? (
            <View style={styles.noCollectionsContainer}>
              <Feather name="folder-plus" size={48} color={mangiaColors.taupe} />
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
                      <View style={[styles.collectionIcon, { backgroundColor: item.color + '20' }]}>
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={20}
                          color={item.color}
                        />
                      </View>
                      <View style={styles.collectionInfo}>
                        <Text style={styles.collectionName}>{item.name}</Text>
                        <Text style={styles.collectionCount}>
                          {item.recipe_count} recipe{item.recipe_count !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      {isInCollection ? (
                        <Feather name="check-circle" size={24} color={mangiaColors.sage} />
                      ) : (
                        <RadioButton
                          value={item.id}
                          status={selectedCollectionId === item.id ? 'checked' : 'unchecked'}
                          onPress={() => setSelectedCollectionId(item.id)}
                          color={mangiaColors.terracotta}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setCollectionModalVisible(false)}
                  style={styles.modalButton}
                  textColor={mangiaColors.dark}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAddToCollection}
                  loading={isAddingToCollection}
                  disabled={!selectedCollectionId || isAddingToCollection}
                  style={styles.modalButton}
                  buttonColor={mangiaColors.terracotta}
                >
                  Add
                </Button>
              </View>
            </>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mangiaColors.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontFamily: 'System',
    fontSize: 16,
    color: '#D32F2F',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: mangiaColors.terracotta,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
  },
  retryButtonText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },

  // Content Area
  contentArea: {
    backgroundColor: mangiaColors.cream,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 10,
  },
  descriptionSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  descriptionText: {
    fontFamily: 'System',
    fontSize: 16,
    color: mangiaColors.brown,
    lineHeight: 24,
  },
  statusSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: mangiaColors.creamDark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusBadgeCooked: {
    backgroundColor: `${mangiaColors.sage}20`,
  },
  statusText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  ratingSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },

  // Actions
  actionsSection: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    borderRadius: 999,
    borderColor: mangiaColors.creamDark,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  textButton: {
    alignSelf: 'center',
  },
  deleteButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  footerSpacer: {
    height: 100,
  },

  // More Menu Modal
  moreMenuModal: {
    backgroundColor: 'white',
    margin: 24,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '400',
    color: mangiaColors.dark,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: mangiaColors.creamDark,
  },
  menuItemText: {
    fontFamily: 'System',
    fontSize: 16,
    color: mangiaColors.dark,
  },
  menuItemCancel: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: 8,
  },
  menuItemCancelText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: mangiaColors.taupe,
  },

  // Collection Modal
  collectionModal: {
    backgroundColor: 'white',
    margin: 24,
    padding: 24,
    borderRadius: 16,
    maxHeight: '70%',
  },
  noCollectionsContainer: {
    alignItems: 'center',
    padding: 48,
  },
  noCollectionsText: {
    fontFamily: 'System',
    fontSize: 14,
    color: mangiaColors.taupe,
    textAlign: 'center',
    marginTop: 16,
  },
  collectionList: {
    maxHeight: 300,
  },
  collectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: mangiaColors.cream,
  },
  collectionOptionSelected: {
    backgroundColor: `${mangiaColors.terracotta}15`,
    borderWidth: 1,
    borderColor: mangiaColors.terracotta,
  },
  collectionOptionDisabled: {
    opacity: 0.6,
  },
  collectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  collectionName: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500',
    color: mangiaColors.dark,
  },
  collectionCount: {
    fontFamily: 'System',
    fontSize: 12,
    color: mangiaColors.taupe,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    minWidth: 80,
    borderRadius: 999,
  },
});
