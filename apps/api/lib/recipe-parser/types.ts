// lib/recipe-parser/types.ts
// Internal types for the server-side recipe parsing pipeline

export type UrlType = "tiktok" | "youtube" | "instagram" | "blog";

export interface ParsedRecipeIngredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface ParsedRecipe {
  title: string;
  description?: string;
  ingredients: ParsedRecipeIngredient[];
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
}

/**
 * Raw shape returned by AI before normalization.
 * Fields may be strings, numbers, arrays of strings, or arrays of objects.
 */
export interface RawExtractedRecipe {
  title?: unknown;
  description?: unknown;
  ingredients?: unknown;
  instructions?: unknown;
  prep_time?: unknown;
  cook_time?: unknown;
  prepTime?: unknown;
  cookTime?: unknown;
  servings?: unknown;
  image?: unknown;
  image_url?: unknown;
  imageUrl?: unknown;
}
