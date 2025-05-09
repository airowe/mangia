export type AIRecipe = {
  title: string;
  ingredients: { name: string; quantity: number; unit: string }[];
  instructions: string;
};

export const generateMealPlan = async (pantryItems: string[]): Promise<AIRecipe[]> => {
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;

  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse recipe JSON:', e, content);
    return [];
  }
};
