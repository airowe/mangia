import { ParsedRecipe } from '../models/Recipe';

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '';

/**
 * Uses Claude API to extract structured recipe from text content
 */
export async function extractIngredientsWithClaude(content: string): Promise<ParsedRecipe> {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  const prompt = `Extract the recipe from this video transcript or description. Return ONLY valid JSON with no additional text.

The JSON should have this exact structure:
{
  "title": "Recipe name",
  "description": "Brief description",
  "ingredients": [
    {"name": "ingredient name", "quantity": "1", "unit": "cup"}
  ],
  "instructions": ["Step 1", "Step 2"],
  "prep_time": 10,
  "cook_time": 20,
  "servings": 4
}

Rules:
- For ingredients, separate quantity, unit, and name
- If quantity is unclear, use "1" and "to taste" or "as needed" for unit
- Instructions should be clear, numbered steps
- prep_time and cook_time are in minutes (integers)
- If you can't determine a value, omit that field
- Be generous with extracting ingredients - include everything mentioned

Content to extract from:
${content}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Claude API error:', error);
      throw new Error('Failed to parse recipe with AI');
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Extract JSON from response (in case there's extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse recipe from AI response');
    }

    const recipe = JSON.parse(jsonMatch[0]);
    return normalizeRecipe(recipe);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('JSON parse error:', error);
      throw new Error('Invalid recipe format from AI');
    }
    throw error;
  }
}

/**
 * Normalizes raw parsed recipe to ensure consistent structure
 */
function normalizeRecipe(raw: any): ParsedRecipe {
  return {
    title: raw.title || 'Imported Recipe',
    description: raw.description,
    ingredients: (raw.ingredients || []).map((ing: any) => {
      // Handle both object and string formats
      if (typeof ing === 'string') {
        return {
          name: ing,
          quantity: '',
          unit: '',
        };
      }
      return {
        name: ing.name || ing.ingredient || '',
        quantity: String(ing.quantity || ing.amount || ''),
        unit: ing.unit || '',
      };
    }),
    instructions: normalizeInstructions(raw.instructions),
    prep_time: typeof raw.prep_time === 'number' ? raw.prep_time : undefined,
    cook_time: typeof raw.cook_time === 'number' ? raw.cook_time : undefined,
    servings: typeof raw.servings === 'number' ? raw.servings : undefined,
    image_url: raw.image_url,
  };
}

/**
 * Normalizes instructions to consistent string array
 */
function normalizeInstructions(instructions: any): string[] {
  if (!instructions) return [];

  if (typeof instructions === 'string') {
    // Split by newlines or numbered steps
    return instructions
      .split(/\n|(?=\d+\.)|(?=Step \d+)/i)
      .map((step: string) => step.trim())
      .filter((step: string) => step.length > 0);
  }

  if (Array.isArray(instructions)) {
    return instructions.map((step: any) => {
      if (typeof step === 'string') return step.trim();
      if (step.text) return step.text.trim();
      if (step.instruction) return step.instruction.trim();
      return String(step).trim();
    }).filter((step: string) => step.length > 0);
  }

  return [];
}

/**
 * Parses a quantity string to a number
 */
export function parseQuantity(quantityStr: string): number {
  if (!quantityStr) return 0;

  // Handle fractions like "1/2", "1 1/2"
  const fractionMatch = quantityStr.match(/(\d+)?\s*(\d+)\/(\d+)/);
  if (fractionMatch) {
    const whole = parseInt(fractionMatch[1] || '0');
    const numerator = parseInt(fractionMatch[2]);
    const denominator = parseInt(fractionMatch[3]);
    return whole + numerator / denominator;
  }

  // Handle decimals and whole numbers
  const numMatch = quantityStr.match(/[\d.]+/);
  if (numMatch) {
    return parseFloat(numMatch[0]);
  }

  // Handle words
  const wordNumbers: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'a': 1, 'an': 1,
  };

  const lower = quantityStr.toLowerCase().trim();
  if (wordNumbers[lower]) {
    return wordNumbers[lower];
  }

  return 0;
}

/**
 * Normalizes unit strings to consistent format
 */
export function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'tbsps': 'tbsp',
    'tbs': 'tbsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    'tsps': 'tsp',
    'ounce': 'oz',
    'ounces': 'oz',
    'pound': 'lb',
    'pounds': 'lb',
    'lbs': 'lb',
    'cup': 'cup',
    'cups': 'cup',
    'pint': 'pint',
    'pints': 'pint',
    'quart': 'qt',
    'quarts': 'qt',
    'gallon': 'gal',
    'gallons': 'gal',
    'liter': 'L',
    'liters': 'L',
    'litre': 'L',
    'litres': 'L',
    'milliliter': 'mL',
    'milliliters': 'mL',
    'ml': 'mL',
    'gram': 'g',
    'grams': 'g',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'clove': 'clove',
    'cloves': 'clove',
    'piece': 'piece',
    'pieces': 'piece',
    'bunch': 'bunch',
    'bunches': 'bunch',
    'can': 'can',
    'cans': 'can',
    'package': 'pkg',
    'packages': 'pkg',
    'pkg': 'pkg',
    'pinch': 'pinch',
    'dash': 'dash',
    'to taste': 'to taste',
    'as needed': 'as needed',
  };

  const lower = unit.toLowerCase().trim();
  return unitMap[lower] || unit;
}
