import React, { useEffect, useState, useCallback } from 'react';
import {
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { fetchRecipes, fetchRecipeById, searchRecipes } from '../lib/recipes';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RecipeLibraryStackParamList } from '../navigation/RecipeLibraryStack';
import { Recipe } from '../models/Recipe';
import { Screen } from '../components/Screen';
import { colors } from '../theme/colors';
import { TextInput as PaperTextInput } from 'react-native-paper';


export default function RecipeCatalogScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RecipeLibraryStackParamList, 'RecipeCatalog'>>();
  const [mealFilter, setMealFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const loadRecipes = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      let data: Recipe[] = [];
      
      if (search.trim()) {
        // Only search if there's a search query
        data = await searchRecipes({ 
          query: search,
          meal_type: mealFilter 
        });
      } else {
        // Otherwise, fetch all recipes (optionally filtered by meal type)
        data = await fetchRecipes({ 
          meal_type: mealFilter 
        });
      }
      
      setRecipes(data);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, mealFilter]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim() !== '' || search !== searchQuery) {
      setSearch(searchQuery);
      setRefreshing(true);
      loadRecipes();
    }
  }, [searchQuery, search, loadRecipes]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecipes(false);
  };

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);
  
  // Reset search when component mounts
  useEffect(() => {
    setSearch('');
    setSearchQuery('');
  }, []);

  const grouped = React.useMemo(() => {
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
  }, [recipes]);

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
          </View>
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
        ) : (
          <FlatList
            data={Object.entries(grouped)}
            keyExtractor={([category]) => category}
            renderItem={({ item: [category, items] }) => (
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryHeader}>{category}</Text>
                {items.map((recipe) => {
                  const imageUrl = recipe.image_url;
                  return (
                    <TouchableOpacity
                      key={recipe.id}
                      style={styles.recipeCard}
                      onPress={() => {
                        if (recipe.id) {
                          navigation.navigate('RecipeDetail', { id: recipe.id });
                        }
                      }}
                    >
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.recipeImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.placeholderImage}>
                          <Text style={styles.placeholderText}>No Image</Text>
                        </View>
                      )}
                      <View style={styles.recipeInfo}>
                        <Text style={styles.recipeTitle} numberOfLines={1}>
                          {recipe.title}
                        </Text>
                        {recipe.description && (
                          <Text style={styles.recipeDescription} numberOfLines={2}>
                            {recipe.description}
                          </Text>
                        )}
                        {recipe.cook_time && (
                          <Text style={styles.recipeMeta}>
                            {recipe.cook_time} min • {recipe.servings || 2} servings
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.listContent}
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
  placeholderImage: {
    width: 100,
    height: 100,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 12,
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
