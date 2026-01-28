import { apiClient } from "./api/client";
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
    const response = await apiClient.get<Recipe[]>('/api/recipes');
    return response || [];
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
    const response = await apiClient.post<MealPlanResponse>('/api/meal-planner/generate', {
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

    return response || { days: [], shoppingList: [] };
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
    await apiClient.post('/api/meal-planner/save', {
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
    const response = await apiClient.get<MealPlanResponse | null>('/api/meal-planner/current');
    return response || null;
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
    const response = await apiClient.post<AIRecipe[]>('/api/meal-planner/generate-ai', {
      pantryItems,
    });

    return response || [];
  } catch (error) {
    console.error('Error generating AI meal plan:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate AI meal plan');
  }
};
