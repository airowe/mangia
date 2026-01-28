interface FirecrawlRecipe {
  title?: string;
  ingredients?: string[];
  instructions?: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  image?: string;
}

export async function extractRecipeFromUrl(url: string, apiKey: string): Promise<FirecrawlRecipe> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/extract/recipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: url,
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`Error extracting recipe: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || {};
  } catch (error) {
    console.error('Error extracting recipe:', error);
    throw error;
  }
}

export function mapToRecipeFormat(firecrawlRecipe: FirecrawlRecipe): {
  title: string;
  ingredients: { name: string }[];
  instructions: string[];
} {
  return {
    title: firecrawlRecipe.title || 'Imported Recipe',
    ingredients: (firecrawlRecipe.ingredients || []).map(ingredient => ({
      name: ingredient,
      quantity: 0,
      unit: '',
    })),
    instructions: firecrawlRecipe.instructions || [],
  };
}
