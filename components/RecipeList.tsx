import React, { useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl
} from 'react-native';
import { Recipe } from '../models/Recipe';
import { RecipeItem } from './RecipeItem';
import { colors } from '../theme/colors';

export interface RecipeListProps {
  recipes: Recipe[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onPressRecipe: (recipe: Recipe) => void;
  showMealType?: boolean;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  numColumns?: number;
  selectedRecipeIds?: Set<string> | string[];
  style?: any;
}

export const RecipeList: React.FC<RecipeListProps> = ({
  recipes = [],
  loading = false,
  refreshing = false,
  onRefresh,
  onPressRecipe = () => {},
  showMealType = false,
  ListHeaderComponent = null,
  ListEmptyComponent = null,
  numColumns = 1,
  selectedRecipeIds = new Set<string>(),
  style,
}) => {
  // All hooks must be called unconditionally at the top level
  const isSelected = useCallback((recipeId: string): boolean => {
    if (!selectedRecipeIds) return false;
    if (Array.isArray(selectedRecipeIds)) {
      return selectedRecipeIds.includes(recipeId);
    }
    return selectedRecipeIds.has(recipeId);
  }, [selectedRecipeIds]);

  const renderRecipeItem = useCallback(({ item }: { item: Recipe }) => (
    <RecipeItem 
      recipe={item} 
      onPress={onPressRecipe} 
      showMealType={showMealType}
      isSelected={item.id ? isSelected(item.id) : false}
    />
  ), [onPressRecipe, showMealType, isSelected]);

  // Show loading state if needed
  if (loading && recipes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading recipes...</Text>
      </View>
    );
  }

  // Generate a key based on numColumns to force re-render when columns change
  const listKey = `recipe-list-${numColumns}`;
  
  // Render flat list for non-grouped view
  return (
    <FlatList
      key={listKey}
      data={recipes}
      keyExtractor={(item) => item.id || `recipe-${item.title}`}
      renderItem={renderRecipeItem}
      numColumns={numColumns}
      contentContainerStyle={styles.listContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recipes found</Text>
          <Text style={styles.emptySubtext}>Try adding a new recipe</Text>
        </View>
      }
      ListHeaderComponent={ListHeaderComponent}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },


  recipeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeImage: {
    width: '100%',
    height: 160,
  },
  recipeInfo: {
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
    marginBottom: 8,
  },
  recipeMeta: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});


