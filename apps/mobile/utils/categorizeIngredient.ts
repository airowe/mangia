import { IngredientCategory } from '../models/Recipe';

/**
 * Returns the display name for a category (UI utility).
 * Categorization logic has moved server-side to lib/grocery-generator.ts.
 */
export function getCategoryDisplayName(category: IngredientCategory): string {
  const NAMES: Record<IngredientCategory, string> = {
    produce: 'Produce',
    meat_seafood: 'Meat & Seafood',
    dairy_eggs: 'Dairy & Eggs',
    bakery: 'Bread & Bakery',
    frozen: 'Frozen',
    canned: 'Canned Goods',
    pantry: 'Pantry',
    other: 'Other',
  };
  return NAMES[category] ?? 'Other';
}
