// lib/mealPlanService.ts
// API service for meal plan CRUD operations

import { apiClient } from "./api/client";
import { Recipe } from "../models/Recipe";

export type MealTypeDB = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealPlan {
  id: string;
  date: string;
  meal_type: MealTypeDB;
  recipe_id: string | null;
  title: string | null;
  notes: string | null;
  recipe?: Recipe;
}

/**
 * Fetch meal plans for a date range
 */
export async function fetchMealPlans(
  startDate: string,
  endDate: string,
): Promise<MealPlan[]> {
  try {
    const data = await apiClient.get<MealPlan[]>(
      `/api/meal-plans?startDate=${startDate}&endDate=${endDate}`,
    );
    return data || [];
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    throw error;
  }
}

/**
 * Fetch user's recipes for meal plan picker
 */
export async function fetchRecipesForMealPlan(): Promise<Recipe[]> {
  try {
    const data = await apiClient.get<Recipe[]>("/api/recipes");
    return data || [];
  } catch (error) {
    console.error("Error fetching recipes:", error);
    throw error;
  }
}

/**
 * Add or update a meal in the plan
 */
export async function addMealToPlan(
  date: string,
  mealType: MealTypeDB,
  recipeId: string,
  title: string,
): Promise<MealPlan> {
  try {
    const data = await apiClient.post<MealPlan>("/api/meal-plans", {
      date,
      meal_type: mealType,
      recipe_id: recipeId,
      title,
    });
    return data;
  } catch (error) {
    console.error("Error adding meal to plan:", error);
    throw error;
  }
}

/**
 * Update an existing meal plan entry
 */
export async function updateMealPlan(
  mealPlanId: string,
  updates: { recipe_id?: string; title?: string; notes?: string },
): Promise<MealPlan> {
  try {
    const data = await apiClient.patch<MealPlan>(
      `/api/meal-plans/${mealPlanId}`,
      updates,
    );
    return data;
  } catch (error) {
    console.error("Error updating meal plan:", error);
    throw error;
  }
}

/**
 * Remove a meal from the plan
 */
export async function removeMealFromPlan(mealPlanId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/meal-plans/${mealPlanId}`);
  } catch (error) {
    console.error("Error removing meal from plan:", error);
    throw error;
  }
}
