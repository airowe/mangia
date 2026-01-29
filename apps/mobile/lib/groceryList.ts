import { Recipe, RecipeIngredient, IngredientCategory } from '../models/Recipe';
import { ConsolidatedIngredient, GroceryList, GroceryItem } from '../models/GroceryList';
import { apiClient } from './api/client';
import { RequestOptions } from '../hooks/useAbortableEffect';

interface GenerateResponse {
  items: ConsolidatedIngredient[];
}

/**
 * Generates a consolidated grocery list from selected recipes.
 * Server handles ingredient consolidation, pantry deduction, and categorization.
 */
export async function generateGroceryList(
  recipes: Recipe[]
): Promise<ConsolidatedIngredient[]> {
  try {
    const response = await apiClient.post<GenerateResponse>(
      '/api/grocery-lists/generate',
      { recipeIds: recipes.map(r => r.id) },
    );
    return response.items || [];
  } catch (error) {
    console.error('Error generating grocery list:', error);
    throw error;
  }
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
