// Grocery list shared types

import { IngredientCategory } from './recipe';

export interface GroceryList {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  completed_at?: string;
}

export interface GroceryItem {
  id: string;
  list_id: string;
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  recipe_ids: string[];
  in_pantry: boolean;
  pantry_quantity?: number;
  need_to_buy: number;
  checked: boolean;
}

export interface ConsolidatedIngredient {
  name: string;
  total_quantity: number;
  unit: string;
  category: IngredientCategory;
  from_recipes: Array<{
    recipe_id: string;
    recipe_title: string;
    quantity: number;
  }>;
  in_pantry: boolean;
  pantry_quantity: number;
  need_to_buy: number;
}
