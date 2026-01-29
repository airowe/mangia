# Server Offload: Recipe Filtering & Smart Queries (API-011)

## Overview

Move all recipe filtering logic from the `RecipesScreen` client-side `useMemo` to the existing `GET /api/recipes` server endpoint. Currently the client makes **two separate API calls** (`?status=want_to_cook` and `?status=cooked`), merges the results, then applies filter logic (favorites, quick meals, dinner, dessert) in JavaScript. The server should handle all filtering in a single SQL query and return pre-filtered, paginated results.

---

## Problem

| Issue | Impact |
|-------|--------|
| Client makes 2 API calls per screen load and merges results | Double latency, wasted bandwidth, complex client code |
| Filter logic (rating, time, servings, keyword matching) runs on device | Blocks JS thread, no benefit from DB indexes |
| All recipes are fetched regardless of active filter | Wasteful on accounts with hundreds of recipes |
| Filter definitions are hardcoded in `RecipesScreen.tsx` (lines 121-165) | Can't evolve filters without app update |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| New endpoint or extend existing `GET /api/recipes`? | **Extend existing** | Endpoint already supports `status`, `mealType`, `search`, `sort`, `limit`, `offset` — add missing params |
| How to handle multi-status queries (want_to_cook + cooked)? | **New `status` accepts CSV** | `?status=want_to_cook,cooked` parsed as array; single value still works |
| Named filters ("favorites", "quick") or raw params? | **Raw params** | More flexible; client maps filter names to params. Server stays generic |
| Remove client-side filtering entirely? | **Yes** | Server handles all filtering. Client `useMemo` becomes a no-op passthrough |

---

## New Query Parameters for `GET /api/recipes`

| Param | Type | Description | Example |
|-------|------|-------------|---------|
| `status` | `string` (CSV) | Comma-separated statuses | `?status=want_to_cook,cooked` |
| `minRating` | `number` | Minimum rating (inclusive) | `?minRating=4` (favorites) |
| `maxTotalTime` | `number` | Max total time in minutes (prepTime + cookTime) | `?maxTotalTime=30` (quick meals) |
| `minServings` | `number` | Minimum servings (inclusive) | `?minServings=4` |
| `titleSearch` | `string` | Case-insensitive title keyword match | `?titleSearch=cake` |

Existing params remain unchanged: `mealType`, `sourceType`, `search`, `sort`, `limit`, `offset`.

---

## Filter Mapping

The client maps each named filter to server query params:

| Filter | Current Client Logic | Server Params |
|--------|---------------------|---------------|
| `all` | No filter | `?status=want_to_cook,cooked` |
| `favorites` | `rating >= 4` | `?status=want_to_cook,cooked&minRating=4` |
| `quick` | `prepTime + cookTime > 0 && <= 30` | `?status=want_to_cook,cooked&maxTotalTime=30` |
| `dinner` | `mealType includes "dinner" OR servings >= 4` | `?status=want_to_cook,cooked&mealType=dinner` (Note: servings heuristic dropped — see below) |
| `dessert` | `mealType includes "dessert" OR title includes "dessert"/"cake"/"cookie"` | `?status=want_to_cook,cooked&mealType=dessert` (Note: title keyword heuristic dropped — see below) |

### Heuristic Simplification

The current client-side "dinner" filter uses `mealType === "dinner" OR servings >= 4` as a heuristic. The "dessert" filter uses `mealType === "dessert" OR title matches keywords`. These heuristics exist because imported recipes often lack `mealType`. Instead of replicating fuzzy heuristics on the server:

1. **Primary approach**: Filter by `mealType` only (clean, indexable)
2. **Future improvement**: Run a one-time backfill to categorize recipes missing `mealType` using AI (similar to ingredient categorization backfill in API-009)

This trades a small number of uncategorized recipes for clean SQL filtering. The `titleSearch` param is still available if the client wants to add a secondary keyword search.

---

## Server Implementation

### Modified File: `apps/api/api/recipes/index.ts`

Add to the GET handler's query parsing and condition building:

```typescript
// Multi-status support
if (status && typeof status === "string") {
  const statuses = status.split(",").map(s => s.trim());
  if (statuses.length === 1) {
    conditions.push(eq(recipes.status, statuses[0] as any));
  } else {
    conditions.push(inArray(recipes.status, statuses as any));
  }
}

// Min rating filter
if (minRating && typeof minRating === "string") {
  conditions.push(gte(recipes.rating, parseInt(minRating)));
}

// Max total time filter (uses totalTime column, falls back to prepTime + cookTime)
if (maxTotalTime && typeof maxTotalTime === "string") {
  const maxMinutes = parseInt(maxTotalTime);
  conditions.push(
    or(
      lte(recipes.totalTime, maxMinutes),
      and(
        sql`${recipes.totalTime} IS NULL`,
        lte(sql`COALESCE(${recipes.prepTime}, 0) + COALESCE(${recipes.cookTime}, 0)`, maxMinutes),
        sql`COALESCE(${recipes.prepTime}, 0) + COALESCE(${recipes.cookTime}, 0) > 0`
      )
    )!
  );
}

// Min servings filter
if (minServings && typeof minServings === "string") {
  conditions.push(gte(recipes.servings, parseInt(minServings)));
}

// Title keyword search (separate from full-text search)
if (titleSearch && typeof titleSearch === "string") {
  conditions.push(ilike(recipes.title, `%${titleSearch}%`));
}
```

New imports needed: `inArray`, `gte`, `lte` from `drizzle-orm`.

---

## Client Changes

### Modified File: `apps/mobile/lib/recipeService.ts`

Add a new function that replaces the two-call pattern:

```typescript
export async function fetchFilteredRecipes(params: {
  status?: string;          // CSV: "want_to_cook,cooked"
  minRating?: number;
  maxTotalTime?: number;
  minServings?: number;
  mealType?: string;
  titleSearch?: string;
  search?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}, options?: RequestOptions): Promise<{ recipes: RecipeWithIngredients[]; total: number }>
```

### Modified File: `apps/mobile/screens/RecipesScreen.tsx`

**Remove:**
- Lines 82-99: Two `fetchRecipesByStatus` calls and merge logic
- Lines 121-165: `filteredRecipes` `useMemo` with client-side filter logic

**Replace with:**
- Single `fetchFilteredRecipes()` call that changes params when `activeFilter` changes
- The response is used directly — no client-side post-filtering
- Filter buttons trigger a re-fetch with updated params instead of re-filtering cached data

### No New Files

This change extends existing code only.

---

## Acceptance Criteria

- [ ] `GET /api/recipes?status=want_to_cook,cooked` returns recipes with either status
- [ ] `GET /api/recipes?minRating=4` returns only recipes with rating >= 4
- [ ] `GET /api/recipes?maxTotalTime=30` returns only recipes where total time <= 30 minutes
- [ ] `GET /api/recipes?minServings=4` returns only recipes with servings >= 4
- [ ] `GET /api/recipes?mealType=dessert` returns only dessert recipes
- [ ] `GET /api/recipes?titleSearch=cake` returns recipes with "cake" in the title
- [ ] Multiple filters can be combined: `?status=want_to_cook,cooked&minRating=4&sort=rating`
- [ ] `RecipesScreen` makes a single API call instead of two
- [ ] `RecipesScreen` no longer does client-side filtering in `useMemo`
- [ ] `pnpm typecheck` passes in both `apps/api` and `apps/mobile`
- [ ] Pagination (`total` count) reflects the filtered result set
- [ ] Empty results return `{ recipes: [], total: 0 }`
