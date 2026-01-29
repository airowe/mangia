# PRD: API-001 - Type Safety & Case Normalization

## Overview
Fix the camelCase/snake_case mismatch between Drizzle ORM responses (camelCase) and shared types (snake_case) so the API contract matches what the mobile client expects.

## Problem Statement
Drizzle ORM returns column values using the JS property names defined in the schema (camelCase: `imageUrl`, `sourceType`, `prepTime`), but `@mangia/shared` types use snake_case (`image_url`, `source_type`, `prep_time`) — matching the client's original Supabase convention.

This means the API returns `{ imageUrl: "..." }` but the client expects `{ image_url: "..." }`. Every endpoint response is affected.

## Decision: Which Case Wins?
**camelCase wins.** Rationale:
- Drizzle already returns camelCase — no transformation layer needed
- camelCase is the JS/TS convention
- Changing the API to emit snake_case would require a transform on every response
- Better to update `@mangia/shared` types to camelCase and update client model imports

## Success Criteria
- [x] All `@mangia/shared` type interfaces use camelCase property names
- [x] Shared types match Drizzle `$inferSelect` output exactly for all tables
- [x] Remove fields from shared types that don't exist in the DB schema (`is_ai_generated`, `source`, `dietary_restrictions`, `is_default`, `display_order` on collections, `display_order` on RecipeCollectionItem)
- [x] Add missing fields that exist in DB but not in shared types (`calories`, `totalTime`, `cookCount`, `notes` on ingredients, `isOptional`, `orderIndex`)
- [x] Mobile client compiles without errors after type changes (update any snake_case property access in client code)
- [x] `pnpm typecheck` passes across all packages

## Technical Approach

### Step 1: Update `packages/shared/src/types/recipe.ts`
Convert all interfaces to camelCase:
- `RecipeIngredient`: `recipe_id` → `recipeId`, `display_order` → `orderIndex`, add `notes`, `isOptional`
- `Recipe`: `user_id` → `userId`, `image_url` → `imageUrl`, `source_url` → `sourceUrl`, `source_type` → `sourceType`, `prep_time` → `prepTime`, `cook_time` → `cookTime`, `created_at` → `createdAt`, `updated_at` → `updatedAt`, `last_cooked_at` → `lastCookedAt`, `meal_type` → `mealType`, `times_cooked` → `cookCount`, add `totalTime`, `calories`. Remove `dietary_restrictions`, `is_ai_generated`, `source`.
- `RecipeNote`: `recipe_id` → `recipeId`, `user_id` → `userId`, `cooked_at` → `cookedAt`, `created_at` → `createdAt`, `updated_at` → `updatedAt`
- `ParsedRecipe`: `prep_time` → `prepTime`, `cook_time` → `cookTime`, `image_url` → `imageUrl`

### Step 2: Update `packages/shared/src/types/collection.ts`
- `RecipeCollection`: `user_id` → `userId`, `created_at` → `createdAt`, `updated_at` → `updatedAt`. Remove `is_default`, `display_order` (not in DB).
- `RecipeCollectionItem`: `collection_id` → `collectionId`, `recipe_id` → `recipeId`, `added_at` → `addedAt`. Remove `display_order`.
- `CollectionWithCount`: `recipe_count` → `recipeCount`
- `CollectionWithRecipes`: nested recipes use `imageUrl`, `cookTime`, `prepTime`

### Step 3: Update `packages/shared/src/types/pantry.ts`
- `PantryItem`: `user_id` → `userId`, `expiry_date` → `expiryDate`, `created_at` → `createdAt`, `updated_at` → `updatedAt`
- `Product`: if it has snake_case fields, convert them

### Step 4: Update `packages/shared/src/types/meal.ts`
- `Meal`/`MealPlanDay` etc: convert all snake_case to camelCase
- `ShoppingListItem`: convert if needed

### Step 5: Update `packages/shared/src/types/grocery.ts`
- Convert any snake_case properties

### Step 6: Update `packages/shared/src/types/cookbook.ts`
- `Cookbook`: `user_id` → `userId`, `cover_image_url` → `coverImageUrl`, `created_at` → `createdAt`, `updated_at` → `updatedAt`

### Step 7: Update mobile client code
- Search for all snake_case property access patterns (e.g., `.image_url`, `.source_type`, `.prep_time`, etc.)
- Update to camelCase equivalents
- Update any object literals that construct these types

### Step 8: Verify
- `pnpm typecheck` passes for all 3 packages
- No snake_case properties remain in shared types (except enum values like `want_to_cook` which are DB enum values, not property names)

## Out of Scope
- Adding Zod validation (API-002)
- Adding new endpoints (API-003)
- Changing DB column names (they stay snake_case in Postgres)

## Promise Statement
STOP WHEN: All shared types use camelCase properties matching Drizzle output, mobile client code is updated to use camelCase, and `pnpm typecheck` passes with zero errors across all packages.
