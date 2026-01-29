// Re-export pantry types from shared package
export { type Product, type PantryItem, type StockStatus } from '@mangia/shared';

// Re-export IngredientCategory for backward compatibility (was imported from ./Recipe)
export { type IngredientCategory } from '@mangia/shared';
