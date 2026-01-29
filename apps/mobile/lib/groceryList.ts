import { Recipe, RecipeIngredient, IngredientCategory } from '../models/Recipe';
import { PantryItem } from '../models/Product';
import { ConsolidatedIngredient, GroceryList, GroceryItem } from '../models/GroceryList';
import { fetchPantryItems } from './pantry';
import { categorizeIngredient, getCategoryOrder } from '../utils/categorizeIngredient';
import { apiClient } from './api/client';
import { RequestOptions } from '../hooks/useAbortableEffect';

/**
 * Generates a consolidated grocery list from selected recipes
 */
export async function generateGroceryList(
  recipes: Recipe[]
): Promise<ConsolidatedIngredient[]> {
  // Get user's pantry
  const pantryItems = await fetchPantryItems();
  const pantryMap = buildPantryMap(pantryItems);

  // Consolidate ingredients from all recipes
  const consolidated = consolidateIngredients(recipes);

  // Check against pantry
  const withPantryStatus = consolidated.map(item => {
    const pantryKey = normalizeIngredientName(item.name);
    const pantryItem = pantryMap.get(pantryKey);

    const inPantry = !!pantryItem;
    const pantryQuantity = pantryItem?.quantity || 0;
    const needToBuy = Math.max(0, item.totalQuantity - pantryQuantity);

    return {
      ...item,
      inPantry,
      pantryQuantity,
      needToBuy,
    };
  });

  // Sort by category (store layout)
  return withPantryStatus.sort((a, b) => {
    return getCategoryOrder(a.category) - getCategoryOrder(b.category);
  });
}

/**
 * Builds a map of pantry items by normalized name
 */
function buildPantryMap(items: PantryItem[]): Map<string, PantryItem> {
  const map = new Map<string, PantryItem>();

  for (const item of items) {
    const key = normalizeIngredientName(item.title);
    map.set(key, item);
  }

  return map;
}

/**
 * Consolidates ingredients from multiple recipes, combining duplicates
 */
function consolidateIngredients(recipes: Recipe[]): ConsolidatedIngredient[] {
  const ingredientMap = new Map<string, ConsolidatedIngredient>();

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const key = normalizeIngredientName(ingredient.name);

      if (ingredientMap.has(key)) {
        // Add to existing
        const existing = ingredientMap.get(key)!;
        existing.totalQuantity += ingredient.quantity || 0;
        existing.fromRecipes.push({
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          quantity: ingredient.quantity || 0,
        });
      } else {
        // Create new entry
        const category = ingredient.category as IngredientCategory || categorizeIngredient(ingredient.name);
        ingredientMap.set(key, {
          name: ingredient.name,
          totalQuantity: ingredient.quantity || 0,
          unit: ingredient.unit || '',
          category,
          fromRecipes: [{
            recipeId: recipe.id,
            recipeTitle: recipe.title,
            quantity: ingredient.quantity || 0,
          }],
          inPantry: false,
          pantryQuantity: 0,
          needToBuy: 0,
        });
      }
    }
  }

  return Array.from(ingredientMap.values());
}

/**
 * Normalizes ingredient names for comparison
 */
export function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')  // Remove punctuation
    .replace(/\s+/g, ' ')          // Normalize whitespace
    // Remove common quantity words that might be in the name
    .replace(/\b(fresh|dried|chopped|minced|diced|sliced|whole|large|small|medium|optional)\b/g, '')
    .trim();
}

/**
 * Filter to only items that need to be purchased
 */
export function getItemsToBuy(items: ConsolidatedIngredient[]): ConsolidatedIngredient[] {
  return items.filter(item => item.needToBuy > 0);
}

/**
 * Filter to items user already has
 */
export function getItemsInPantry(items: ConsolidatedIngredient[]): ConsolidatedIngredient[] {
  return items.filter(item => item.inPantry);
}

/**
 * Creates a new grocery list in the database
 */
export async function createGroceryList(
  name: string = 'Shopping List',
  items: ConsolidatedIngredient[]
): Promise<GroceryList> {
  try {
    const groceryItems = items
      .filter(item => item.needToBuy > 0)
      .map(item => ({
        name: item.name,
        quantity: item.needToBuy,
        unit: item.unit,
        category: item.category,
        checked: false,
        recipeIds: item.fromRecipes.map(r => r.recipeId),
      }));

    const data = await apiClient.post<GroceryList>('/api/grocery-lists', {
      name,
      items: groceryItems,
    });

    return data;
  } catch (error) {
    console.error('Error creating grocery list:', error);
    throw error;
  }
}

/**
 * Gets all grocery lists for the current user
 */
export async function getGroceryLists(
  options?: RequestOptions,
): Promise<GroceryList[]> {
  try {
    const data = await apiClient.get<GroceryList[]>(
      '/api/grocery-lists',
      { signal: options?.signal }
    );
    return data || [];
  } catch (error) {
    console.error('Error fetching grocery lists:', error);
    throw error;
  }
}

/**
 * Gets a grocery list with all its items
 */
export async function getGroceryListWithItems(
  listId: string,
  options?: RequestOptions,
): Promise<{
  list: GroceryList;
  items: GroceryItem[];
}> {
  try {
    const data = await apiClient.get<{ list: GroceryList; items: GroceryItem[] }>(
      `/api/grocery-lists/${listId}`,
      { signal: options?.signal }
    );
    return data;
  } catch (error) {
    console.error('Error fetching grocery list with items:', error);
    throw error;
  }
}

/**
 * Toggles a grocery item's checked status
 */
export async function toggleGroceryItem(itemId: string, checked: boolean): Promise<void> {
  try {
    await apiClient.patch(`/api/grocery-lists/items/${itemId}`, { checked });
  } catch (error) {
    console.error('Error toggling grocery item:', error);
    throw error;
  }
}

/**
 * Marks a grocery list as completed
 */
export async function completeGroceryList(listId: string): Promise<void> {
  try {
    await apiClient.patch(`/api/grocery-lists/${listId}`, {
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error completing grocery list:', error);
    throw error;
  }
}

/**
 * Deletes a grocery list and all its items
 */
export async function deleteGroceryList(listId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/grocery-lists/${listId}`);
  } catch (error) {
    console.error('Error deleting grocery list:', error);
    throw error;
  }
}

/**
 * Adds checked items from a grocery list to the pantry
 */
export async function addCheckedToPantry(listId: string): Promise<number> {
  try {
    const response = await apiClient.post<{ count: number }>(
      `/api/grocery-lists/${listId}/add-to-pantry`
    );
    return response.count || 0;
  } catch (error) {
    console.error('Error adding checked items to pantry:', error);
    throw error;
  }
}
