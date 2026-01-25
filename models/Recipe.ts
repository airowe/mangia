// Recipe source types for URL imports
export type RecipeSourceType = 'tiktok' | 'youtube' | 'instagram' | 'blog' | 'manual';

// Recipe status for the "Want to Cook" workflow
export type RecipeStatus = 'want_to_cook' | 'cooked' | 'archived';

// Ingredient categories for grocery list organization
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
  user_id?: string;            // Optional for backward compatibility
  title: string;
  description?: string;
  instructions: string[];
  ingredients: RecipeIngredient[];
  prep_time?: number;          // minutes
  cook_time?: number;          // minutes
  servings?: number;
  image_url?: string;
  source_url?: string;         // Original URL (TikTok, YouTube, blog)
  source_type?: RecipeSourceType;
  status?: RecipeStatus;       // Optional, defaults to 'want_to_cook'
  rating?: number;             // 1-5 star rating
  times_cooked?: number;       // Number of times recipe was cooked
  last_cooked_at?: string;     // Date of last cook
  created_at?: string;         // Optional for backward compatibility
  updated_at?: string;
  // Legacy fields for backward compatibility
  meal_type?: string;
  dietary_restrictions?: string[];
  is_ai_generated?: boolean;
  source?: string;
}

// Recipe note for cooking history
export interface RecipeNote {
  id: string;
  recipe_id: string;
  user_id: string;
  note: string;
  cooked_at?: string;
  created_at: string;
  updated_at: string;
}

// API response type for parsed recipes from external sources
export interface ParsedRecipe {
  title: string;
  description?: string;
  ingredients: Array<{
    name: string;
    quantity: string;    // String from AI, needs parsing
    unit: string;
  }>;
  instructions: string[];
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  image_url?: string;
}

// Firecrawl response structure
export interface FirecrawlRecipe {
  title?: string;
  ingredients?: string[];
  instructions?: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  image?: string;
}
