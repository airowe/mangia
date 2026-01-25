// Collection service for CRUD operations on recipe collections

import { supabase } from './supabase';
import {
  RecipeCollection,
  RecipeCollectionItem,
  CollectionWithCount,
  CollectionWithRecipes,
} from '../models/Collection';

/**
 * Fetch all collections for the current user with recipe counts
 */
export async function fetchCollections(): Promise<CollectionWithCount[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('recipe_collections')
    .select(`
      *,
      recipe_collection_items(count)
    `)
    .eq('user_id', user.user.id)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }

  // Transform the data to include recipe_count
  return (data || []).map((collection) => ({
    ...collection,
    recipe_count: collection.recipe_collection_items?.[0]?.count || 0,
  }));
}

/**
 * Fetch a single collection by ID with full recipe details
 */
export async function fetchCollectionById(id: string): Promise<CollectionWithRecipes | null> {
  const { data, error } = await supabase
    .from('recipe_collections')
    .select(`
      *,
      recipe_collection_items(
        recipe_id,
        display_order,
        recipes(
          id,
          title,
          image_url,
          cook_time,
          prep_time
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching collection:', error);
    return null;
  }

  if (!data) return null;

  // Transform the nested data
  const recipes = (data.recipe_collection_items || [])
    .map((item: any) => item.recipes)
    .filter(Boolean)
    .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));

  return {
    ...data,
    recipes,
  };
}

/**
 * Create a new collection
 */
export async function createCollection(
  collection: Pick<RecipeCollection, 'name' | 'description' | 'icon' | 'color'>
): Promise<RecipeCollection> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('recipe_collections')
    .insert({
      user_id: user.user.id,
      name: collection.name,
      description: collection.description,
      icon: collection.icon || 'folder',
      color: collection.color || '#CC5500',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating collection:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing collection
 */
export async function updateCollection(
  id: string,
  updates: Partial<Pick<RecipeCollection, 'name' | 'description' | 'icon' | 'color' | 'display_order'>>
): Promise<RecipeCollection> {
  const { data, error } = await supabase
    .from('recipe_collections')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating collection:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a collection
 */
export async function deleteCollection(id: string): Promise<void> {
  const { error } = await supabase
    .from('recipe_collections')
    .delete()
    .eq('id', id);

  if (error) {
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
  const { data, error } = await supabase
    .from('recipe_collection_items')
    .insert({
      collection_id: collectionId,
      recipe_id: recipeId,
    })
    .select()
    .single();

  if (error) {
    // Handle duplicate gracefully
    if (error.code === '23505') {
      throw new Error('Recipe is already in this collection');
    }
    console.error('Error adding recipe to collection:', error);
    throw error;
  }

  return data;
}

/**
 * Remove a recipe from a collection
 */
export async function removeRecipeFromCollection(
  collectionId: string,
  recipeId: string
): Promise<void> {
  const { error } = await supabase
    .from('recipe_collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('recipe_id', recipeId);

  if (error) {
    console.error('Error removing recipe from collection:', error);
    throw error;
  }
}

/**
 * Get all collections that contain a specific recipe
 */
export async function getCollectionsForRecipe(recipeId: string): Promise<RecipeCollection[]> {
  const { data, error } = await supabase
    .from('recipe_collection_items')
    .select(`
      recipe_collections(*)
    `)
    .eq('recipe_id', recipeId);

  if (error) {
    console.error('Error fetching collections for recipe:', error);
    throw error;
  }

  return (data || []).map((item: any) => item.recipe_collections).filter(Boolean);
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
  const items = recipeIds.map((recipeId) => ({
    collection_id: collectionId,
    recipe_id: recipeId,
  }));

  const { error } = await supabase
    .from('recipe_collection_items')
    .upsert(items, { onConflict: 'collection_id,recipe_id' });

  if (error) {
    console.error('Error batch adding recipes to collection:', error);
    throw error;
  }
}
