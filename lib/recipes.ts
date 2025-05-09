import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import { Recipe } from '../models/Recipe';

export const addRecipe = async (recipe: Omit<Recipe, 'id' | 'user_id'>) => {
  const { data: userData } = await getCurrentUser();
  if (!userData?.user) throw new Error('Not signed in');

  const { data: insertedRecipe, error } = await supabase
    .from('recipes')
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
    .from('recipe_ingredients')
    .insert(ingredientInserts);

  if (ingredientError) throw ingredientError;

  return insertedRecipe;
};

export const getRecipes = async (): Promise<Recipe[]> => {
  const { data: userData } = await getCurrentUser();
  if (!userData?.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(*)')
    .eq('user_id', userData.user.id);

  if (error) throw error;
  return data as Recipe[];
};
