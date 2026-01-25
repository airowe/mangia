// lib/recipeNotesService.ts
// API service for recipe notes and ratings

import { apiClient } from "./api/client";
import { RecipeNote } from "../models/Recipe";

/**
 * Fetch notes for a recipe
 */
export async function fetchRecipeNotes(
  recipeId: string,
): Promise<RecipeNote[]> {
  try {
    const data = await apiClient.get<RecipeNote[]>(
      `/api/recipes/${recipeId}/notes`,
    );
    return data || [];
  } catch (error) {
    console.error("Error fetching recipe notes:", error);
    throw error;
  }
}

/**
 * Add a note to a recipe
 */
export async function addRecipeNote(
  recipeId: string,
  note: string,
  cookedAt?: string,
): Promise<RecipeNote> {
  try {
    const data = await apiClient.post<RecipeNote>(
      `/api/recipes/${recipeId}/notes`,
      {
        note,
        cooked_at: cookedAt || new Date().toISOString().split("T")[0],
      },
    );
    return data;
  } catch (error) {
    console.error("Error adding recipe note:", error);
    throw error;
  }
}

/**
 * Delete a recipe note
 */
export async function deleteRecipeNote(
  recipeId: string,
  noteId: string,
): Promise<void> {
  try {
    await apiClient.delete(`/api/recipes/${recipeId}/notes/${noteId}`);
  } catch (error) {
    console.error("Error deleting recipe note:", error);
    throw error;
  }
}

/**
 * Update recipe rating
 */
export async function updateRecipeRating(
  recipeId: string,
  rating: number | null,
): Promise<void> {
  try {
    await apiClient.patch(`/api/recipes/${recipeId}`, { rating });
  } catch (error) {
    console.error("Error updating recipe rating:", error);
    throw error;
  }
}
