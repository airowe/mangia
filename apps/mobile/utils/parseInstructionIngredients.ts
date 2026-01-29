/**
 * parseInstructionIngredients
 *
 * Parses instruction text and identifies ingredient references,
 * enriching them with quantity information for inline display.
 */

import { RecipeIngredient } from '../models/Recipe';

export interface ParsedSegment {
  type: 'text' | 'ingredient';
  content: string;
  ingredient?: {
    name: string;
    quantity: number;
    unit: string;
  };
}

/**
 * Normalizes ingredient name for matching:
 * - Lowercase
 * - Remove common prefixes like "fresh", "dried", etc.
 * - Handle pluralization
 */
function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a word is a common cooking modifier that shouldn't be matched alone
 */
function isModifierWord(word: string): boolean {
  const modifiers = [
    'fresh', 'dried', 'frozen', 'chopped', 'diced', 'minced',
    'sliced', 'grated', 'shredded', 'crushed', 'ground', 'whole',
    'large', 'small', 'medium', 'extra', 'virgin', 'light', 'dark',
    'raw', 'cooked', 'melted', 'softened', 'room', 'temperature',
    'warm', 'cold', 'hot', 'organic', 'unsalted', 'salted',
  ];
  return modifiers.includes(word.toLowerCase());
}

/**
 * Create variations of an ingredient name for matching
 * e.g., "tomatoes" -> ["tomatoes", "tomato"]
 */
function getNameVariations(name: string): string[] {
  const normalized = normalizeForMatching(name);
  const variations = [normalized];

  // Handle pluralization
  if (normalized.endsWith('es')) {
    variations.push(normalized.slice(0, -2)); // tomatoes -> tomato
    variations.push(normalized.slice(0, -1)); // tomatoes -> tomatoe (edge cases)
  } else if (normalized.endsWith('ies')) {
    variations.push(normalized.slice(0, -3) + 'y'); // berries -> berry
  } else if (normalized.endsWith('s') && !normalized.endsWith('ss')) {
    variations.push(normalized.slice(0, -1)); // carrots -> carrot
  } else {
    // Add plural form
    variations.push(normalized + 's');
    if (normalized.endsWith('y')) {
      variations.push(normalized.slice(0, -1) + 'ies');
    }
  }

  // Also try the last word if it's multi-word (e.g., "olive oil" -> "oil")
  const words = normalized.split(' ');
  if (words.length > 1) {
    const lastWord = words[words.length - 1];
    if (!isModifierWord(lastWord)) {
      variations.push(lastWord);
    }
  }

  return [...new Set(variations)]; // Remove duplicates
}

/**
 * Build a regex pattern that matches any of the ingredient variations
 * as whole words (not partial matches)
 */
function buildIngredientPattern(ingredients: RecipeIngredient[]): {
  pattern: RegExp;
  ingredientMap: Map<string, RecipeIngredient>;
} {
  const ingredientMap = new Map<string, RecipeIngredient>();
  const allPatterns: string[] = [];

  // Sort by name length (longest first) to match "olive oil" before "oil"
  const sortedIngredients = [...ingredients].sort(
    (a, b) => b.name.length - a.name.length
  );

  for (const ingredient of sortedIngredients) {
    const variations = getNameVariations(ingredient.name);
    for (const variation of variations) {
      if (!ingredientMap.has(variation)) {
        ingredientMap.set(variation, ingredient);
        // Escape special regex characters
        const escaped = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        allPatterns.push(escaped);
      }
    }
  }

  // Build regex that matches whole words only
  // Use word boundary but allow for common cooking contexts
  const patternStr = allPatterns.length > 0
    ? `\\b(${allPatterns.join('|')})\\b`
    : '^$'; // Match nothing if no patterns

  return {
    pattern: new RegExp(patternStr, 'gi'),
    ingredientMap,
  };
}

/**
 * Parse instruction text and return segments with ingredient highlighting
 *
 * @param instruction - The instruction text to parse
 * @param ingredients - Array of recipe ingredients with quantities
 * @returns Array of parsed segments (text or ingredient)
 */
export function parseInstructionWithIngredients(
  instruction: string,
  ingredients: RecipeIngredient[]
): ParsedSegment[] {
  if (!ingredients || ingredients.length === 0) {
    return [{ type: 'text', content: instruction }];
  }

  const { pattern, ingredientMap } = buildIngredientPattern(ingredients);
  const segments: ParsedSegment[] = [];
  let lastIndex = 0;

  // Find all matches
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(instruction)) !== null) {
    const matchedText = match[1];
    const matchStart = match.index;

    // Add text before this match
    if (matchStart > lastIndex) {
      segments.push({
        type: 'text',
        content: instruction.slice(lastIndex, matchStart),
      });
    }

    // Find the ingredient this match corresponds to
    const normalizedMatch = normalizeForMatching(matchedText);
    const ingredient = ingredientMap.get(normalizedMatch);

    if (ingredient) {
      segments.push({
        type: 'ingredient',
        content: matchedText, // Keep original casing from instruction
        ingredient: {
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        },
      });
    } else {
      // Shouldn't happen, but fallback to text
      segments.push({
        type: 'text',
        content: matchedText,
      });
    }

    lastIndex = matchStart + matchedText.length;
  }

  // Add remaining text after last match
  if (lastIndex < instruction.length) {
    segments.push({
      type: 'text',
      content: instruction.slice(lastIndex),
    });
  }

  // If no matches found, return original text
  if (segments.length === 0) {
    return [{ type: 'text', content: instruction }];
  }

  return segments;
}

/**
 * Format ingredient quantity and unit for display
 * e.g., { quantity: 2, unit: "cups" } -> "2 cups"
 */
export function formatIngredientQuantity(
  quantity: number,
  unit: string
): string {
  // Handle fractions nicely
  const fractionMap: Record<number, string> = {
    0.25: '1/4',
    0.33: '1/3',
    0.5: '1/2',
    0.67: '2/3',
    0.75: '3/4',
  };

  let quantityStr: string;
  const decimal = quantity % 1;

  if (decimal === 0) {
    quantityStr = quantity.toString();
  } else if (fractionMap[decimal]) {
    const whole = Math.floor(quantity);
    quantityStr = whole > 0
      ? `${whole} ${fractionMap[decimal]}`
      : fractionMap[decimal];
  } else {
    // Round to 1 decimal place
    quantityStr = quantity.toFixed(1).replace(/\.0$/, '');
  }

  // Handle empty or "to taste" units
  if (!unit || unit === 'to taste' || unit === 'as needed') {
    return quantityStr;
  }

  return `${quantityStr} ${unit}`;
}
