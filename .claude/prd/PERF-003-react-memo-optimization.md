# PRD: PERF-003 - React.memo Optimization

## Overview
Add React.memo to list item components and frequently re-rendered components to prevent unnecessary re-renders.

## Problem Statement
Currently, 0 components use React.memo, meaning:
- List items re-render when parent state changes (even if their props haven't)
- Expensive render cycles on scroll
- Wasted CPU cycles on unchanged components

## Success Criteria
- [ ] All list item components wrapped in React.memo
- [ ] Key reusable components wrapped in React.memo
- [ ] Custom comparison functions added where needed
- [ ] No TypeScript errors
- [ ] App builds successfully
- [ ] No functional regressions

## Technical Approach

### Step 1: List Item Components (HIGH PRIORITY)
These render many times in lists - biggest impact:

1. `components/RecipeItem.tsx`
2. `components/recipe/RecipeCard.tsx`
3. `components/pantry/PantryItemCard.tsx` (if exists)
4. `components/editorial/QueueRecipeItem.tsx`
5. `components/editorial/FeaturedRecipeCard.tsx`
6. `components/cooking/CookingStepContent.tsx`
7. Grocery list item components

### Step 2: Migration Pattern
Replace:
```typescript
interface RecipeItemProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
}

export const RecipeItem: React.FC<RecipeItemProps> = ({ recipe, onPress }) => {
  // component code
};
```

With:
```typescript
interface RecipeItemProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
}

export const RecipeItem = React.memo<RecipeItemProps>(({ recipe, onPress }) => {
  // component code
});

// Add displayName for debugging
RecipeItem.displayName = 'RecipeItem';
```

### Step 3: Components Needing Custom Comparison
For components with complex props or callbacks:

```typescript
export const RecipeItem = React.memo<RecipeItemProps>(
  ({ recipe, onPress }) => {
    // component code
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (should NOT re-render)
    return (
      prevProps.recipe.id === nextProps.recipe.id &&
      prevProps.recipe.title === nextProps.recipe.title &&
      prevProps.recipe.image_url === nextProps.recipe.image_url
      // Don't compare onPress - assume it's stable via useCallback
    );
  }
);
```

### Step 4: Reusable UI Components (MEDIUM PRIORITY)
1. `components/ui/EmptyState.tsx`
2. `components/ui/LoadingState.tsx`
3. `components/ui/ErrorState.tsx`
4. `components/glass/GlassCard.tsx`
5. `components/glass/GlassButton.tsx`
6. `components/editorial/EditorialCard.tsx`

### Step 5: Verify Callback Stability
Ensure parent components use useCallback for handlers passed to memoized children:

```typescript
// In parent screen
const handlePressRecipe = useCallback((recipe: Recipe) => {
  navigation.navigate('RecipeDetail', { id: recipe.id });
}, [navigation]);

// Pass stable reference
<RecipeItem recipe={recipe} onPress={handlePressRecipe} />
```

## Files to Modify
1. `components/RecipeItem.tsx`
2. `components/recipe/RecipeCard.tsx`
3. `components/editorial/QueueRecipeItem.tsx`
4. `components/editorial/FeaturedRecipeCard.tsx`
5. `components/cooking/CookingStepContent.tsx`
6. `components/cooking/CookingControls.tsx`
7. `components/cooking/CookingTimer.tsx`
8. `components/pantry/*.tsx` (all pantry item components)
9. `components/glass/*.tsx` (all glass components)
10. `components/ui/*.tsx` (all UI components)

## Testing
- Verify lists scroll smoothly
- Verify item interactions still work (onPress, etc.)
- Verify state updates propagate correctly

## Out of Scope
- Adding useMemo for expensive computations (separate task)
- Performance profiling (separate task)

## Promise Statement
STOP WHEN: All list item components and reusable UI components are wrapped in React.memo, displayNames are added, and the app builds without errors and functions correctly.
