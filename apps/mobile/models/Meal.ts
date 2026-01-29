// Re-export meal types from shared package
export {
  type MealType,
  type Meal,
  type MealPlanDay,
  type MealPlanFilters,
  type MealPlanResponse,
  type ShoppingListItem,
} from '@mangia/shared';

// Re-export Recipe for backward compatibility (was imported from ./Recipe)
export { type Recipe } from '@mangia/shared';
