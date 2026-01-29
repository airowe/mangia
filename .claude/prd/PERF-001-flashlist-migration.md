# PRD: PERF-001 - FlashList Migration

## Overview
Migrate all FlatList and ScrollView.map patterns to @shopify/flash-list for significant performance improvements in list rendering.

## Problem Statement
Current list implementations use React Native's FlatList and manual ScrollView.map patterns, which:
- Create all items upfront (no virtualization for ScrollView.map)
- Have suboptimal memory management
- Cause janky scrolling on large lists
- Miss key performance optimizations like estimatedItemSize

## Success Criteria
- [x] @shopify/flash-list installed (v2.2.0)
- [x] PantryScreen.tsx - Removed unused FlatList import (uses ScrollView.map pattern)
- [x] RecipeDetailScreen.tsx ingredient list migrated (collection modal)
- [x] CookingModeScreen.tsx steps list migrated
- [x] WhatCanIMakeScreen.tsx migrated (recipe grid)
- [x] CollectionsScreen.tsx migrated
- [x] CollectionDetailScreen.tsx migrated
- [x] CookbooksScreen.tsx migrated
- [x] MealPlannerScreen.tsx migrated (recipe picker modal)
- [x] OnboardingScreen.tsx migrated
- [x] RecipeRatingNotes.tsx migrated
- [x] GroceryListScreen.tsx - Uses SectionList, kept as-is (FlashList v2 does not support SectionList)
- [x] estimatedItemSize NOT required in v2 (auto-measured)
- [x] No TypeScript errors
- [x] App builds successfully

## Notes on v2 Migration
FlashList v2 is a complete rewrite that:
- Removes the need for `estimatedItemSize` (auto-measures items)
- Uses `FlashListRef<T>` for ref types instead of `FlashList<T>`
- Requires New Architecture (Fabric) for full benefits; falls back to v1 on old arch

## Technical Approach

### Step 1: Install FlashList
```bash
pnpm add @shopify/flash-list
```

### Step 2: Migration Pattern
Replace:
```typescript
import { FlatList } from 'react-native';

<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
/>
```

With:
```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  estimatedItemSize={100} // Estimate based on item height
/>
```

### Step 3: Files to Modify
1. `screens/PantryScreen.tsx` - Main pantry list
2. `screens/RecipeDetailScreen.tsx` - Ingredients list
3. `screens/CookingModeScreen.tsx` - Steps horizontal list
4. `components/RecipeList.tsx` - Recipe grid/list
5. `screens/GroceryListScreen.tsx` - SectionList (may keep as-is if FlashList SectionList not suitable)
6. `screens/RecipesScreen.tsx` - Recipe library grid

### Step 4: Horizontal Lists
For horizontal lists, ensure:
```typescript
<FlashList
  horizontal
  data={items}
  renderItem={renderItem}
  estimatedItemSize={200}
  showsHorizontalScrollIndicator={false}
/>
```

## Estimated Item Sizes
- Recipe cards: ~280px (vertical), ~200px (horizontal)
- Pantry items: ~120px
- Ingredients: ~60px
- Cooking steps: screen width (full page)
- Grocery items: ~56px

## Out of Scope
- Adding getItemLayout (FlashList handles this internally)
- Migrating to FlashList SectionList (evaluate separately)

## Promise Statement
STOP WHEN: All FlatList imports have been replaced with FlashList, estimatedItemSize is configured for each list, and the app builds without errors.
