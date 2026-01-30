# Pantry: Smart Expiry Defaults (PANTRY-009)

## Overview

Automatically set expiry dates for pantry items based on food category and storage best practices. When an item is added to the pantry (from any input method), the system assigns a default expiry date based on USDA food storage guidelines. This makes the Kitchen Alerts feature useful without requiring users to manually enter expiry dates.

---

## Problem

| Issue | Impact |
|-------|--------|
| Most pantry items have no expiry date | Kitchen Alerts feature has nothing to alert about |
| Users rarely know exact expiry dates off the top of their head | Manual entry is guesswork at best |
| Different food categories have very different shelf lives | A bag of flour vs. fresh chicken need different defaults |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Data source? | **USDA FoodKeeper guidelines** + custom overrides | Authoritative, comprehensive, public domain |
| Granularity? | **Sub-category level** (e.g., "dairy > milk" vs "dairy > hard cheese") | Category-level is too coarse; milk and parmesan have very different shelf lives |
| Storage type? | **Assume refrigerated unless category indicates otherwise** | Most perishables go in the fridge; pantry items don't expire as urgently |
| Override? | **User can always edit the date** | Default is a suggestion, not a mandate |
| When applied? | **On item creation** — all input methods | Consistent behavior regardless of how item was added |
| Premium? | **No** — enhances core pantry for all users | Drives Kitchen Alerts value, which drives engagement |

---

## Server Implementation

### New File: `apps/api/lib/expiry-defaults.ts`

Static lookup table mapping food sub-categories to default shelf life in days.

```typescript
interface ExpiryDefault {
  category: string;
  subcategory: string;
  keywords: string[];
  fridgeDays: number | null;
  freezerDays: number | null;
  pantryDays: number | null;
}

const EXPIRY_DEFAULTS: ExpiryDefault[] = [
  // Produce
  { category: "produce", subcategory: "leafy_greens", keywords: ["lettuce", "spinach", "kale", "arugula"], fridgeDays: 5, freezerDays: null, pantryDays: null },
  { category: "produce", subcategory: "berries", keywords: ["strawberry", "blueberry", "raspberry"], fridgeDays: 5, freezerDays: 180, pantryDays: null },
  { category: "produce", subcategory: "root_vegetables", keywords: ["potato", "carrot", "onion", "garlic"], fridgeDays: 21, freezerDays: 240, pantryDays: 30 },
  { category: "produce", subcategory: "herbs", keywords: ["basil", "cilantro", "parsley", "thyme"], fridgeDays: 7, freezerDays: 90, pantryDays: null },

  // Meat & Seafood
  { category: "meat_seafood", subcategory: "poultry", keywords: ["chicken", "turkey", "duck"], fridgeDays: 2, freezerDays: 270, pantryDays: null },
  { category: "meat_seafood", subcategory: "ground_meat", keywords: ["ground beef", "ground turkey", "ground pork"], fridgeDays: 2, freezerDays: 120, pantryDays: null },
  { category: "meat_seafood", subcategory: "fish", keywords: ["salmon", "tuna", "cod", "shrimp"], fridgeDays: 2, freezerDays: 180, pantryDays: null },
  { category: "meat_seafood", subcategory: "steak", keywords: ["steak", "beef", "pork chop", "lamb"], fridgeDays: 4, freezerDays: 365, pantryDays: null },

  // Dairy
  { category: "dairy_eggs", subcategory: "milk", keywords: ["milk", "cream", "half and half"], fridgeDays: 7, freezerDays: 90, pantryDays: null },
  { category: "dairy_eggs", subcategory: "hard_cheese", keywords: ["parmesan", "cheddar", "gouda", "gruyere"], fridgeDays: 42, freezerDays: 180, pantryDays: null },
  { category: "dairy_eggs", subcategory: "soft_cheese", keywords: ["mozzarella", "brie", "ricotta", "cream cheese"], fridgeDays: 7, freezerDays: 90, pantryDays: null },
  { category: "dairy_eggs", subcategory: "eggs", keywords: ["egg", "eggs"], fridgeDays: 28, freezerDays: 365, pantryDays: null },
  { category: "dairy_eggs", subcategory: "yogurt", keywords: ["yogurt", "kefir"], fridgeDays: 14, freezerDays: 60, pantryDays: null },

  // Pantry staples
  { category: "pantry", subcategory: "grains", keywords: ["rice", "pasta", "flour", "oats"], fridgeDays: null, freezerDays: null, pantryDays: 365 },
  { category: "pantry", subcategory: "oils", keywords: ["olive oil", "vegetable oil", "coconut oil"], fridgeDays: null, freezerDays: null, pantryDays: 180 },
  { category: "pantry", subcategory: "spices", keywords: ["cinnamon", "cumin", "paprika", "oregano"], fridgeDays: null, freezerDays: null, pantryDays: 730 },

  // Canned
  { category: "canned", subcategory: "canned_goods", keywords: ["canned", "can of"], fridgeDays: null, freezerDays: null, pantryDays: 730 },

  // Frozen
  { category: "frozen", subcategory: "frozen_general", keywords: ["frozen"], fridgeDays: null, freezerDays: 180, pantryDays: null },
];
```

**`getExpiryDefault(name: string, category: string): Date | null`**
1. Normalize item name (lowercase, trim)
2. Match against keywords in the lookup table
3. If matched, calculate expiry date: `new Date(now + bestMatchDays * 86400000)`
4. Prefer `fridgeDays` for perishables, `pantryDays` for shelf-stable
5. Return null if no match (don't guess for unknown items)

### Modified: `apps/api/api/pantry/index.ts` (POST handler)

When creating a pantry item without an explicit `expiryDate`:
1. Call `getExpiryDefault(name, category)`
2. Set `expiryDate` to the computed default
3. Flag `expirySource: "auto"` so UI can show it's estimated

### Modified: `apps/api/api/pantry/bulk-add` (from PANTRY-001)

Same logic — apply expiry defaults when `expiryDate` is not provided.

---

## Client Changes

### `apps/mobile/screens/ConfirmScannedItemsScreen.tsx`

- Show auto-assigned expiry dates with "(estimated)" label
- Tap to edit/override the expiry date

### General

All pantry input flows benefit automatically — no additional client changes needed for each input method.

---

## Acceptance Criteria

- [ ] `getExpiryDefault()` returns accurate expiry dates based on USDA guidelines
- [ ] Keyword matching handles common food items across all categories
- [ ] Expiry date auto-assigned when creating pantry items without explicit date
- [ ] Auto-assigned dates are flagged as estimated
- [ ] Users can override auto-assigned expiry dates
- [ ] Bulk-add endpoint also applies smart defaults
- [ ] Kitchen Alerts immediately benefit from auto-assigned expiry dates
- [ ] `pnpm typecheck` passes in all packages
