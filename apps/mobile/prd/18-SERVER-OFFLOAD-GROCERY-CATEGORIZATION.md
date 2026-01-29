# Server Offload: Manual Grocery Item Categorization (API-015)

## Overview

When users manually add items to their grocery list in `GroceryListScreen`, the item is assigned `category: "other"` by default. The server already has `categorizeIngredient()` in `lib/grocery-generator.ts` which maps ingredient names to categories using keyword matching. Expose this as a lightweight endpoint so manually added items get proper categories.

---

## Problem

| Issue | Impact |
|-------|--------|
| Manually added items always get `category: "other"` | Items don't appear in correct category groups |
| `categorizeIngredient()` exists on server but isn't accessible from grocery list screen | Duplicating the logic client-side would bloat the app bundle |
| Inconsistent categorization between imported and manual items | Confusing UX |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| New endpoint or inline in existing? | **New `POST /api/ingredients/categorize`** | Generic utility, usable from multiple screens |
| Single item or batch? | **Batch** — accept `{ names: string[] }` | Efficient for adding multiple items at once |

---

## Endpoint

### `POST /api/ingredients/categorize`

**Request:**
```json
{ "names": ["chicken breast", "olive oil", "basil"] }
```

**Response:**
```json
{
  "categories": [
    { "name": "chicken breast", "category": "meat_seafood" },
    { "name": "olive oil", "category": "pantry" },
    { "name": "basil", "category": "produce" }
  ]
}
```

### Server Implementation

New file: `apps/api/api/ingredients/categorize.ts`
1. Authenticate user
2. Validate body: `z.object({ names: z.array(z.string().min(1)).min(1).max(100) })`
3. Map each name through `categorizeIngredient()` from `lib/grocery-generator.ts`
4. Return results

### Client Changes

**`apps/mobile/screens/GroceryListScreen.tsx`:**
- On `handleAddItem`, call `POST /api/ingredients/categorize` with the item name
- Use returned category instead of hardcoded `"other"`
- Fallback to `"other"` if the API call fails

---

## Acceptance Criteria

- [ ] `POST /api/ingredients/categorize` returns correct categories for known ingredients
- [ ] Unknown ingredients return `"other"`
- [ ] Batch mode works (multiple names in one request)
- [ ] `GroceryListScreen` uses server-provided category for manually added items
- [ ] `pnpm typecheck` passes in all packages
