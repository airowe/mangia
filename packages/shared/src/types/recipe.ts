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
  recipeId?: string;
  name: string;
  quantity: number;
  unit: string;
  category?: IngredientCategory;
  notes?: string;
  isOptional?: boolean;
  orderIndex?: number;
}

export interface Recipe {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  instructions: string[];
  ingredients: RecipeIngredient[];
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings?: number;
  calories?: number;
  imageUrl?: string;
  sourceUrl?: string;
  sourceType?: RecipeSourceType;
  status?: RecipeStatus;
  rating?: number;
  cookCount?: number;
  lastCookedAt?: string;
  notes?: string;
  mealType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecipeNote {
  id: string;
  recipeId: string;
  userId: string;
  note: string;
  cookedAt?: string;
  createdAt: string;
  updatedAt: string;
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
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
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
