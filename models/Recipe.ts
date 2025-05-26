export interface RecipeIngredient {
  id?: string;
  recipe_id?: string;
  name: string;
  quantity: number;
  unit: string;
  inPantry?: boolean;
}

export interface Recipe {
  id?: string;
  user_id?: string;
  title: string;
  description?: string;
  instructions: string;
  ingredients: RecipeIngredient[];
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  is_ai_generated?: boolean;
  source?: string;
  meal_type?: string;
  dietary_restrictions?: string[];
}

export interface MealPlanFilters {
  days: number;
  servings?: number;
  dietaryRestrictions?: string[];
  maxCookingTime?: number;
  includeBreakfast?: boolean;
  includeLunch?: boolean;
  includeDinner?: boolean;
  includeSnacks?: boolean;
  usePantryItems?: boolean;
  quickMealsOnly?: boolean;
}

export interface MealPlanDay {
  date: string;
  meals: {
    breakfast?: Recipe | null;
    lunch?: Recipe | null;
    dinner?: Recipe | null;
    snacks?: Recipe[];
  };
  shoppingList?: {
    ingredients: {
      name: string;
      amount: string;
      unit: string;
      inPantry: boolean;
    }[];
  };
}

export interface MealPlanResponse {
  days: MealPlanDay[];
  shoppingList: {
    ingredients: {
      name: string;
      amount: string;
      unit: string;
      inPantry: boolean;
    }[];
  };
}
