import React, { useCallback, useMemo } from 'react';
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
  onPressRecipe?: (recipe: Recipe) => void;
  ListEmptyComponent?: React.ReactElement | null;
  ListHeaderComponent?: React.ReactElement | null;
  numColumns?: number;
  showMealType?: boolean;
  groupByCategory?: boolean;
}

export const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  loading = false,
  refreshing = false,
  onRefresh,
  onPressRecipe = () => {},
  ListEmptyComponent = null,
  ListHeaderComponent = null,
  numColumns = 1,
  showMealType = false,
  groupByCategory = false,
}) => {
  // Group recipes by category if needed
  const groupedRecipes = useMemo(() => {
    if (!groupByCategory) return null;
    
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
  }, [recipes, groupByCategory]);

  // Show loading state if needed
  if (loading && recipes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading recipes...</Text>
      </View>
    );
  }

  // Render grouped recipes if enabled
  if (groupByCategory && groupedRecipes) {
    return (
      <FlatList
        data={Object.entries(groupedRecipes)}
        keyExtractor={([category]) => category}
        renderItem={({ item: [category, items] }) => (
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryHeader}>{category}</Text>
            {items.map((recipe) => (
              <View key={recipe.id} style={styles.recipeCardContainer}>
                <RecipeItem 
                  recipe={recipe} 
                  onPress={onPressRecipe} 
                  showMealType={showMealType} 
                />
              </View>
            ))}
          </View>
        )}
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
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        }
        ListHeaderComponent={ListHeaderComponent}
      />
    );
  }

  // Render flat list for non-grouped view
  return (
    <FlatList
      data={recipes}
      keyExtractor={(item) => item.id || `recipe-${item.title}`}
      renderItem={({ item }) => (
        <RecipeItem 
          recipe={item} 
          onPress={onPressRecipe} 
          showMealType={showMealType} 
        />
      )}
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
  categoryContainer: {
    marginBottom: 24,
  },
  categoryHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.text,
  },
  recipeCardContainer: {
    marginBottom: 16,
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
  placeholderImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textTertiary,
    fontSize: 14,
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


