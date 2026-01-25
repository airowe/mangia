import { Recipe, RecipeIngredient, IngredientCategory } from '../models/Recipe';
import { PantryItem } from '../models/Product';
import { ConsolidatedIngredient, GroceryList, GroceryItem } from '../models/GroceryList';
import { fetchPantryItems } from './pantry';
import { categorizeIngredient, getCategoryOrder } from '../utils/categorizeIngredient';
import { supabase } from './supabase';

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
    const needToBuy = Math.max(0, item.total_quantity - pantryQuantity);

    return {
      ...item,
      in_pantry: inPantry,
      pantry_quantity: pantryQuantity,
      need_to_buy: needToBuy,
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
        existing.total_quantity += ingredient.quantity || 0;
        existing.from_recipes.push({
          recipe_id: recipe.id,
          recipe_title: recipe.title,
          quantity: ingredient.quantity || 0,
        });
      } else {
        // Create new entry
        const category = ingredient.category as IngredientCategory || categorizeIngredient(ingredient.name);
        ingredientMap.set(key, {
          name: ingredient.name,
          total_quantity: ingredient.quantity || 0,
          unit: ingredient.unit || '',
          category,
          from_recipes: [{
            recipe_id: recipe.id,
            recipe_title: recipe.title,
            quantity: ingredient.quantity || 0,
          }],
          in_pantry: false,
          pantry_quantity: 0,
          need_to_buy: 0,
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
  return items.filter(item => item.need_to_buy > 0);
}

/**
 * Filter to items user already has
 */
export function getItemsInPantry(items: ConsolidatedIngredient[]): ConsolidatedIngredient[] {
  return items.filter(item => item.in_pantry);
}

/**
 * Creates a new grocery list in the database
 */
export async function createGroceryList(
  name: string = 'Shopping List',
  items: ConsolidatedIngredient[]
): Promise<GroceryList> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create the list
  const { data: list, error: listError } = await supabase
    .from('grocery_lists')
    .insert({
      user_id: user.id,
      name,
    })
    .select()
    .single();

  if (listError) throw listError;

  // Add items to the list
  const groceryItems = items
    .filter(item => item.need_to_buy > 0)
    .map(item => ({
      list_id: list.id,
      name: item.name,
      quantity: item.need_to_buy,
      unit: item.unit,
      category: item.category,
      checked: false,
      recipe_ids: item.from_recipes.map(r => r.recipe_id),
    }));

  if (groceryItems.length > 0) {
    const { error: itemsError } = await supabase
      .from('grocery_items')
      .insert(groceryItems);

    if (itemsError) throw itemsError;
  }

  return list;
}

/**
 * Gets all grocery lists for the current user
 */
export async function getGroceryLists(): Promise<GroceryList[]> {
  const { data, error } = await supabase
    .from('grocery_lists')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Gets a grocery list with all its items
 */
export async function getGroceryListWithItems(listId: string): Promise<{
  list: GroceryList;
  items: GroceryItem[];
}> {
  const { data: list, error: listError } = await supabase
    .from('grocery_lists')
    .select('*')
    .eq('id', listId)
    .single();

  if (listError) throw listError;

  const { data: items, error: itemsError } = await supabase
    .from('grocery_items')
    .select('*')
    .eq('list_id', listId)
    .order('category');

  if (itemsError) throw itemsError;

  return { list, items: items || [] };
}

/**
 * Toggles a grocery item's checked status
 */
export async function toggleGroceryItem(itemId: string, checked: boolean): Promise<void> {
  const { error } = await supabase
    .from('grocery_items')
    .update({ checked })
    .eq('id', itemId);

  if (error) throw error;
}

/**
 * Marks a grocery list as completed
 */
export async function completeGroceryList(listId: string): Promise<void> {
  const { error } = await supabase
    .from('grocery_lists')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', listId);

  if (error) throw error;
}

/**
 * Deletes a grocery list and all its items
 */
export async function deleteGroceryList(listId: string): Promise<void> {
  const { error } = await supabase
    .from('grocery_lists')
    .delete()
    .eq('id', listId);

  if (error) throw error;
}

/**
 * Adds checked items from a grocery list to the pantry
 */
export async function addCheckedToPantry(listId: string): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get checked items
  const { data: items, error: itemsError } = await supabase
    .from('grocery_items')
    .select('*')
    .eq('list_id', listId)
    .eq('checked', true);

  if (itemsError) throw itemsError;
  if (!items || items.length === 0) return 0;

  // Add each to pantry
  const pantryItems = items.map(item => ({
    user_id: user.id,
    title: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
  }));

  const { error: insertError } = await supabase
    .from('pantry_items')
    .insert(pantryItems);

  if (insertError) throw insertError;

  return items.length;
}
