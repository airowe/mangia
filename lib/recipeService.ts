// lib/recipeService.ts
// Direct Supabase service for recipe CRUD operations

import { supabase } from "./supabase";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      ingredients:recipe_ingredients(*)
    `,
    )
    .eq("user_id", user.id)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching recipes:", error);
    throw error;
  }

  return (data || []) as RecipeWithIngredients[];
}

/**
 * Fetch all recipes for the current user
 */
export async function fetchAllUserRecipes(): Promise<RecipeWithIngredients[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      ingredients:recipe_ingredients(*)
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching recipes:", error);
    throw error;
  }

  return (data || []) as RecipeWithIngredients[];
}

/**
 * Fetch a single recipe by ID
 */
export async function fetchRecipeById(
  recipeId: string,
): Promise<RecipeWithIngredients | null> {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      ingredients:recipe_ingredients(*)
    `,
    )
    .eq("id", recipeId)
    .single();

  if (error) {
    console.error("Error fetching recipe:", error);
    throw error;
  }

  return data as RecipeWithIngredients;
}

/**
 * Update recipe status
 */
export async function updateRecipeStatus(
  recipeId: string,
  status: RecipeStatus,
): Promise<void> {
  const { error } = await supabase
    .from("recipes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", recipeId);

  if (error) {
    console.error("Error updating recipe status:", error);
    throw error;
  }
}

/**
 * Delete a recipe
 */
export async function deleteRecipe(recipeId: string): Promise<void> {
  // First delete ingredients (cascade should handle this, but be explicit)
  await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId);

  const { error } = await supabase.from("recipes").delete().eq("id", recipeId);

  if (error) {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      ingredients:recipe_ingredients(*)
    `,
    )
    .eq("user_id", user.id)
    .ilike("title", `%${query}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error searching recipes:", error);
    throw error;
  }

  return (data || []) as RecipeWithIngredients[];
}
