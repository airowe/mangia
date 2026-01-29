# Server Offload: Grocery List Generation (API-008)

## Overview

Move grocery list generation logic from the mobile client to a new `POST /api/grocery-lists/generate` server-side endpoint. Currently the client fetches all pantry items, consolidates ingredients across selected recipes, deduplicates by normalized name, subtracts pantry quantities, categorizes by store section, and then POSTs the result. The server endpoint does all of this in one call.

---

## Problem

| Issue | Impact |
|-------|--------|
| Client fetches full pantry to do deduction locally | Extra round-trip + bandwidth |
| Ingredient consolidation runs on device | Redundant computation for data the server already has |
| Categorization keywords duplicated on client | `categorizeIngredient.ts` logic can't be shared with server |
| Two separate API calls (fetch pantry + create list) | Could be one |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Input: recipe IDs or full recipe objects? | **Recipe IDs** | Server has the data; avoids sending large payloads from client |
| Auto-create the grocery list in DB? | **Yes** | The client always creates after generating; combine into one call |
| Return the generated list or just the ID? | **Full list with items** | Client needs items immediately for display |

---

## Endpoint

### `POST /api/grocery-lists/generate`

**Request:**
```json
{
  "recipeIds": ["uuid-1", "uuid-2", "uuid-3"],
  "name": "Shopping List"
}
```

**Response:**
```json
{
  "list": {
    "id": "uuid",
    "name": "Shopping List",
    "createdAt": "2026-01-29T..."
  },
  "items": [
    {
      "id": "uuid",
      "name": "chicken breast",
      "totalQuantity": 2,
      "unit": "lbs",
      "category": "meat_seafood",
      "needToBuy": 1.5,
      "inPantry": true,
      "pantryQuantity": 0.5,
      "fromRecipes": [
        { "recipeId": "uuid-1", "recipeTitle": "Chicken Stir Fry", "quantity": 1 },
        { "recipeId": "uuid-2", "recipeTitle": "Grilled Chicken", "quantity": 1 }
      ],
      "checked": false
    }
  ]
}
```

---

## Server Implementation

### New Files

```
apps/api/
├── api/grocery-lists/generate.ts      # POST /api/grocery-lists/generate
└── lib/grocery-generator.ts           # Consolidation + pantry deduction logic
```

### `lib/grocery-generator.ts`

Port from `apps/mobile/lib/groceryList.ts` and `apps/mobile/utils/categorizeIngredient.ts`:
- `normalizeIngredientName(name)` — lowercase, strip punctuation, remove adjectives
- `consolidateIngredients(recipes)` — deduplicate across recipes, sum quantities
- `buildPantryMap(pantryItems)` — map by normalized name
- `categorizeIngredient(name)` — keyword-based store section classification
- `getCategoryOrder(category)` — sort order for store layout
- `generateGroceryList(recipes, pantryItems)` — full pipeline

### `api/grocery-lists/generate.ts`

1. Authenticate user (Clerk)
2. Validate body with Zod (`z.object({ recipeIds: z.array(z.string().uuid()), name: z.string().default("Shopping List") })`)
3. Fetch requested recipes with ingredients (verify ownership)
4. Fetch user's pantry items
5. Run `generateGroceryList()` server-side
6. Insert grocery list + items into DB
7. Return complete list with items

---

## Client Changes

### Modified Files

- `apps/mobile/lib/groceryList.ts` — replace `generateGroceryList()` with a function that calls `POST /api/grocery-lists/generate`. Keep CRUD functions (`getGroceryLists`, `toggleGroceryItem`, etc.) unchanged. Remove `consolidateIngredients()`, `buildPantryMap()`, `normalizeIngredientName()`, `getItemsToBuy()`, `getItemsInPantry()`.
- `apps/mobile/screens/GroceryListScreen.tsx` — update to call the new single-endpoint generation function

### Deleted Files (after verification)

- `apps/mobile/utils/categorizeIngredient.ts` — logic moved to server's `lib/grocery-generator.ts`

### Kept Client-Side

- `getCategoryDisplayName()` — still needed for rendering category headers in the UI. Move to a small UI utility or inline.

---

## Acceptance Criteria

- [ ] `POST /api/grocery-lists/generate` returns a created list with consolidated items
- [ ] Ingredients from multiple recipes are deduplicated by normalized name
- [ ] Pantry items are correctly subtracted (`needToBuy = totalQuantity - pantryQuantity`)
- [ ] Items are categorized into store sections (produce, meat, dairy, etc.)
- [ ] Items are sorted by category order for store-layout display
- [ ] Recipe ownership is verified (can't generate list from another user's recipes)
- [ ] `pnpm typecheck` passes in both `apps/api` and `apps/mobile`
- [ ] Empty recipe IDs array returns 400 validation error
- [ ] Non-existent recipe IDs are silently skipped (partial generation)
