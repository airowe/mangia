// utils/recipeScaling.ts
// Utility functions for scaling recipe ingredients based on serving size

import { RecipeIngredient } from '../models/Recipe';

/**
 * Scale an ingredient quantity based on serving multiplier
 */
export function scaleQuantity(
  originalQuantity: number,
  scaleFactor: number
): number {
  const scaled = originalQuantity * scaleFactor;

  // Round to reasonable precision based on the scale
  if (scaled < 0.125) {
    return Math.round(scaled * 16) / 16; // 1/16 precision for tiny amounts
  } else if (scaled < 1) {
    return Math.round(scaled * 8) / 8; // 1/8 precision for fractions
  } else if (scaled < 10) {
    return Math.round(scaled * 4) / 4; // 1/4 precision for small amounts
  } else {
    return Math.round(scaled * 2) / 2; // 1/2 precision for larger amounts
  }
}

/**
 * Format a quantity for display, converting decimals to fractions where appropriate
 */
export function formatQuantity(quantity: number): string {
  if (quantity === 0) return '';

  // Handle whole numbers
  if (Number.isInteger(quantity)) {
    return quantity.toString();
  }

  const wholePart = Math.floor(quantity);
  const fractionPart = quantity - wholePart;

  // Common cooking fractions
  const fractionMap: Record<number, string> = {
    0.125: '⅛',
    0.25: '¼',
    0.333: '⅓',
    0.375: '⅜',
    0.5: '½',
    0.625: '⅝',
    0.666: '⅔',
    0.75: '¾',
    0.875: '⅞',
  };

  // Find closest fraction
  let closestFraction = '';
  let minDiff = Infinity;

  for (const [value, symbol] of Object.entries(fractionMap)) {
    const diff = Math.abs(fractionPart - parseFloat(value));
    if (diff < minDiff && diff < 0.05) {
      minDiff = diff;
      closestFraction = symbol;
    }
  }

  if (closestFraction) {
    if (wholePart === 0) {
      return closestFraction;
    }
    return `${wholePart}${closestFraction}`;
  }

  // Fall back to decimal if no good fraction match
  return quantity.toFixed(quantity < 1 ? 2 : 1).replace(/\.?0+$/, '');
}

/**
 * Scale all ingredients in a recipe
 */
export function scaleIngredients(
  ingredients: RecipeIngredient[],
  originalServings: number,
  newServings: number
): RecipeIngredient[] {
  if (originalServings <= 0 || newServings <= 0) {
    return ingredients;
  }

  const scaleFactor = newServings / originalServings;

  return ingredients.map((ingredient) => ({
    ...ingredient,
    quantity: scaleQuantity(ingredient.quantity, scaleFactor),
  }));
}

/**
 * Get a scaled ingredient display string
 */
export function getScaledIngredientDisplay(
  ingredient: RecipeIngredient,
  scaleFactor: number
): string {
  const scaledQuantity = scaleQuantity(ingredient.quantity, scaleFactor);
  const quantityStr = formatQuantity(scaledQuantity);

  const parts: string[] = [];

  if (quantityStr) {
    parts.push(quantityStr);
  }

  if (ingredient.unit) {
    parts.push(ingredient.unit);
  }

  parts.push(ingredient.name);

  return parts.join(' ');
}

// getServingSuggestions moved to server: GET /api/recipes/:id returns servingSuggestions[]
