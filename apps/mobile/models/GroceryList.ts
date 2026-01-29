// Re-export grocery types from shared package
export {
  type GroceryList,
  type GroceryItem,
  type ConsolidatedIngredient,
} from '@mangia/shared';

// Re-export IngredientCategory for backward compatibility (was imported from ./Recipe)
export { type IngredientCategory } from '@mangia/shared';
