# PRD: PERF-002 - Expo Image Migration

## Overview
Migrate all React Native Image components to expo-image for better caching, loading performance, and placeholder support.

## Problem Statement
Current image implementations use `react-native` Image which:
- Has no built-in caching
- No blurhash/placeholder support
- Slower image loading
- No memory optimizations
- Missing transition animations

## Success Criteria
- [x] All `import { Image } from 'react-native'` replaced with `import { Image } from 'expo-image'`
- [x] All `resizeMode` props changed to `contentFit`
- [x] Transition animations added (200ms default)
- [x] cachePolicy set to "memory-disk" where appropriate
- [x] No TypeScript errors
- [x] App builds successfully
- [x] Images load and display correctly

## Files Migrated (27 files)
### Components (12 files)
- components/RecipeItem.tsx
- components/PantryItemComponent.tsx
- components/ProductPlaceholder.tsx
- components/SplashScreen.tsx
- components/RecipeQueueCard.tsx
- components/editorial/ScreenHeader.tsx
- components/editorial/EditorialCard.tsx
- components/editorial/FeaturedRecipeCard.tsx
- components/editorial/QueueRecipeItem.tsx
- components/pantry/ExpiringNotificationCard.tsx
- components/recipe/RecipeHero.tsx

### Screens (15 files)
- screens/AccountScreen.tsx
- screens/CollectionDetailScreen.tsx
- screens/KitchenAlertsScreen.tsx
- screens/SubscriptionScreen.tsx
- screens/WantToCookScreen.tsx
- screens/OnboardingScreen.tsx
- screens/CookbooksScreen.tsx
- screens/WhatCanIMakeScreen.tsx
- screens/MealPlannerScreen.tsx
- screens/ConfirmScannedItemsScreen.tsx
- screens/RecipesScreen.tsx
- screens/AIPantryScannerScreen.tsx
- screens/ImportRecipeScreen.tsx
- screens/PantryScreen.tsx

## Technical Approach

### Step 1: Migration Pattern
Replace:
```typescript
import { Image } from 'react-native';

<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode="cover"
/>
```

With:
```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

### Step 2: Files to Modify (21 files identified)
Search for: `import { Image } from "react-native"` or `import { Image } from 'react-native'`

Key files:
1. `components/RecipeItem.tsx`
2. `components/recipe/RecipeCard.tsx`
3. `components/editorial/FeaturedRecipeCard.tsx`
4. `components/editorial/QueueRecipeItem.tsx`
5. `screens/RecipeDetailScreen.tsx`
6. `screens/HomeScreen.tsx`
7. `screens/RecipesScreen.tsx`
8. `screens/CookingModeScreen.tsx`
9. Any component importing Image from react-native

### Step 3: Prop Mapping
| react-native Image | expo-image |
|-------------------|------------|
| `resizeMode="cover"` | `contentFit="cover"` |
| `resizeMode="contain"` | `contentFit="contain"` |
| `resizeMode="stretch"` | `contentFit="fill"` |
| `resizeMode="center"` | `contentFit="none"` + `contentPosition="center"` |

### Step 4: Additional Features to Add
```typescript
<Image
  source={{ uri: imageUrl }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
  placeholder={recipe.blurhash ? { blurhash: recipe.blurhash } : undefined}
  placeholderContentFit="cover"
/>
```

### Step 5: Handle Local Images
For local images (require()):
```typescript
// This still works the same way
<Image source={require('../assets/placeholder.png')} />
```

## Edge Cases
- Images with onLoad/onError callbacks - expo-image supports these
- Images in lists - cachePolicy helps with recycling
- Conditional image sources - handle null/undefined URIs

## Out of Scope
- Adding blurhash generation to backend (can add placeholder prop structure)
- Image upload optimization

## Promise Statement
STOP WHEN: All Image imports from 'react-native' have been replaced with expo-image imports, resizeMode props are converted to contentFit, and the app builds and displays images correctly.
