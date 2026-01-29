# PRD: API-003 - Collection Management Endpoints

## Overview
Add missing CRUD endpoints for collections: update, delete, and recipe management (add/remove recipe from collection).

## Problem Statement
The collections API only has GET (list) and POST (create). Missing:
- PATCH/DELETE for individual collections (`/collections/[id]`)
- POST/DELETE for managing recipes in a collection (`/collections/[id]/recipes`)
- The `recipeCollections` junction table exists but has no endpoints to manage it

## Success Criteria
- [x] `GET /collections/[id]` - Get single collection with its recipes
- [x] `PATCH /collections/[id]` - Update collection name/description/color/icon
- [x] `DELETE /collections/[id]` - Delete collection (cascades to junction table)
- [x] `POST /collections/[id]/recipes` - Add recipe to collection
- [x] `DELETE /collections/[id]/recipes` - Remove recipe from collection
- [x] All new endpoints have Zod validation (using schemas from API-002)
- [x] All new endpoints enforce user ownership
- [x] `pnpm typecheck` passes

## Technical Approach

### Step 1: Create `api/collections/[id].ts`
- **GET**: Fetch collection by ID with recipes (via recipeCollections join). Verify ownership.
- **PATCH**: Update collection fields. Validate body with Zod. Verify ownership.
- **DELETE**: Delete collection. Verify ownership. Junction table entries cascade.

### Step 2: Create `api/collections/[id]/recipes.ts`
- **POST**: Add recipe to collection. Body: `{ recipeId: string }`. Verify both collection and recipe belong to user. Check for duplicate (recipe already in collection).
- **DELETE**: Remove recipe from collection. Body or query: `{ recipeId: string }`. Verify ownership.

### Step 3: Add Zod schemas
Add to `apps/api/lib/schemas.ts`:
- `updateCollectionSchema`: name?, description?, color?, icon? (all optional)
- `addRecipeToCollectionSchema`: recipeId (required uuid)
- `removeRecipeFromCollectionSchema`: recipeId (required uuid)

### Step 4: Verify
- `pnpm typecheck` passes

## Out of Scope
- Reordering recipes within a collection
- Bulk add/remove operations
- Collection sharing between users

## Promise Statement
STOP WHEN: All five new collection endpoints exist (GET/PATCH/DELETE for [id], POST/DELETE for [id]/recipes), they validate input with Zod, enforce user ownership, and `pnpm typecheck` passes with zero errors.
