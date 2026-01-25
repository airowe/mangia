# Grosheries Code Map

## Repository Reference
**Source:** https://github.com/airowe/grosheries

This document maps what to reuse, adapt, or remove from the grosheries codebase.

---

## ✅ Direct Reuse (Copy As-Is)

These files work without modification:

### Core Infrastructure
| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Supabase client with AsyncStorage session |
| `lib/auth.ts` | Authentication helpers |
| `lib/api/client.ts` | API client wrapper |
| `babel.config.js` | Babel configuration |
| `tsconfig.json` | TypeScript configuration |
| `metro.config.js` | Metro bundler config |
| `app.json` | Update app name, but keep structure |

### Models (Keep, may extend)
| File | Purpose |
|------|---------|
| `models/Recipe.ts` | Recipe and RecipeIngredient interfaces |
| `models/Product.ts` | PantryItem interface |

### Services
| File | Purpose |
|------|---------|
| `lib/firecrawl.ts` | Recipe URL extraction — **this is critical** |
| `lib/pantry.ts` | Pantry CRUD operations — **fully implemented** |

### Screens
| File | Purpose |
|------|---------|
| `screens/AuthScreen.tsx` | Login/signup flow |
| `screens/AccountScreen.tsx` | User settings |

### Supporting Files
| Directory | Purpose |
|-----------|---------|
| `theme/*` | Styling system |
| `hooks/*` | Custom React hooks |
| `components/*` | UI components (review individually) |
| `navigation/*` | React Navigation setup (adapt routes) |

---

## 🔄 Adapt (Modify for New Purpose)

### Screens to Adapt

| Original | New Purpose | Changes Needed |
|----------|-------------|----------------|
| `screens/HomeScreen.tsx` | "Want to Cook" queue | - Change data source to recipes with `status='want_to_cook'`<br>- Add "Generate Grocery List" button<br>- Update header/branding |
| `screens/RecipesScreen.tsx` | "My Recipes" library | - Add filter tabs (All/Want to Cook/Cooked/Archived)<br>- Update empty states |
| `screens/RecipeDetailScreen.tsx` | Recipe detail view | - Add "Add to Grocery List" action<br>- Add "Mark as Cooked" action<br>- Add source URL badge |
| `screens/RecipeSearchScreen.tsx` | Import Recipe screen | - Repurpose URL input for recipe import<br>- Add URL type detection<br>- Add preview/edit flow |
| `screens/RecipeCreateScreen.tsx` | Manual entry fallback | - Simplify to essential fields<br>- Remove meal planning ties |
| `screens/MealPlannerScreen.tsx` | (Future) Week planner | - Simplify for premium feature<br>- Not needed for MVP |
| `screens/ManualEntryScreen.tsx` | Manual recipe entry | - Keep as fallback option |

### Services to Adapt

| Original | New Purpose | Changes Needed |
|----------|-------------|----------------|
| `lib/recipes.ts` | Recipe CRUD | - Simplify to core CRUD<br>- Add `status` filtering<br>- Remove meal plan complexity |
| `lib/mealPlanner.ts` | (Future) Premium feature | - Defer to post-MVP<br>- Has useful shopping list logic to reference |

---

## ❌ Remove (Not Needed)

| File/Feature | Reason |
|--------------|--------|
| `screens/BarcodeScreen.tsx` | Barcode scanning not relevant |
| `screens/ReceiptScanScreen.tsx` | Receipt scanning not needed |
| `screens/ProductDetailScreen.tsx` | Product database not needed |
| `screens/SearchResultsScreen.tsx` | Replaced by recipe search |
| `services/receiptScanner.ts` | Veryfi integration not needed |
| `services/veryfiService.ts` | Receipt scanning not needed |
| `lib/ai.ts` | Tesseract OCR + barcode lookup not needed |
| `lib/products.ts` | Product database not needed |
| Veryfi SDK dependency | Remove from package.json |
| Tesseract.js dependency | Remove from package.json |
| `@veryfi/veryfi-sdk` | Remove from package.json |

---

## 🆕 New Files to Create

### Services
| File | Purpose |
|------|---------|
| `lib/recipeParser.ts` | Orchestrates URL → recipe extraction |
| `lib/videoTranscript.ts` | Extracts transcripts from TikTok/YouTube |
| `lib/ingredientParser.ts` | Claude API for ingredient extraction |
| `lib/groceryList.ts` | Grocery list generation with pantry check |
| `lib/revenuecat.ts` | RevenueCat subscription management |

