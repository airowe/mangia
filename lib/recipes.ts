import { Recipe } from "../models/Recipe";
import { apiClient } from "./api";

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
    
    return await apiClient.get<Recipe[]>(url);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch recipes');
  }
};

export const fetchRecipeById = async (id: string): Promise<Recipe> => {
  try {
    return await apiClient.get<Recipe>(`${API_BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error fetching recipe ${id}:`, error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch recipe');
  }
};

export const fetchAllRecipes = async (): Promise<Recipe[]> => {
  try {
    return await apiClient.get<Recipe[]>(API_BASE_URL);
  } catch (error) {
    console.error('Error fetching all recipes:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch all recipes');
  }
};
