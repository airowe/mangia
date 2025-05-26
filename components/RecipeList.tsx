import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItem, RefreshControl, FlatListProps } from 'react-native';
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
}

const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  loading = false,
  refreshing = false,
  onRefresh,
  onPressRecipe = () => {},
  ListEmptyComponent = null,
  ListHeaderComponent = null,
  numColumns = 1,
  showMealType = false,
}) => {
  const renderRecipeItem: ListRenderItem<Recipe> = useCallback(({ item }) => (
    <RecipeItem 
      recipe={item} 
      onPress={onPressRecipe} 
      showMealType={showMealType} 
    />
  ), [onPressRecipe, showMealType]);

  // Calculate item dimensions for getItemLayout
  const ITEM_HEIGHT = 150; // Adjust based on your item height
  const ITEM_MARGIN = 8; // Adjust based on your styles
  
  // Create a ref for the FlatList
  const flatListRef = useRef<FlatList<Recipe>>(null);

  // Calculate item layout for better performance
  const getItemLayout = useCallback<NonNullable<FlatListProps<Recipe>['getItemLayout']>>((data, index) => {
    return {
      length: ITEM_HEIGHT + ITEM_MARGIN * 2,
      offset: (ITEM_HEIGHT + ITEM_MARGIN * 2) * Math.floor(index / (numColumns || 1)),
      index,
    };
  }, [numColumns]);

  // Key extractor for the list items
  const keyExtractor = useCallback((item: Recipe, index: number): string => {
    return item.id || `recipe-${index}`;
  }, []);
  
  // Use the existing renderRecipeItem directly
  const renderItem = useCallback(renderRecipeItem, [renderRecipeItem]);
  
  // Show loading state if needed
  if (loading && recipes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading recipes...</Text>
      </View>
    );
  }

  return (
    <FlatList<Recipe>
      ref={flatListRef}
      data={recipes}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      numColumns={numColumns}
      key={`recipe-list-${numColumns}`}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      refreshControl={
        onRefresh ? (
          <RefreshControl 
            refreshing={!!refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.primary]}
          />
        ) : undefined
      }
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={4}
      windowSize={5}
      showsVerticalScrollIndicator={false}
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
  recipeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  recipeCell: {
    flex: 1,
    marginHorizontal: 4,
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 8,
  },
});

export default RecipeList;
