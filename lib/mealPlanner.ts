import { supabase } from "./supabase";
import { apiClient } from "./api";

export type AIRecipe = {
  title: string;
  ingredients: { name: string; quantity: number; unit: string }[];
  instructions: string;
};

export const generateMealPlan = async (pantryItems: string[]): Promise<AIRecipe[]> => {
  try {
    const prompt = `
Given these pantry ingredients: ${pantryItems.join(', ')}, suggest 3 simple recipes.
Respond ONLY in the following JSON format:

[
  {
    "title": "Recipe Name",
    "ingredients": [
      { "name": "ingredient name", "quantity": 2, "unit": "cups" }
    ],
    "instructions": "Step-by-step instructions."
  }
]
`;

    const response = await apiClient.post<{
      choices: Array<{ message: { content: string } }>;
    }>('https://grosheries-api.vercel.app/api/generate-meal-plan', {
      user_id: (await supabase.auth.getUser()).data.user?.id,
      pantryItems,
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse recipe JSON:', e, content);
      return [];
    }
  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate meal plan');
  }
};