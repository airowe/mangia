# PRD: API-005 - Recipe Search & Filtering

## Overview
Add search and filtering capabilities to the GET /recipes endpoint.

## Problem Statement
The current GET /recipes endpoint only supports filtering by `status`. Users need to:
- Search recipes by title/description
- Filter by meal type, source type
- Sort by different fields (newest, rating, most cooked, alphabetical)
- Get total count for pagination

## Success Criteria
- [x] `GET /recipes` supports `search` query param (searches title and description, case-insensitive)
- [x] `GET /recipes` supports `mealType` filter
- [x] `GET /recipes` supports `sourceType` filter
- [x] `GET /recipes` supports `sort` param: `newest` (default), `oldest`, `rating`, `most_cooked`, `alphabetical`
- [x] `GET /recipes` returns `total` count alongside `recipes` array for pagination
- [x] Existing `status`, `limit`, `offset` params still work
- [x] Multiple filters can be combined
- [ ] `pnpm typecheck` passes

## Technical Approach

### Step 1: Update GET /recipes handler
In `api/recipes/index.ts`, update the GET handler:

```typescript
const { status, mealType, sourceType, search, sort = "newest", limit = "50", offset = "0" } = req.query;

// Build where conditions
const conditions = [eq(recipes.userId, user.id)];

if (status) conditions.push(eq(recipes.status, status as string));
if (mealType) conditions.push(eq(recipes.mealType, mealType as string));
if (sourceType) conditions.push(eq(recipes.sourceType, sourceType as string));
if (search) {
  const searchTerm = `%${(search as string).toLowerCase()}%`;
  conditions.push(
    or(
      ilike(recipes.title, searchTerm),
      ilike(recipes.description, searchTerm)
    )
  );
}

// Build order by
const orderMap = {
  newest: desc(recipes.createdAt),
  oldest: asc(recipes.createdAt),
  rating: desc(recipes.rating),
  most_cooked: desc(recipes.cookCount),
  alphabetical: asc(recipes.title),
};
const orderBy = orderMap[sort as string] || orderMap.newest;
```

### Step 2: Add total count
Return both `recipes` and `total` in the response:
```typescript
const [userRecipes, countResult] = await Promise.all([
  db.query.recipes.findMany({ where: and(...conditions), ... }),
  db.select({ count: sql<number>`count(*)` }).from(recipes).where(and(...conditions)),
]);

return res.json({ recipes: userRecipes, total: countResult[0].count });
```

### Step 3: Import necessary Drizzle functions
Add `and`, `or`, `ilike`, `asc` imports from `drizzle-orm`.

### Step 4: Verify
- `pnpm typecheck` passes

## Out of Scope
- Full-text search (pg_trgm, tsvector)
- Filtering by ingredient
- Filtering by cook time range
- Saved filters / smart collections

## Promise Statement
STOP WHEN: GET /recipes supports search, mealType filter, sourceType filter, sort options, and returns total count for pagination, and `pnpm typecheck` passes with zero errors.
