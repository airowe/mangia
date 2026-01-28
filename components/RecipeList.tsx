import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  ViewStyle,
  StyleProp,
  ScrollViewProps
} from 'react-native';
import { Recipe } from '../models/Recipe';
import { RecipeItem } from './RecipeItem';
import { useTheme } from '../theme';
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
  const { theme, isDark } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

  // Dynamic styles based on theme
  const styles = useMemo(() => ({
    // Section styles
    section: {
      marginBottom: spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.styles.title3,
      color: colors.text,
    },
    endOfList: {
      ...typography.styles.caption2,
      color: colors.textTertiary,
      fontStyle: 'italic' as const,
    },

    // Layout styles
    horizontalContainer: {
      paddingHorizontal: spacing.sm,
    },
    recipesContainer: {
      paddingVertical: spacing.sm,
    },
    gridContainer: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      padding: spacing.sm,
    },

    // Card styles
    recipeCard: {
      margin: spacing.sm,
      width: 200,
      borderRadius: borderRadius.md,
      backgroundColor: colors.card,
      overflow: 'hidden' as const,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
    },
    horizontalItem: {
      marginRight: spacing.lg,
      width: 200,
      borderRadius: borderRadius.md,
      backgroundColor: colors.card,
      overflow: 'hidden' as const,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
    },

    // Loading states
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: spacing.xl,
    },
    loadingText: {
      marginTop: spacing.sm,
      color: colors.textSecondary,
      ...typography.styles.body,
    },
    loadingMore: {
      width: 100,
      padding: spacing.lg,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },

    // Empty state
    emptyContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: spacing.xxxl,
    },
    emptyText: {
      ...typography.styles.headline,
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center' as const,
    },
    emptySubtext: {
      ...typography.styles.body,
      color: colors.textTertiary,
      textAlign: 'center' as const,
    },

    // Error state
    errorContainer: {
      padding: spacing.lg,
      backgroundColor: colors.errorBackground,
      borderRadius: borderRadius.md,
      margin: spacing.lg,
      alignItems: 'center' as const,
    },
    errorText: {
      color: colors.error,
      marginBottom: spacing.md,
      textAlign: 'center' as const,
      ...typography.styles.body,
    },
    retryButton: {
      backgroundColor: colors.error,
    },
  }), [colors, spacing, borderRadius, typography, isDark]);

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
              buttonColor={colors.error}
              textColor={colors.textOnPrimary}
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

