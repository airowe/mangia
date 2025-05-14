export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  instructions: string;
  created_at?: string;
  ingredients: RecipeIngredient[];
  main_ingredient: string;
  meal_type: string;
  description: string;
  image_url: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number;
  unit: string;
}
