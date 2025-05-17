import { supabase } from "./supabase";
import { getCurrentUser } from "./auth";
import { Recipe } from "../models/Recipe";

export const addRecipe = async (recipe: Omit<Recipe, "id" | "user_id">) => {
  const { data: userData } = await getCurrentUser();
  if (!userData?.user) throw new Error("Not signed in");

  const { data: insertedRecipe, error } = await supabase
    .from("recipes")
    .insert([{ ...recipe, user_id: userData.user.id }])
    .select()
    .single();

  if (error) throw error;

  // Insert ingredients
  const ingredientInserts = recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    recipe_id: insertedRecipe.id,
  }));

  const { error: ingredientError } = await supabase
    .from("recipe_ingredients")
    .insert(ingredientInserts);

  if (ingredientError) throw ingredientError;

  return insertedRecipe;
};

const apiURL = process.env.EXPO_PUBLIC_API_URL;

interface FetchRecipesParams {
  search?: string;
  user_id?: string;
}

export async function fetchRecipes(
  params: FetchRecipesParams = {}
): Promise<Recipe[]> {
  const { data: userData } = await getCurrentUser();
  if (!userData?.user) throw new Error("Not signed in");
  const userId = userData.user.id;
  params.user_id = userId;
  const query = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  const response = await fetch(`${apiURL}?${query}`);
  if (!response.ok) throw new Error("Failed to fetch recipes");
  return await response.json();
}

export async function fetchRecipeById(id: string): Promise<Recipe> {
  const response = await fetch(`${apiURL}/${id}`);
  if (!response.ok) throw new Error("Failed to fetch recipe");
  return await response.json();
}

export async function fetchAllRecipes(): Promise<Recipe[]> {
  const response = await fetch(`${apiURL}/all`);
  if (!response.ok) throw new Error("Failed to fetch all recipes");
  return await response.json();
}
