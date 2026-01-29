# Server Offload: Recipe-to-Pantry Matching (API-007)

## Overview

Move the "What Can I Make?" recipe-to-pantry matching algorithm from the mobile client to a new `POST /api/recipes/match` server-side endpoint. Currently the client fetches **all** user recipes and **all** pantry items, then runs fuzzy matching locally. The server endpoint performs matching in one round-trip and returns pre-sorted results.

---

## Problem

| Issue | Impact |
|-------|--------|
| Client fetches entire recipe + pantry dataset | Slow on large accounts, wastes bandwidth |
| Fuzzy matching + substitution groups run on device | Battery drain, UI thread blocking |
| Matching logic duplicated from server-side data | Can't optimize with SQL indexes or caching |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Pass pantry items from client or read server-side? | **Server reads pantry from DB** | Avoids sending full pantry payload; server already has user context |
| Return full recipe objects or just IDs + percentages? | **Full recipe with ingredients** | Client needs recipe data for card rendering; avoids N+1 fetches |
| Minimum match threshold? | **Client-specified (default 0)** | Lets the screen filter by "complete", "almost", or "any" |

---

## Endpoint

### `POST /api/recipes/match`

**Request:**
```json
{
  "minMatchPercentage": 0
}
```

**Response:**
```json
{
  "matches": [
    {
      "recipe": { "id": "...", "title": "...", "ingredients": [...], ... },
      "matchPercentage": 85,
      "haveIngredients": [
        {
          "recipeIngredient": { "name": "chicken", "quantity": 1, "unit": "lb" },
          "pantryItem": { "id": "...", "title": "chicken breast", "quantity": 2 },
          "hasEnough": true
        }
      ],
      "missingIngredients": [
        { "name": "soy sauce", "quantity": 2, "unit": "tbsp" }
      ],
      "totalIngredients": 8,
      "isCompleteMatch": false
    }
  ]
}
```

---

## Server Implementation

### New Files

```
apps/api/
├── api/recipes/match.ts           # POST /api/recipes/match endpoint
└── lib/ingredient-matching.ts     # Matching algorithm (ported from mobile)
```

### `lib/ingredient-matching.ts`

Port from `apps/mobile/lib/whatCanIMake.ts`:
- `normalizeIngredientName(name)` — lowercase, strip suffixes/plurals/parentheticals
- `ingredientsMatch(pantryItem, recipeIngredient)` — exact match, partial match, substitution groups
- `hasEnoughQuantity(pantryItem, recipeIngredient)` — quantity comparison (same unit only)
- `findRecipeMatches(recipes, pantryItems, minMatchPercentage)` — core algorithm

Substitution groups (chicken variants, pasta types, oil types, etc.) are ported as-is from the mobile code.

### `api/recipes/match.ts`

1. Authenticate user (Clerk)
2. Validate body with Zod (`z.object({ minMatchPercentage: z.number().min(0).max(100).default(0) })`)
3. Fetch all user recipes with ingredients from DB
4. Fetch all user pantry items from DB
5. Run `findRecipeMatches()` server-side
6. Return sorted matches

---

## Client Changes

### Modified Files

- `apps/mobile/lib/whatCanIMake.ts` — replace `findRecipeMatches()` to call `POST /api/recipes/match` instead of fetching data + matching locally. Keep the `RecipeMatch` and `IngredientMatch` type exports.
- `apps/mobile/screens/WhatCanIMakeScreen.tsx` — no changes needed (consumes same `RecipeMatch[]` shape)

### Deleted Code

- Remove `normalizeIngredientName()`, `ingredientsMatch()`, `hasEnoughQuantity()`, `findPantryMatch()` from `whatCanIMake.ts` (moved to server)
- Remove direct imports of `fetchAllUserRecipes` and `fetchPantryItems` from `whatCanIMake.ts`

---

## Acceptance Criteria

- [ ] `POST /api/recipes/match` returns sorted matches with correct percentages
- [ ] Fuzzy matching (partial names, substitution groups) works identically to current mobile logic
- [ ] `WhatCanIMakeScreen` renders the same results as before the migration
- [ ] `pnpm typecheck` passes in both `apps/api` and `apps/mobile`
- [ ] Empty pantry returns all recipes at 0% match
- [ ] Empty recipe list returns empty matches array
- [ ] Response includes full recipe objects with ingredients for card rendering
