// lib/recipeService.ts
// API service for recipe CRUD operations

import { apiClient } from "./api/client";
import { Recipe, RecipeIngredient, RecipeStatus } from "../models/Recipe";

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredient[];
}

/**
 * Fetch recipes by status (want_to_cook, cooked, archived)
 */
export async function fetchRecipesByStatus(
  status: RecipeStatus,
): Promise<RecipeWithIngredients[]> {
  try {
    const data = await apiClient.get<RecipeWithIngredients[]>(
      `/api/recipes?status=${status}`
    );
    return data || [];
  } catch (error) {
    console.error("Error fetching recipes:", error);
    throw error;
  }
}

/**
 * Fetch all recipes for the current user
 */
export async function fetchAllUserRecipes(): Promise<RecipeWithIngredients[]> {
  try {
    const data = await apiClient.get<RecipeWithIngredients[]>('/api/recipes');
    return data || [];
  } catch (error) {
    console.error("Error fetching recipes:", error);
    throw error;
  }
}

/**
 * Fetch a single recipe by ID
 */
export async function fetchRecipeById(
  recipeId: string,
): Promise<RecipeWithIngredients | null> {
  try {
    const data = await apiClient.get<RecipeWithIngredients>(`/api/recipes/${recipeId}`);
    return data || null;
  } catch (error) {
    console.error("Error fetching recipe:", error);
    throw error;
  }
}

/**
 * Update recipe status
 */
export async function updateRecipeStatus(
  recipeId: string,
  status: RecipeStatus,
): Promise<void> {
  try {
    await apiClient.patch(`/api/recipes/${recipeId}`, { status });
  } catch (error) {
    console.error("Error updating recipe status:", error);
    throw error;
  }
}

/**
 * Delete a recipe
 */
export async function deleteRecipe(recipeId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/recipes/${recipeId}`);
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  }
}

/**
 * Mark recipe as cooked
 */
export async function markAsCooked(recipeId: string): Promise<void> {
  return updateRecipeStatus(recipeId, "cooked");
}

/**
 * Archive a recipe
 */
export async function archiveRecipe(recipeId: string): Promise<void> {
  return updateRecipeStatus(recipeId, "archived");
}

/**
 * Restore recipe to want_to_cook
 */
export async function restoreRecipe(recipeId: string): Promise<void> {
  return updateRecipeStatus(recipeId, "want_to_cook");
}

/**
 * Search recipes by title
 */
export async function searchRecipes(
  query: string,
): Promise<RecipeWithIngredients[]> {
  try {
    const data = await apiClient.get<RecipeWithIngredients[]>(
      `/api/recipes?search=${encodeURIComponent(query)}`
    );
    return data || [];
  } catch (error) {
    console.error("Error searching recipes:", error);
    throw error;
  }
}

/**
 * Create a new recipe
 */
export async function createRecipe(
  recipe: Partial<Recipe>,
  ingredients?: RecipeIngredient[]
): Promise<RecipeWithIngredients> {
  try {
    const data = await apiClient.post<RecipeWithIngredients>('/api/recipes', {
      ...recipe,
      ingredients,
    });
    return data;
  } catch (error) {
    console.error("Error creating recipe:", error);
    throw error;
  }
}

/**
 * Update a recipe
 */
export async function updateRecipe(
  recipeId: string,
  updates: Partial<Recipe>,
  ingredients?: RecipeIngredient[]
): Promise<RecipeWithIngredients> {
  try {
    const data = await apiClient.patch<RecipeWithIngredients>(
      `/api/recipes/${recipeId}`,
      { ...updates, ingredients }
    );
    return data;
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw error;
  }
}
