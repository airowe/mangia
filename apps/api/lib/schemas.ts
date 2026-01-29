// lib/schemas.ts
// Zod validation schemas for all API request bodies

import { z } from "zod";

// Shared enums matching DB schema
const recipeStatusEnum = z.enum(["want_to_cook", "cooked", "archived"]);
const mealTypeEnum = z.enum(["breakfast", "lunch", "dinner", "snack", "dessert", "other"]);
const ingredientCategoryEnum = z.enum([
  "produce", "meat_seafood", "dairy_eggs", "bakery",
  "frozen", "canned", "pantry", "other",
]);

// --- Recipes ---

const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  quantity: z.number().positive().optional().nullable(),
  unit: z.string().optional().nullable(),
  category: ingredientCategoryEnum.optional().default("other"),
  notes: z.string().optional().nullable(),
  isOptional: z.boolean().optional().default(false),
});

export const createRecipeSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  sourceType: z.string().optional().nullable(),
  status: recipeStatusEnum.optional().default("want_to_cook"),
  mealType: mealTypeEnum.optional().nullable(),
  prepTime: z.number().int().nonnegative().optional().nullable(),
  cookTime: z.number().int().nonnegative().optional().nullable(),
  totalTime: z.number().int().nonnegative().optional().nullable(),
  servings: z.number().int().positive().optional().nullable(),
  calories: z.number().int().nonnegative().optional().nullable(),
  instructions: z.array(z.string()).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  ingredients: z.array(ingredientSchema).optional(),
});

export const updateRecipeSchema = createRecipeSchema
  .omit({ ingredients: true })
  .partial()
  .extend({
    rating: z.number().int().min(1).max(5).optional().nullable(),
    ingredients: z.array(ingredientSchema).optional(),
  });

// --- Pantry ---

export const createPantryItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(500),
  quantity: z.number().nonnegative().optional().nullable(),
  unit: z.string().max(100).optional().nullable(),
  category: ingredientCategoryEnum.optional().default("other"),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const updatePantryItemSchema = createPantryItemSchema.partial();

// --- Collections ---

export const createCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
});

// --- Cookbooks ---

export const createCookbookSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  author: z.string().max(200).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  isbn: z.string().max(20).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateCookbookSchema = createCookbookSchema.partial();

// --- Meal Plans ---

export const createMealPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  mealType: mealTypeEnum,
  recipeId: z.string().uuid().optional().nullable(),
  title: z.string().max(500).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateMealPlanSchema = z.object({
  recipeId: z.string().uuid().optional().nullable(),
  title: z.string().max(500).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  completed: z.boolean().optional(),
});

// --- Recipe Notes ---

export const createRecipeNoteSchema = z.object({
  note: z.string().min(1, "Note content is required").max(10000),
  cookedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format").optional().nullable(),
});
