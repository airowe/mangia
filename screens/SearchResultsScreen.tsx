import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RecipeLibraryStackParamList } from '../navigation/RecipeLibraryStack';
import { Recipe } from '../models/Recipe';
import { Screen } from '../components/Screen';
import { RecipeList } from '../components/RecipeList';
import { colors } from '../theme/colors';
import { Button, Text } from 'react-native-paper';
import { addRecipe } from '../lib/recipes';

type SearchResultsRouteProp = RouteProp<{ params: { searchQuery: string } }, 'params'>;

export function SearchResultsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RecipeLibraryStackParamList, 'SearchResults'>>();
  const route = useRoute<SearchResultsRouteProp>();
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const searchQuery = route.params?.searchQuery || '';

  const handleAddRecipes = useCallback(async () => {
    try {
      setIsAdding(true);
      // TODO: Implement actual recipe addition logic
      // For now, just show a success message
      Alert.alert('Success', 'Selected recipes have been added to your collection');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to add recipes:', error);
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
            loading={isAdding}
            disabled={selectedRecipes.size === 0 || isAdding}
            style={styles.addButton}
          >
            Add {selectedRecipes.size > 0 ? `(${selectedRecipes.size})` : ''} to My Recipes
          </Button>
        </View>

        <RecipeList
          recipes={[]} // TODO: Pass actual search results
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
});
