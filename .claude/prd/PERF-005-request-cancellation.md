# PRD: PERF-005 - Request Cancellation & Cleanup

## Overview
Add AbortController support to all API calls in useEffect hooks to prevent memory leaks and race conditions.

## Problem Statement
Current API calls in useEffect hooks:
- Don't cancel when component unmounts
- Can cause "Can't perform state update on unmounted component" warnings
- Create race conditions when params change quickly
- Leak memory with orphaned promises

## Success Criteria
- [ ] All useEffect hooks with API calls use AbortController
- [ ] API client supports signal parameter
- [ ] Cleanup functions properly abort pending requests
- [ ] No "unmounted component" warnings
- [ ] No TypeScript errors
- [ ] App builds successfully

## Technical Approach

### Step 1: Update API Client
Add signal support to apiClient methods in `lib/api/client.ts`:

```typescript
async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await this.client.get<T>(endpoint, config);
  return response.data;
}
```

The AxiosRequestConfig already supports `signal`, so no changes needed to the client itself.

### Step 2: Update Service Functions
Add optional signal parameter to service functions:

```typescript
// lib/recipeService.ts
export const fetchRecipeById = async (
  recipeId: string,
  options?: { signal?: AbortSignal }
): Promise<RecipeWithIngredients | null> => {
  if (DEV_BYPASS_AUTH) {
    // Mock data path - no cancellation needed
    return mockRecipe;
  }

  const response = await apiClient.get<RecipeWithIngredients>(
    `/api/recipes/${recipeId}`,
    { signal: options?.signal }
  );
  return response;
};
```

### Step 3: Update Screen useEffect Hooks
Pattern for all screens:

```typescript
// Before
useEffect(() => {
  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchRecipeById(recipeId);
      setRecipe(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  load();
}, [recipeId]);

// After
useEffect(() => {
  const abortController = new AbortController();

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchRecipeById(recipeId, {
        signal: abortController.signal
      });
      // Only update state if not aborted
      if (!abortController.signal.aborted) {
        setRecipe(data);
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error(err);
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  };

  load();

  return () => {
    abortController.abort();
  };
}, [recipeId]);
```

### Step 4: Files to Modify

#### Service Files (add signal support)
1. `lib/recipeService.ts` - fetchRecipeById, fetchRecipesByStatus, etc.
2. `lib/pantry.ts` - fetchPantryItems, etc.
3. `lib/groceryList.ts` - generateGroceryList
4. `lib/collectionService.ts` - if exists
5. `lib/whatCanIMake.ts` - recipe matching

#### Screen Files (add AbortController)
1. `screens/RecipeDetailScreen.tsx`
2. `screens/HomeScreen.tsx`
3. `screens/PantryScreen.tsx`
4. `screens/RecipesScreen.tsx`
5. `screens/GroceryListScreen.tsx`
6. `screens/CookingModeScreen.tsx`
7. `screens/WhatCanIMakeScreen.tsx`
8. `screens/CollectionsScreen.tsx`
9. `screens/CollectionDetailScreen.tsx`
10. Any screen with useEffect + API call

### Step 5: Helper Utility (Optional)
Create a reusable hook for cleaner code:

```typescript
// hooks/useAbortableEffect.ts
export function useAbortableEffect(
  effect: (signal: AbortSignal) => void | Promise<void>,
  deps: React.DependencyList
) {
  useEffect(() => {
    const abortController = new AbortController();
    effect(abortController.signal);
    return () => abortController.abort();
  }, deps);
}

// Usage
useAbortableEffect(async (signal) => {
  const data = await fetchRecipeById(recipeId, { signal });
  if (!signal.aborted) {
    setRecipe(data);
  }
}, [recipeId]);
```

### Step 6: Error Handling Pattern
```typescript
const isAbortError = (error: unknown): boolean => {
  return error instanceof Error && error.name === 'AbortError';
};

// In catch blocks
catch (err) {
  if (isAbortError(err)) return;
  // Handle real errors
}
```

## Testing
- Navigate quickly between screens - no warnings
- Change params rapidly - no stale data
- Check memory usage doesn't grow with navigation

## Out of Scope
- Adding retry logic (separate task)
- Request deduplication (TanStack Query task)
- Offline queue

## Promise Statement
STOP WHEN: All service functions support signal parameter, all screen useEffect hooks use AbortController with proper cleanup, and there are no "unmounted component" warnings during navigation.
