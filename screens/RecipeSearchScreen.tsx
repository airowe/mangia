import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  Keyboard 
} from 'react-native';
import { fetchRecipes, searchRecipes, addRecipe } from '../lib/recipes';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RecipeLibraryStackParamList } from '../navigation/RecipeLibraryStack';
import { Recipe } from '../models/Recipe';
import { Screen } from '../components/Screen';
import { RecipeList } from '../components/RecipeList';
import { colors } from '../theme/colors';
import { TextInput as PaperTextInput, Button } from 'react-native-paper';


export default function RecipeSearchScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RecipeLibraryStackParamList, 'RecipeSearch'>>();
  const [mealFilter, setMealFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);

  const loadRecipes = useCallback(async (searchText: string = search, showLoading: boolean = true) => {
    try {
      if (showLoading) setLoading(true);
      let data: Recipe[] = [];
      
      if (searchText && searchText.trim()) {
        // Only search if there's a search query
        const response = await searchRecipes({ 
          query: searchText,
          meal_type: mealFilter 
        });
        data = response.data;
      } else {
        // Otherwise, fetch all recipes (optionally filtered by meal type)
        const response = await fetchRecipes({ 
          meal_type: mealFilter 
        });
        data = response.data;
      }
      
      setRecipes(data);
      return data;
    } catch (error) {
      console.error('Failed to load recipes:', error);
      return [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mealFilter, search]);

  const handleSearch = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    Keyboard.dismiss(); // Dismiss the keyboard
    
    if (trimmedQuery) {
      setSearch(trimmedQuery);
      setIsSearching(true);
      setSelectedRecipes(new Set()); // Clear previous selections
      loadRecipes(trimmedQuery);
    } else {
      setIsSearching(false);
      setSearch('');
      loadRecipes('');
    }
  }, [searchQuery, loadRecipes]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadRecipes(search, false);
  }, [loadRecipes, search]);

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

  const handleAddSelectedRecipes = useCallback(async () => {
    if (selectedRecipes.size === 0) return;
    
    try {
      setLoading(true);
      const selectedRecipesArray = Array.from(selectedRecipes);
      const recipesToAdd = recipes.filter(recipe => 
        recipe.id && selectedRecipes.has(recipe.id)
      );
      
      // Add each selected recipe to the user's collection
      const addPromises = recipesToAdd.map(recipe => {
        // Create a copy of the recipe without the id since we want to create a new one
        const { id, ...recipeData } = recipe;
        return addRecipe(recipeData);
      });
      
      await Promise.all(addPromises);
      
      Alert.alert('Success', `Added ${selectedRecipes.size} recipes to your collection`);
      setSelectedRecipes(new Set());
      
      // Refresh the recipes list to show the newly added recipes
      loadRecipes(search);
    } catch (error) {
      console.error('Failed to add recipes:', error);
      Alert.alert('Error', 'Failed to add recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedRecipes, recipes, search, loadRecipes]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);
  
  // Reset search when component mounts
  useEffect(() => {
    setSearch('');
    setSearchQuery('');
  }, []);

  const groupedRecipes = React.useMemo(() => {
    // If we're searching, show all results in a single category
    if (search) {
      return { 'Search Results': recipes };
    }
    
    // Otherwise, group by meal type
    return recipes.reduce<Record<string, Recipe[]>>((acc, recipe) => {
      const category = (recipe.meal_type && recipe.meal_type.length > 0) 
        ? recipe.meal_type.charAt(0).toUpperCase() + recipe.meal_type.slice(1) 
        : 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(recipe);
      return acc;
    }, {});
  }, [recipes, search]);

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <PaperTextInput
              mode="outlined"
              placeholder="Search recipes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              style={styles.input}
              right={
                <PaperTextInput.Icon 
                  icon="magnify" 
                  onPress={handleSearch}
                />
              }
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              theme={{
                colors: {
                  primary: colors.primary,
                  placeholder: colors.textSecondary,
                  text: colors.text,
                  background: colors.background,
                },
                roundness: 8,
              }}
            />
            {isSearching && (
              <Button 
                mode="outlined" 
                onPress={() => {
                  setSearchQuery('');
                  setSearch('');
                  setIsSearching(false);
                  loadRecipes('');
                }}
                style={styles.clearButton}
              >
                Clear
              </Button>
            )}
          </View>
          {isSearching && selectedRecipes.size > 0 && (
            <View style={styles.addButtonContainer}>
              <Button 
                mode="contained" 
                onPress={handleAddSelectedRecipes}
                style={styles.addButton}
                icon="plus"
              >
                Add {selectedRecipes.size} to My Recipes
              </Button>
            </View>
          )}
          {/* <DropDownPicker
            items={[
              { label: 'All Meals', value: '' },
              { label: 'Breakfast', value: 'breakfast' },
              { label: 'Lunch', value: 'lunch' },
              { label: 'Dinner', value: 'dinner' },
              { label: 'Snack', value: 'snack' },
              { label: 'Dessert', value: 'dessert' },
            ]}
            open={open}
            value={mealFilter}
            setOpen={setOpen}
            setValue={setMealFilter}
            placeholder="Filter by meal type"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedItemLabelStyle={styles.selectedItemLabel}
            listMode="SCROLLVIEW"
            zIndex={1000}
            zIndexInverse={1000}
          /> */}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isSearching ? (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>
              Search Results for "{search}"
            </Text>
            <RecipeList
              recipes={recipes}
              onPressRecipe={(recipe) => {
                if (recipe.id) {
                  toggleRecipeSelection(recipe.id);
                }
              }}
              selectedRecipeIds={selectedRecipes}
              showMealType={true}
              style={styles.recipeList}
            />
          </View>
        ) : (
          <RecipeList
            recipes={recipes}
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onPressRecipe={(recipe: Recipe) => {
              if (recipe.id) {
                navigation.navigate('RecipeDetail', { id: recipe.id });
              }
            }}
            showMealType={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No recipes found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
              </View>
            }
          />
        )}
      </View>

    </Screen>
  );
}

const styles = StyleSheet.create({
  searchResultsContainer: {
    flex: 1,
    padding: 16,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
  },
  addButtonContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  addButton: {
    alignSelf: 'flex-start',
  },
  clearButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  recipeList: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
  },
  searchInputContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: colors.card,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    color: colors.text,
    minWidth: 160,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    color: colors.text,
    minWidth: 160,
    backgroundColor: colors.card,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownText: {
    color: colors.text,
    fontSize: 16,
  },
  dropdownPlaceholder: {
    color: colors.textSecondary,
  },
  selectedItemLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  categoryHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recipeImage: {
    width: 100,
    height: 100,
  },
  recipeInfo: {
    flex: 1,
    padding: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  recipeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  recipeMeta: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 24,
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
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
