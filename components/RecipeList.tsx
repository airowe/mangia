import React, { useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  ViewStyle,
  StyleProp,
  ScrollViewProps
} from 'react-native';
import { Recipe } from '../models/Recipe';
import { RecipeItem } from './RecipeItem';
import { colors } from '../theme/colors';
import { Button } from 'react-native-paper';

export interface RecipeListProps {
  /** Array of recipes to display */
  recipes: Recipe[];
  /** Show loading state */
  loading?: boolean;
  /** Show pull-to-refresh loading indicator */
  refreshing?: boolean;
  /** Callback when pull-to-refresh is triggered */
  onRefresh?: () => void;
  /** Callback when a recipe is pressed */
  onPressRecipe: (recipe: Recipe) => void;
  /** Show meal type in the recipe item */
  showMealType?: boolean;
  /** Component to render at the top of the list */
  ListHeaderComponent?: React.ReactNode;
  /** Component to render when there are no recipes */
  ListEmptyComponent?: React.ReactNode;
  /** Number of columns in the grid layout (only used when horizontal is false) */
  numColumns?: number;
  /** Array or Set of selected recipe IDs */
  selectedRecipeIds?: Set<string> | string[];
  /** Style for the container */
  style?: StyleProp<ViewStyle>;
  /** Enable/disable scrolling */
  scrollEnabled?: boolean;
  /** Display items horizontally */
  horizontal?: boolean;
  /** Callback when reaching the end of the list */
  onEndReached?: () => void;
  /** Whether there are more items to load */
  hasMore?: boolean;
  /** Whether more items are being fetched */
  isFetching?: boolean;
  /** Title for the section (shown when horizontal is true) */
  title?: string;
  /** Callback to retry loading if there was an error */
  onRetry?: () => void;
  /** Error message to display */
  error?: string | null;
  /** Additional props to pass to the ScrollView */
  scrollViewProps?: Omit<ScrollViewProps, 'horizontal' | 'showsHorizontalScrollIndicator' | 'contentContainerStyle' | 'onScrollEndDrag' | 'scrollEventThrottle'>;
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
  scrollEnabled = true,
  horizontal = false,
  onEndReached,
  hasMore = false,
  isFetching = false,
  title,
  onRetry,
  error,
  scrollViewProps,
}) => {
  // Check if a recipe is selected
  const isSelected = useCallback((recipeId: string): boolean => {
    if (!selectedRecipeIds) return false;
    if (Array.isArray(selectedRecipeIds)) {
      return selectedRecipeIds.includes(recipeId);
    }
    return selectedRecipeIds.has(recipeId);
  }, [selectedRecipeIds]);

  // Render a single recipe item
  const renderRecipeItem = useCallback((recipe: Recipe) => (
    <View key={recipe.id} style={horizontal ? styles.horizontalItem : styles.recipeCard}>
      <RecipeItem 
        recipe={recipe} 
        onPress={onPressRecipe} 
        showMealType={showMealType}
        isSelected={recipe.id ? isSelected(recipe.id) : false}
      />
    </View>
  ), [onPressRecipe, showMealType, isSelected, horizontal]);

  // Handle scroll end for horizontal loading
  const handleScrollEnd = useCallback(({ nativeEvent }: { nativeEvent: any }) => {
    if (onEndReached && !isFetching && hasMore && horizontal) {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      const isCloseToEnd =
        layoutMeasurement.width + contentOffset.x >=
        contentSize.width - 50; // 50px from the end
      
      if (isCloseToEnd) {
        onEndReached();
      }
    }
  }, [onEndReached, isFetching, hasMore, horizontal]);

  // Show loading state if needed
  if (loading && recipes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }

  // Show error state if needed
  if (error) {
    return (
      <View style={styles.section}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          {onRetry && (
            <Button 
              mode="contained" 
              onPress={onRetry} 
              style={styles.retryButton}
            >
              Retry
            </Button>
          )}
        </View>
      </View>
    );
  }

  // Show empty state if needed
  if (recipes.length === 0) {
    return ListEmptyComponent || (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No recipes found</Text>
        <Text style={styles.emptySubtext}>Try adding a new recipe</Text>
      </View>
    );
  }

  // Render horizontal list
  if (horizontal) {
    return (
      <View style={[styles.section, style]}>
        {title && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {!hasMore && recipes.length > 0 && (
              <Text style={styles.endOfList}>End of list</Text>
            )}
          </View>
        )}
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.horizontalContainer, styles.recipesContainer]}
          onScrollEndDrag={handleScrollEnd}
          scrollEventThrottle={400}
          scrollEnabled={scrollEnabled}
          {...scrollViewProps}
        >
          {recipes.map(renderRecipeItem)}
          {isFetching && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Loading more...</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // Render vertical grid list
  return (
    <View style={style}>
      {ListHeaderComponent}
      <View style={styles.gridContainer}>
        {recipes.map(renderRecipeItem)}
      </View>
      {isFetching && (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Section styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  endOfList: {
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  
  // Layout styles
  horizontalContainer: {
    paddingHorizontal: 8,
  },
  recipesContainer: {
    paddingVertical: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  
  // Card styles
  recipeCard: {
    margin: 8,
    width: 200,
    borderRadius: 8,
    backgroundColor: colors.card,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  horizontalItem: {
    marginRight: 16,
    width: 200,
    borderRadius: 8,
    backgroundColor: colors.card,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: colors.textSecondary,
  },
  loadingMore: {
    width: 100,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Empty state
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
  
  // Error state
  errorContainer: {
    padding: 16,
    backgroundColor: colors.error + '20',
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.error,
  },
});
