import { apiClient } from './client';
import { Recipe, RecipeIngredient } from '../../models/Recipe';

export interface MealPlanFilters {
  days: number;
  servings?: number;
  cuisine?: string[];
  dietaryRestrictions?: string[];
  maxCookingTime?: number;
  includeBreakfast?: boolean;
  includeLunch?: boolean;
  includeDinner?: boolean;
  includeSnacks?: boolean;
  usePantryItems?: boolean;
  quickMealsOnly?: boolean;
}

export interface MealPlanDay {
  date: string;
  meals: {
    breakfast?: Recipe | null;
    lunch?: Recipe | null;
    dinner?: Recipe | null;
    snacks?: Recipe[];
  };
  shoppingList?: {
    ingredients: {
      name: string;
      amount: string;
      unit: string;
      inPantry: boolean;
    }[];
  };
}

export interface MealPlanResponse {
  days: MealPlanDay[];
  shoppingList: {
    ingredients: {
      name: string;
      amount: string;
      unit: string;
      inPantry: boolean;
    }[];
  };
}

export const recipeApi = {
  // Get user's saved recipes
  async getUserRecipes(): Promise<Recipe[]> {
    const response = await apiClient.get<{ data: Recipe[] }>('/recipes/user');
    return response.data || [];
  },

  // Save a new recipe
  async saveRecipe(recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at'>): Promise<Recipe> {
    const response = await apiClient.post<{ data: Recipe }>('/recipes', recipe);
    return response.data;
  },

  // Generate a meal plan
  async generateMealPlan(filters: MealPlanFilters): Promise<MealPlanResponse> {
    const response = await apiClient.post<{ data: MealPlanResponse }>('/meal-plans/generate', filters);
    return response.data;
  },

  // Save a generated meal plan
  async saveMealPlan(plan: MealPlanResponse): Promise<{ id: string }> {
    const response = await apiClient.post<{ id: string }>('/meal-plans', plan);
    return response.data;
  },

  // Get user's saved meal plans
  async getMealPlans(): Promise<{ id: string; created_at: string }[]> {
    const response = await apiClient.get<{ data: { id: string; created_at: string }[] }>('/meal-plans');
    return response.data || [];
  },

  // Get a specific meal plan
  async getMealPlan(planId: string): Promise<MealPlanResponse> {
    const response = await apiClient.get<{ data: MealPlanResponse }>(`/meal-plans/${planId}`);
    return response.data;
  },

  // Save a recipe to user's collection
  async saveUserRecipe(recipeId: string): Promise<void> {
    await apiClient.post(`/recipes/${recipeId}/save`);
  },

  // Remove a recipe from user's collection
  async removeUserRecipe(recipeId: string): Promise<void> {
    await apiClient.delete(`/recipes/${recipeId}/save`);
  },
};
