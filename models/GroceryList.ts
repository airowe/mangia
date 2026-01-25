import { IngredientCategory } from './Recipe';

export interface GroceryList {
  id: string;
  user_id: string;
  name: string;                // "Shopping List", "Weekend Meals"
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
  recipe_ids: string[];        // Which recipes need this ingredient
  in_pantry: boolean;          // User already has this
  pantry_quantity?: number;    // How much they have
  need_to_buy: number;         // quantity - pantry_quantity
  checked: boolean;            // Checked off while shopping
}

// Used for generating grocery list (not persisted)
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
