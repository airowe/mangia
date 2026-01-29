// Grocery list shared types

import { IngredientCategory } from './recipe';

export interface GroceryList {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  completedAt?: string;
}

export interface GroceryItem {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  recipeIds: string[];
  inPantry: boolean;
  pantryQuantity?: number;
  needToBuy: number;
  checked: boolean;
}

export interface ConsolidatedIngredient {
  name: string;
  totalQuantity: number;
  unit: string;
  category: IngredientCategory;
  fromRecipes: Array<{
    recipeId: string;
    recipeTitle: string;
    quantity: number;
  }>;
  inPantry: boolean;
  pantryQuantity: number;
  needToBuy: number;
}
