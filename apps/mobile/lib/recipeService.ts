// lib/recipeService.ts
// API service for recipe CRUD operations

import { apiClient } from "./api/client";
import { mockApi } from "./api/mockData";
import { Recipe, RecipeIngredient, RecipeStatus } from "../models/Recipe";
import { DEV_BYPASS_AUTH } from "./devConfig";
import { RequestOptions } from "../hooks/useAbortableEffect";

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredient[];
  difficulty?: string;
  formattedTotalTime?: string;
  servingSuggestions?: number[];
}

// API response types
interface RecipesResponse {
  recipes: RecipeWithIngredients[];
  total: number;
}

interface RecipeResponse {
  recipe: RecipeWithIngredients;
}

export interface RecipeFilterParams {
  status?: string;
  minRating?: number;
  maxTotalTime?: number;
  minServings?: number;
  mealType?: string;
  titleSearch?: string;
  search?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch recipes by status (want_to_cook, cooked, archived)
 */
export async function fetchRecipesByStatus(
  status: RecipeStatus,
  options?: RequestOptions,
): Promise<RecipeWithIngredients[]> {
  // Use mock data in dev bypass mode
  if (DEV_BYPASS_AUTH) {
    await simulateDelay();
    return mockApi.getRecipes(status);
  }

  try {
    const response = await apiClient.get<RecipesResponse>(
      `/api/recipes?status=${status}`,
      { signal: options?.signal }
    );
    return response.recipes || [];
  } catch (error) {
    console.error("Error fetching recipes:", error);
    throw error;
  }
}

/**
 * Fetch recipes with server-side filtering.
 * All filter logic (rating, time, servings, mealType) is applied on the server.
 */
export async function fetchFilteredRecipes(
  params: RecipeFilterParams = {},
  options?: RequestOptions,
): Promise<{ recipes: RecipeWithIngredients[]; total: number }> {
  if (DEV_BYPASS_AUTH) {
    await simulateDelay();
    const recipes = mockApi.getRecipes();
    return { recipes, total: recipes.length };
  }

  try {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    const url = qs ? `/api/recipes?${qs}` : "/api/recipes";
    const response = await apiClient.get<RecipesResponse>(url, {
      signal: options?.signal,
    });
    return {
      recipes: response.recipes || [],
      total: response.total ?? 0,
    };
  } catch (error) {
    console.error("Error fetching filtered recipes:", error);
    throw error;
  }
}

/**
 * Fetch all recipes for the current user
 */
export async function fetchAllUserRecipes(
  options?: RequestOptions,
): Promise<RecipeWithIngredients[]> {
  // Use mock data in dev bypass mode
  if (DEV_BYPASS_AUTH) {
    await simulateDelay();
    return mockApi.getRecipes();
  }

  try {
    const response = await apiClient.get<RecipesResponse>(
      '/api/recipes',
      { signal: options?.signal }
    );
    return response.recipes || [];
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
  options?: RequestOptions,
): Promise<RecipeWithIngredients | null> {
  // Use mock data in dev bypass mode
  if (DEV_BYPASS_AUTH) {
    await simulateDelay();
    return mockApi.getRecipeById(recipeId);
  }

  try {
    const response = await apiClient.get<RecipeResponse>(
      `/api/recipes/${recipeId}`,
      { signal: options?.signal }
    );
    return response.recipe || null;
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
  // Use mock data in dev bypass mode
  if (DEV_BYPASS_AUTH) {
    await simulateDelay();
    mockApi.updateRecipe(recipeId, { status });
    return;
  }

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
  // Use mock data in dev bypass mode
  if (DEV_BYPASS_AUTH) {
    await simulateDelay();
    mockApi.deleteRecipe(recipeId);
    return;
  }

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
  options?: RequestOptions,
): Promise<RecipeWithIngredients[]> {
  // Use mock data in dev bypass mode
  if (DEV_BYPASS_AUTH) {
    await simulateDelay();
    return mockApi.searchRecipes(query);
  }

  try {
    const response = await apiClient.get<RecipesResponse>(
      `/api/recipes?search=${encodeURIComponent(query)}`,
      { signal: options?.signal }
    );
    return response.recipes || [];
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
  // Use mock data in dev bypass mode
  if (DEV_BYPASS_AUTH) {
    await simulateDelay();
    return mockApi.createRecipe({ ...recipe, ingredients } as any);
  }

  try {
    const response = await apiClient.post<RecipeResponse>('/api/recipes', {
      ...recipe,
      ingredients,
    });
    return response.recipe;
  } catch (error) {
    console.error("Error creating recipe:", error);
    throw error;
  }
}

/**
 * Fetch recently added recipes
 */
export async function getRecentRecipes(
  limit: number = 5,
  options?: RequestOptions,
): Promise<RecipeWithIngredients[]> {
  // Use mock data in dev bypass mode
  if (DEV_BYPASS_AUTH) {
    await simulateDelay();
    const allRecipes = mockApi.getRecipes();
    // Sort by createdAt descending and take the first N
    return allRecipes
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  try {
    const response = await apiClient.get<RecipesResponse>(
      `/api/recipes?limit=${limit}&sort=created_at:desc`,
      { signal: options?.signal }
    );
    return response.recipes || [];
  } catch (error) {
    console.error("Error fetching recent recipes:", error);
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
  // Use mock data in dev bypass mode
  if (DEV_BYPASS_AUTH) {
    await simulateDelay();
    const result = mockApi.updateRecipe(recipeId, { ...updates, ingredients } as any);
    if (!result) throw new Error('Recipe not found');
    return result;
  }

  try {
    const response = await apiClient.patch<RecipeResponse>(
      `/api/recipes/${recipeId}`,
      { ...updates, ingredients }
    );
    return response.recipe;
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw error;
  }
}

/**
 * Import a recipe from a URL via the server-side parsing endpoint.
 * The server handles transcript fetching, AI extraction, and DB insert.
 */
export async function importRecipeFromUrl(
  url: string,
): Promise<RecipeWithIngredients> {
  try {
    const response = await apiClient.post<RecipeResponse>(
      "/api/recipes/import",
      { url },
    );
    return response.recipe;
  } catch (error) {
    console.error("Error importing recipe from URL:", error);
    throw error;
  }
}

/**
 * Simulate network delay for more realistic dev experience
 */
function simulateDelay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
