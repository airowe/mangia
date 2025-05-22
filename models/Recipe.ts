export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  name?: string; // Alias for title
  instructions: string[];
  created_at?: string;
  ingredients: RecipeIngredient[];
  main_ingredient: string;
  meal_type: string;
  description: string;
  image_url: string;
  image?: string; // Alias for image_url
  cook_time?: number; // In minutes
  cookTime?: number; // Alias for cook_time
  servings?: number;
  prep_time?: number; // In minutes
  prepTime?: number; // Alias for prep_time
  difficulty?: 'easy' | 'medium' | 'hard';
  cuisine?: string;
  tags?: string[];
  is_favorite?: boolean;
  is_public?: boolean;
  source?: string;
  notes?: string;
  rating?: number; // 1-5
  last_made?: string; // ISO date string
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number;
  unit: string;
  amount?: number;
}
