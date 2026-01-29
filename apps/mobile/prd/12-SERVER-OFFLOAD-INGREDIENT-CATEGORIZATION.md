# Server Offload: Ingredient Categorization at Import Time (API-009)

## Overview

Move ingredient categorization from a client-side utility into the server-side recipe import pipeline. Instead of categorizing ingredients on every grocery list render, assign a `category` to each ingredient once when the recipe is created or imported. The category is stored in the `ingredients` table (which already has a `category` column).

---

## Problem

| Issue | Impact |
|-------|--------|
| `categorizeIngredient()` runs on every grocery list render | Redundant re-computation for static data |
| Keyword list duplicated on client | Can't be improved or expanded without app update |
| Ingredients are stored without categories | Category must be computed every time they're displayed |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| When to categorize? | **At recipe creation/import time** | Only runs once per ingredient; result is persisted |
| Keep client-side fallback? | **No** | Server always sets category; client reads it from the API response |
| What about existing recipes with no category? | **Backfill migration** | One-time script to categorize all existing ingredients |

---

## Server Implementation

### Modified Files

**`apps/api/api/recipes/import.ts`** — After parsing ingredients, call `categorizeIngredient()` before inserting:
```typescript
await db.insert(ingredients).values(
  parsed.ingredients.map((ing, index) => ({
    recipeId: newRecipe.id,
    name: ing.name,
    quantity: ing.quantity ? parseFloat(ing.quantity) || null : null,
    unit: ing.unit || null,
    category: categorizeIngredient(ing.name),  // <-- NEW
    orderIndex: index,
  })),
);
```

**`apps/api/api/recipes/index.ts`** (POST handler) — Same change for manual recipe creation:
```typescript
await db.insert(ingredients).values(
  body.ingredients.map((ing, index) => ({
    ...
    category: ing.category || categorizeIngredient(ing.name),  // <-- NEW fallback
    ...
  })),
);
```

### New Files

**`apps/api/lib/categorize-ingredient.ts`** — Port from `apps/mobile/utils/categorizeIngredient.ts`:
- `categorizeIngredient(name)` — keyword-based classification
- `getCategoryOrder(category)` — sort order
- `CATEGORY_KEYWORDS` — the full keyword map

This is a direct port of the existing 134-line utility. No logic changes.

### Backfill Script

**`apps/api/scripts/backfill-ingredient-categories.ts`** — One-time migration:
1. Select all ingredients where `category IS NULL OR category = 'other'`
2. Run `categorizeIngredient()` on each name
3. Batch update in groups of 100

---

## Client Changes

### Deleted Files (after verification)

- `apps/mobile/utils/categorizeIngredient.ts` — logic moved to server

**Note:** This file is also consumed by `groceryList.ts`. If API-008 (grocery list generation offload) ships first, this file is already unused. If API-009 ships first, update `groceryList.ts` to import from a shared location or keep a thin client copy until API-008 lands.

### Modified Files

- Any screen that calls `categorizeIngredient()` directly — replace with reading `ingredient.category` from the API response (already populated by server)

---

## Acceptance Criteria

- [ ] `POST /api/recipes/import` stores a `category` for every ingredient
- [ ] `POST /api/recipes` (manual creation) stores a `category` for every ingredient
- [ ] Categories match the existing keyword-based logic identically
- [ ] Backfill script categorizes all existing ingredients without categories
- [ ] `pnpm typecheck` passes in both `apps/api` and `apps/mobile`
- [ ] Client reads `ingredient.category` from API response without re-computing
- [ ] Ingredients not matching any keyword get category `'other'`
