export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  instructions: string;
  created_at?: string;
  ingredients: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number;
  unit: string;
}
