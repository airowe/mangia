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

const apiURL = `${process.env.EXPO_PUBLIC_API_URL}/recipes` || 'http://localhost:3000/recipes';

interface FetchRecipesParams {
  search?: string;
  user_id?: string;
  meal_type?: string;
}

export async function fetchRecipes(
  params: FetchRecipesParams = {}
): Promise<Recipe[]> {
  const { data: userData } = await getCurrentUser();
  if (!userData?.user || !userData.session) throw new Error("Not signed in");
  
  // Build query parameters without user_id
  const query = new URLSearchParams({
    ...(params.search && { search: params.search }),
    ...(params.meal_type && { meal_type: params.meal_type })
  });
  
  const response = await fetch(`${apiURL}?${query}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userData.session.access_token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch recipes');
  }
  
  return response.json();
}

export const fetchRecipeById = async (id: string): Promise<Recipe> => {
  const { data: userData } = await getCurrentUser();
  if (!userData?.user) throw new Error("Not signed in");
  
  const response = await fetch(`${apiURL}/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userData.session?.access_token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch recipe');
  }
  
  return response.json();
};

export const fetchAllRecipes = async (): Promise<Recipe[]> => {
  const { data: userData } = await getCurrentUser();
  if (!userData?.user) throw new Error("Not signed in");
  
  const response = await fetch(apiURL, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userData.session?.access_token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch recipes');
  }
  
  return response.json();
};
