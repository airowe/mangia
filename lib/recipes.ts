import { apiClient } from './api/client';
import { Recipe, RecipeIngredient } from '../models/Recipe';

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
    const response = await apiClient.get<{ data: Recipe[] }>('/recipes/fetch-recipes');
    return response.data || [];
  },

  // Save a new recipe
  async saveRecipe(recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at'>): Promise<Recipe> {
    const response = await apiClient.post<{ data: Recipe }>('/recipes/add', recipe);
    return response.data;
  },

  // Generate a meal plan
  async generateMealPlan(filters: MealPlanFilters): Promise<MealPlanResponse> {
    const response = await apiClient.post<{ data: MealPlanResponse }>('/meal-planner/generate', filters);
    return response.data;
  },

  // Save a generated meal plan
  async saveMealPlan(plan: MealPlanResponse): Promise<{ id: string }> {
    const response = await apiClient.post<{ data: { id: string } }>('/meal-planner/save', plan);
    return response.data;
  },

  // Get user's saved meal plans
  async getMealPlans(): Promise<{ id: string; created_at: string }[]> {
    const response = await apiClient.get<{ data: { id: string; created_at: string }[] }>('/meal-planner/current');
    return response.data || [];
  },

  // Get a specific meal plan
  async getMealPlan(planId: string): Promise<MealPlanResponse> {
    const response = await apiClient.get<{ data: MealPlanResponse }>(`/meal-planner/${planId}`);
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

// Export the previous functions for backward compatibility
const API_BASE_URL = '/recipes';

export interface AddRecipeResponse extends Recipe {
  id: string;
  user_id: string;
}

export const addRecipe = async (recipe: Omit<Recipe, "id" | "user_id">): Promise<AddRecipeResponse> => {
  try {
    return await apiClient.post<AddRecipeResponse>(`${API_BASE_URL}`, recipe);
  } catch (error) {
    console.error('Error adding recipe:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to add recipe');
  }
};

interface FetchRecipesParams {
  search?: string;
  user_id?: string;
  meal_type?: string;
}

export const fetchRecipes = async (
  params: FetchRecipesParams = {}
): Promise<Recipe[]> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.meal_type) queryParams.append('meal_type', params.meal_type);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE_URL}?${queryString}` : API_BASE_URL;
    
    const response = await apiClient.get<{ data: Recipe[] }>(url);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch recipes');
  }
};

export const fetchRecipeById = async (id: string): Promise<Recipe> => {
  try {
    const response = await apiClient.get<{ data: Recipe }>(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching recipe ${id}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch recipe');
  }
};

export const fetchAllRecipes = async (): Promise<Recipe[]> => {
  try {
    const response = await apiClient.get<{ data: Recipe[] }>(API_BASE_URL);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching all recipes:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch all recipes');
  }
};
