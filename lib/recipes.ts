import { apiClient } from './api/client';
import { Recipe } from '../models/Recipe';

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


const API_BASE_URL = '/recipes';

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

  // Add a recipe (alias for saveRecipe for backward compatibility)
  async addRecipe(recipe: Omit<Recipe, 'id' | 'user_id'>): Promise<Recipe> {
    return this.saveRecipe(recipe);
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

  // Fetch recipes with optional filters
  async fetchRecipes(params: { search?: string; user_id?: string; meal_type?: string } = {}): Promise<Recipe[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.search) queryParams.append('search', params.search);
      if (params.meal_type) queryParams.append('meal_type', params.meal_type);
      if (params.user_id) queryParams.append('user_id', params.user_id);
      
      const queryString = queryParams.toString();
      const url = queryString ? `${API_BASE_URL}/fetch-recipes?${queryString}` : API_BASE_URL;
      
      const response = await apiClient.get<{ data: Recipe[] }>(url);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching recipes:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch recipes');
    }
  },

  // Fetch a single recipe by ID
  async fetchRecipeById(id: string): Promise<Recipe> {
    try {
      const response = await apiClient.get<{ data: Recipe }>(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching recipe ${id}:`, error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch recipe');
    }
  },

  // Fetch all recipes (alias for fetchRecipes for backward compatibility)
  async fetchAllRecipes(): Promise<Recipe[]> {
    return this.fetchRecipes();
  }
};

// Export types for backward compatibility
export interface AddRecipeResponse extends Recipe {
  id: string;
  user_id: string;
}

// Export individual functions for backward compatibility
export const addRecipe = recipeApi.addRecipe.bind(recipeApi);
export const fetchRecipes = recipeApi.fetchRecipes.bind(recipeApi);
export const fetchRecipeById = recipeApi.fetchRecipeById.bind(recipeApi);
export const fetchAllRecipes = recipeApi.fetchAllRecipes.bind(recipeApi);

export default recipeApi;