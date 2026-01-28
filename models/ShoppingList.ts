import { MealPlanDay } from "./Meal";

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
  recipeIds: string[];
  inPantry?: boolean;
}