### Screens
| File | Purpose |
|------|---------|
| `screens/ImportRecipeScreen.tsx` | URL import flow |
| `screens/GroceryListScreen.tsx` | Shopping list display |
| `screens/PantryScreen.tsx` | Pantry management (adapt from existing) |
| `screens/SubscriptionScreen.tsx` | RevenueCat paywall |
| `screens/WhatCanIMakeScreen.tsx` | Premium: pantry → recipe matching |
| `screens/CookbooksScreen.tsx` | Premium: cookbook collection |

### Contexts
| File | Purpose |
|------|---------|
| `contexts/SubscriptionContext.tsx` | Premium state management |

### Hooks
| File | Purpose |
|------|---------|
| `hooks/usePremiumFeature.ts` | Premium feature gating |
| `hooks/useRecipeLimit.ts` | Free tier import limit |

### Utils
| File | Purpose |
|------|---------|
| `utils/categorizeIngredient.ts` | Ingredient → store section mapping |
| `utils/normalizeIngredient.ts` | Ingredient name normalization |

---

## Package.json Changes

### Keep
```json
{
  "@expo/vector-icons": "^14.1.0",
  "@gorhom/bottom-sheet": "^5.1.6",
  "@react-native-async-storage/async-storage": "^2.1.2",
  "@react-navigation/bottom-tabs": "^7.3.10",
  "@react-navigation/native": "^7.1.6",
  "@react-navigation/native-stack": "^7.3.10",
  "@supabase/supabase-js": "v2.49.5-next.1",
  "expo": "~53.0.8",
  "expo-camera": "~16.1.6",
  "expo-file-system": "^18.1.10",
  "expo-image-picker": "~16.1.4",
  "expo-status-bar": "~2.2.3",
  "react": "19.0.0",
  "react-native": "0.79.2",
  "react-native-gesture-handler": "^2.24.0",
  "react-native-paper": "^5.14.1",
  "react-native-reanimated": "^3.17.5",
  "react-native-safe-area-context": "^5.4.0",
  "react-native-screens": "^4.10.0",
  "react-native-swipe-list-view": "^3.2.9",
  "uuid": "^11.1.0"
}
```

### Remove
```json
{
  "@veryfi/veryfi-sdk": "^1.4.4",  // Receipt scanning
  "tesseract.js": "^6.0.1",        // OCR
  "react-native-calendars": "^1.1312.1",  // Can remove if not using meal planner
}
```

### Add
```json
{
  "react-native-purchases": "^7.x.x",  // RevenueCat
}
```

---

## Environment Variables

### Keep from grosheries
```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_FIRECRAWL_API_KEY=  # Already have this!
```

### Remove
```bash
EXPO_PUBLIC_VERYFI_CLIENT_ID=
EXPO_PUBLIC_VERYFI_AUTH_USERNAME=
EXPO_PUBLIC_VERYFI_AUTH_APIKEY=
```

### Add new
```bash
EXPO_PUBLIC_CLAUDE_API_KEY=
EXPO_PUBLIC_RAPIDAPI_KEY=  # For video transcripts
EXPO_PUBLIC_REVENUECAT_IOS_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=  # Optional
```

---

## Supabase Schema Migration

### Tables to Keep
- `recipes` (add `status`, `source_url`, `source_type` columns)
- `recipe_ingredients` (add `category` column)

### Tables to Add
- `pantry_items` (may already exist)
- `grocery_lists`
- `grocery_items`
- `cookbooks`
- `user_subscriptions`

### Tables to Remove/Ignore
- Any product/barcode related tables

---

## Migration Checklist

1. [ ] Fork grosheries repo
2. [ ] Create new branch: `shipyard-eitan`
3. [ ] Update `app.json` with new app name
4. [ ] Remove unused dependencies from `package.json`
5. [ ] Add RevenueCat dependency
6. [ ] Delete unused screens (Barcode, Receipt, Product)
7. [ ] Delete unused services (Veryfi, Tesseract)
8. [ ] Create new Supabase project (or new tables in existing)
9. [ ] Run schema migration
10. [ ] Update environment variables
11. [ ] Create new services (recipeParser, groceryList, revenuecat)
12. [ ] Adapt existing screens
13. [ ] Create new screens
14. [ ] Update navigation
15. [ ] Test end-to-end flow
