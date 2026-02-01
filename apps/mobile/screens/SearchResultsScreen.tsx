import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RecipeLibraryStackParamList } from '../navigation/RecipeLibraryStack';
import { Screen } from '../components/Screen';
import { RecipeList } from '../components/RecipeList';
import { Button, Text, Modal, Portal, ActivityIndicator } from 'react-native-paper';
import { fetchAllRecipes } from '../lib/recipes';
import { Recipe } from '../models/Recipe';
import { fetchCollections, addRecipesToCollection } from '../lib/collectionService';
import { CollectionWithCount } from '../models/Collection';

type SearchResultsRouteProp = RouteProp<{ params: { searchQuery: string } }, 'params'>;

export function SearchResultsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RecipeLibraryStackParamList, 'SearchResults'>>();
  const route = useRoute<SearchResultsRouteProp>();
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<CollectionWithCount[]>([]);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(false);

  const loadRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAllRecipes();
      setRecipes(response.data);
    } catch (error) {
      console.error('Failed to load recipes:', error);
      setError('Failed to load recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleSearch = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAllRecipes({ search: query });
      setRecipes(response.data);
    } catch (error) {
      console.error('Failed to load recipes:', error);
      setError('Failed to load recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchQuery = route.params?.searchQuery || '';

  const handleAddRecipes = useCallback(async () => {
    setLoadingCollections(true);
    try {
      const data = await fetchCollections();
      setCollections(data);
      setShowCollectionPicker(true);
    } catch (err) {
      console.error('Failed to load collections:', err);
      Alert.alert('Error', 'Failed to load collections. Please try again.');
    } finally {
      setLoadingCollections(false);
    }
  }, []);

  const handleCollectionSelect = useCallback(async (collectionId: string) => {
    setShowCollectionPicker(false);
    setIsAdding(true);
    try {
      await addRecipesToCollection(collectionId, Array.from(selectedRecipes));
      Alert.alert('Success', 'Selected recipes have been added to your collection.');
      navigation.goBack();
    } catch (err) {
      console.error('Failed to add recipes:', err);
      Alert.alert('Error', 'Failed to add recipes. Please try again.');
    } finally {
      setIsAdding(false);
    }
  }, [navigation, selectedRecipes]);

  const toggleRecipeSelection = useCallback((recipeId: string) => {
    setSelectedRecipes(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(recipeId)) {
        newSelection.delete(recipeId);
      } else {
        newSelection.add(recipeId);
      }
      return newSelection;
    });
  }, []);

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Search Results for "{searchQuery}"
          </Text>
          <Button
            mode="contained"
            onPress={handleAddRecipes}
            loading={isAdding || loadingCollections}
            disabled={selectedRecipes.size === 0 || isAdding || loadingCollections}
            style={styles.addButton}
          >
            Add {selectedRecipes.size > 0 ? `(${selectedRecipes.size})` : ''} to My Recipes
          </Button>
        </View>

        <RecipeList
          recipes={recipes}
          onPressRecipe={(recipe) => {
            // Toggle selection on press
            if (recipe.id) {
              toggleRecipeSelection(recipe.id);
            }
          }}
          selectedRecipeIds={selectedRecipes}
          showMealType={true}
          style={styles.recipeList}
        />
      </View>

      <Portal>
        <Modal
          visible={showCollectionPicker}
          onDismiss={() => setShowCollectionPicker(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Choose a Collection
          </Text>
          {loadingCollections ? (
            <ActivityIndicator style={styles.modalLoading} />
          ) : collections.length === 0 ? (
            <Text style={styles.modalEmpty}>
              No collections found. Create a collection first.
            </Text>
          ) : (
            <FlatList
              data={collections}
              keyExtractor={(item) => item.id}
              style={styles.collectionList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.collectionItem}
                  onPress={() => handleCollectionSelect(item.id)}
                >
                  <Text style={styles.collectionName}>{item.name}</Text>
                  <Text style={styles.collectionCount}>
                    {item.recipeCount} recipe{item.recipeCount !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
          <Button
            mode="text"
            onPress={() => setShowCollectionPicker(false)}
            style={styles.modalCancel}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    flex: 1,
    marginBottom: 8,
  },
  addButton: {
    marginLeft: 8,
    minWidth: 200,
  },
  recipeList: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 24,
    borderRadius: 12,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  modalLoading: {
    marginVertical: 24,
  },
  modalEmpty: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 24,
  },
  collectionList: {
    maxHeight: 300,
  },
  collectionItem: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '500',
  },
  collectionCount: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  modalCancel: {
    marginTop: 8,
  },
});
