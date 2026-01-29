// Recipe-related shared types

export type RecipeSourceType = 'tiktok' | 'youtube' | 'instagram' | 'blog' | 'manual';

export type RecipeStatus = 'want_to_cook' | 'cooked' | 'archived';

export type IngredientCategory =
  | 'produce'
  | 'meat_seafood'
  | 'dairy_eggs'
  | 'pantry'
  | 'frozen'
  | 'bakery'
  | 'canned'
  | 'other';

export interface RecipeIngredient {
  id?: string;
  recipe_id?: string;
  name: string;
  quantity: number;
  unit: string;
  category?: IngredientCategory;
  display_order?: number;
}

export interface Recipe {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  instructions: string[];
  ingredients: RecipeIngredient[];
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  image_url?: string;
  source_url?: string;
  source_type?: RecipeSourceType;
  status?: RecipeStatus;
  rating?: number;
  times_cooked?: number;
  last_cooked_at?: string;
  created_at?: string;
  updated_at?: string;
  meal_type?: string;
  dietary_restrictions?: string[];
  is_ai_generated?: boolean;
  source?: string;
}

export interface RecipeNote {
  id: string;
  recipe_id: string;
  user_id: string;
  note: string;
  cooked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ParsedRecipe {
  title: string;
  description?: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  instructions: string[];
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  image_url?: string;
}

export interface FirecrawlRecipe {
  title?: string;
  ingredients?: string[];
  instructions?: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  image?: string;
}
