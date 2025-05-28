import { supabase } from "./supabase";
import { apiClient } from "./api";
import { Recipe } from "../models/Recipe";
import { MealPlanResponse, MealPlanFilters } from "../models/Meal";

export type AIRecipe = {
  title: string;
  ingredients: { name: string; quantity: number; unit: string }[];
  instructions: string;
};

/**
 * Fetches the user's recipes from the database
 */
export const getUserRecipes = async (): Promise<Recipe[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const response = await apiClient.get<{ data: Recipe[] }>('/recipes/fetch-recipes');
    return response?.data || [];
  } catch (error) {
    console.error('Error fetching user recipes:', error);
    return [];
  }
};

/**
 * Generates a meal plan based on the provided filters
 */
export const generateMealPlan = async (filters: Partial<MealPlanFilters>): Promise<MealPlanResponse> => {
  try {
    const response = await apiClient.post<{ data: MealPlanResponse }>('/meal-planner/generate', {
      days: filters.days || 7,
      servings: filters.servings || 4,
      usePantry: filters.usePantry || false,
      quickMeals: filters.quickMeals || false,
      includeBreakfast: filters.includeBreakfast ?? true,
      includeLunch: filters.includeLunch ?? true,
      includeDinner: filters.includeDinner ?? true,
      includeSnacks: filters.includeSnacks || false,
      dietaryRestrictions: filters.dietaryRestrictions || []
    });

    return response?.data || { days: [], shoppingList: [] }; // Return the data with fallback
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return { days: [], shoppingList: [] };
  }
};

/**
 * Saves the generated meal plan
 */
export const saveMealPlan = async (plan: MealPlanResponse): Promise<void> => {
  try {
    await apiClient.post('/meal-planner/save', {
      planData: plan
    });
  } catch (error) {
    console.error('Error saving meal plan:', error);
    throw error;
  }
};

/**
 * Fetches the user's saved meal plan if it exists
 */
export const getSavedMealPlan = async (): Promise<MealPlanResponse | null> => {
  try {
    const response = await apiClient.get<{ data: MealPlanResponse | null }>('/meal-planner/current');
    return response?.data || null;
  } catch (error) {
    console.error('Error fetching saved meal plan:', error);
    return null;
  }
};

/**
 * AI-powered meal plan generation using pantry items
 */
export const generateAIMealPlan = async (pantryItems: string[]): Promise<AIRecipe[]> => {
  try {
    const prompt = `
Given these pantry ingredients: ${pantryItems.join(', ')}, suggest 3 simple recipes.
Respond ONLY in the following JSON format:

[
  {
    "title": "Recipe Name",
    "ingredients": [
      { "name": "ingredient name", "quantity": 2, "unit": "cups" }
    ],
    "instructions": "Step-by-step instructions."
  }
]`;

    const response = await apiClient.post<{
      data: {
        choices: Array<{ message: { content: string } }>;
      }
    }>('/meal-planner/generate-ai', {
      user_id: (await supabase.auth.getUser()).data.user?.id,
      pantryItems,
    });

    const content = response?.data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse recipe JSON:', e, content);
      return [];
    }
  } catch (error) {
    console.error('Error generating AI meal plan:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate AI meal plan');
  }
};