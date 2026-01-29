// lib/whatCanIMake.ts
// Service for matching recipes to available pantry items
// Matching logic runs server-side; this module calls the API

import { RecipeWithIngredients } from "./recipeService";
import { PantryItem } from "../models/Product";
import { RecipeIngredient } from "../models/Recipe";
import { apiClient } from "./api/client";
import { RequestOptions } from "../hooks/useAbortableEffect";

export interface RecipeMatch {
  recipe: RecipeWithIngredients;
  matchPercentage: number;
  haveIngredients: IngredientMatch[];
  missingIngredients: RecipeIngredient[];
  totalIngredients: number;
  isCompleteMatch: boolean;
}

export interface IngredientMatch {
  recipeIngredient: RecipeIngredient;
  pantryItem: PantryItem;
  hasEnough: boolean;
}

interface MatchResponse {
  matches: RecipeMatch[];
}

/**
 * Calculate recipe matches based on pantry contents.
 * Calls the server-side matching endpoint.
 */
export async function findRecipeMatches(
  minMatchPercentage: number = 0,
  options?: RequestOptions,
): Promise<RecipeMatch[]> {
  try {
    const response = await apiClient.post<MatchResponse>(
      "/api/recipes/match",
      { minMatchPercentage },
      { signal: options?.signal },
    );
    return response.matches || [];
  } catch (error) {
    console.error("Error fetching recipe matches:", error);
    throw error;
  }
}

/**
 * Find recipes that can be made completely with current pantry
 */
export async function findCompleteMatches(): Promise<RecipeMatch[]> {
  const allMatches = await findRecipeMatches(100);
  return allMatches.filter(m => m.isCompleteMatch);
}

/**
 * Find recipes that are almost complete (80%+ match)
 */
export async function findAlmostCompleteMatches(): Promise<RecipeMatch[]> {
  const allMatches = await findRecipeMatches(80);
  return allMatches.filter(m => !m.isCompleteMatch);
}
