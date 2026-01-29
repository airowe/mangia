// Meal planning shared types

import { Recipe } from './recipe';

export type ShoppingListItem = {
  id: string;
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
  recipeIds: string[];
  inPantry?: boolean;
};

export type MealType = "breakfast" | "lunch" | "dinner";

export interface Meal {
  id: string;
  recipe: Recipe | null;
  title: string;
  type: MealType;
}

export interface MealPlanDay {
  date: string;
  meals: {
    [key in MealType]?: Meal | null;
  } & {
    snacks: Meal[];
  };
  snacks: Meal[];
}

export interface MealPlanFilters {
  days: number;
  servings: number;
  usePantry: boolean;
  quickMeals: boolean;
  includeBreakfast: boolean;
  includeLunch: boolean;
  includeDinner: boolean;
  includeSnacks: boolean;
  dietaryRestrictions: string[];
  usePantryItems?: boolean;
  quickMealsOnly?: boolean;
}

export interface MealPlanResponse {
  days: MealPlanDay[];
  shoppingList: ShoppingListItem[];
}

