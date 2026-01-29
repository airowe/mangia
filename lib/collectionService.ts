// Collection service for CRUD operations on recipe collections

import { apiClient } from './api/client';
import {
  RecipeCollection,
  RecipeCollectionItem,
  CollectionWithCount,
  CollectionWithRecipes,
} from '../models/Collection';
import { RequestOptions } from '../hooks/useAbortableEffect';

/**
 * Fetch all collections for the current user with recipe counts
 */
export async function fetchCollections(
  options?: RequestOptions,
): Promise<CollectionWithCount[]> {
  try {
    const data = await apiClient.get<CollectionWithCount[]>(
      '/api/collections',
      { signal: options?.signal }
    );
    return data || [];
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
}

/**
 * Fetch a single collection by ID with full recipe details
 */
export async function fetchCollectionById(
  id: string,
  options?: RequestOptions,
): Promise<CollectionWithRecipes | null> {
  try {
    const data = await apiClient.get<CollectionWithRecipes>(
      `/api/collections/${id}`,
      { signal: options?.signal }
    );
    return data || null;
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
}

/**
 * Create a new collection
 */
export async function createCollection(
  collection: Pick<RecipeCollection, 'name' | 'description' | 'icon' | 'color'>
): Promise<RecipeCollection> {
  try {
    const data = await apiClient.post<RecipeCollection>('/api/collections', {
      name: collection.name,
      description: collection.description,
      icon: collection.icon || 'folder',
      color: collection.color || '#CC5500',
    });
    return data;
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
}

/**
 * Update an existing collection
 */
export async function updateCollection(
  id: string,
  updates: Partial<Pick<RecipeCollection, 'name' | 'description' | 'icon' | 'color' | 'display_order'>>
): Promise<RecipeCollection> {
  try {
    const data = await apiClient.patch<RecipeCollection>(`/api/collections/${id}`, updates);
    return data;
  } catch (error) {
    console.error('Error updating collection:', error);
    throw error;
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/collections/${id}`);
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }
}

/**
 * Add a recipe to a collection
 */
export async function addRecipeToCollection(
  collectionId: string,
  recipeId: string
): Promise<RecipeCollectionItem> {
  try {
    const data = await apiClient.post<RecipeCollectionItem>(
      `/api/collections/${collectionId}/recipes`,
      { recipeId }
    );
    return data;
  } catch (error: any) {
    // Handle duplicate gracefully
    if (error.status === 409 || error.code === 'DUPLICATE') {
      throw new Error('Recipe is already in this collection');
    }
    console.error('Error adding recipe to collection:', error);
    throw error;
  }
}

/**
 * Remove a recipe from a collection
 */
export async function removeRecipeFromCollection(
  collectionId: string,
  recipeId: string
): Promise<void> {
  try {
    await apiClient.delete(`/api/collections/${collectionId}/recipes/${recipeId}`);
  } catch (error) {
    console.error('Error removing recipe from collection:', error);
    throw error;
  }
}

/**
 * Get all collections that contain a specific recipe
 */
export async function getCollectionsForRecipe(recipeId: string): Promise<RecipeCollection[]> {
  try {
    const data = await apiClient.get<RecipeCollection[]>(
      `/api/recipes/${recipeId}/collections`
    );
    return data || [];
  } catch (error) {
    console.error('Error fetching collections for recipe:', error);
    throw error;
  }
}

/**
 * Move a recipe to a different collection (remove from old, add to new)
 */
export async function moveRecipeToCollection(
  recipeId: string,
  fromCollectionId: string,
  toCollectionId: string
): Promise<void> {
  // Remove from old collection
  await removeRecipeFromCollection(fromCollectionId, recipeId);

  // Add to new collection
  await addRecipeToCollection(toCollectionId, recipeId);
}

/**
 * Batch add multiple recipes to a collection
 */
export async function addRecipesToCollection(
  collectionId: string,
  recipeIds: string[]
): Promise<void> {
  try {
    await apiClient.post(`/api/collections/${collectionId}/recipes/batch`, { recipeIds });
  } catch (error) {
    console.error('Error batch adding recipes to collection:', error);
    throw error;
  }
}
