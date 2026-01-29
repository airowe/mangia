# PRD: API-002 - Input Validation with Zod

## Overview
Wire up Zod request body validation across all API endpoints. Zod is already a dependency but completely unused.

## Problem Statement
Every endpoint does `const body = req.body` and directly passes unvalidated fields to Drizzle insert/update calls. This means:
- No type safety on incoming request bodies
- No helpful error messages for malformed requests
- Missing required fields cause cryptic DB errors instead of 400 responses
- No input sanitization

## Success Criteria
- [ ] Zod schemas defined for every POST/PATCH endpoint request body
- [ ] All endpoints validate request bodies with Zod before processing
- [ ] Invalid requests return 400 with clear error messages (Zod error format)
- [ ] Shared validation helper function to reduce boilerplate
- [ ] `pnpm typecheck` passes

## Technical Approach

### Step 1: Create validation helper
Create `apps/api/lib/validation.ts`:
```typescript
import { z } from "zod";
import type { VercelResponse } from "@vercel/node";

export function validateBody<T extends z.ZodSchema>(
  body: unknown,
  schema: T,
  res: VercelResponse
): z.infer<T> | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten().fieldErrors,
    });
    return null;
  }
  return result.data;
}
```

### Step 2: Define schemas per resource
Create `apps/api/lib/schemas.ts` with Zod schemas for:

**Recipes:**
- `createRecipeSchema`: title (required string), description?, imageUrl?, sourceUrl?, sourceType? (enum), status? (enum), mealType? (enum), prepTime? (positive int), cookTime? (positive int), totalTime? (positive int), servings? (positive int), calories? (positive int), instructions? (string[]), notes?, ingredients? (array of ingredient objects)
- `updateRecipeSchema`: all fields optional (partial of create)
- `createIngredientSchema`: name (required), quantity? (number), unit?, category? (enum), notes?, isOptional? (boolean)

**Pantry:**
- `createPantryItemSchema`: name (required), quantity? (number), unit?, category? (enum), expiryDate? (string/date), notes?
- `updatePantryItemSchema`: partial of create

**Collections:**
- `createCollectionSchema`: name (required), description?, color?, icon?

**Cookbooks:**
- `createCookbookSchema`: title (required), author?, coverImageUrl?, isbn?, notes?
- `updateCookbookSchema`: partial of create

**Meal Plans:**
- `createMealPlanSchema`: date (required, YYYY-MM-DD format), mealType (required, enum), recipeId?, title?, notes?
- `updateMealPlanSchema`: recipeId?, title?, notes?, completed? (boolean)

**Recipe Notes:**
- `createRecipeNoteSchema`: note (required string), cookedAt? (YYYY-MM-DD)

### Step 3: Wire into endpoints
Update each endpoint handler to use `validateBody()` before processing.

### Step 4: Verify
- Test with invalid payloads to confirm 400 responses
- `pnpm typecheck` passes

## Out of Scope
- Query parameter validation (keep simple parseInt/string for now)
- Response schema validation
- OpenAPI/Swagger generation from Zod schemas

## Promise Statement
STOP WHEN: Every POST and PATCH endpoint validates its request body with Zod, invalid requests return 400 with field-level errors, and `pnpm typecheck` passes with zero errors.
