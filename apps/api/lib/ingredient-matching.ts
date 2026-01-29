// lib/ingredient-matching.ts
// Server-side recipe-to-pantry matching algorithm
// Ported from apps/mobile/lib/whatCanIMake.ts

interface PantryItemLike {
  id: string;
  title?: string;
  name?: string;
  quantity?: number | null;
  unit?: string | null;
}

interface RecipeIngredientLike {
  id?: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
}

interface RecipeLike {
  id: string;
  title: string;
  ingredients: RecipeIngredientLike[];
  [key: string]: unknown;
}

export interface IngredientMatch {
  recipeIngredient: RecipeIngredientLike;
  pantryItem: PantryItemLike;
  hasEnough: boolean;
}

export interface RecipeMatch {
  recipe: RecipeLike;
  matchPercentage: number;
  haveIngredients: IngredientMatch[];
  missingIngredients: RecipeIngredientLike[];
  totalIngredients: number;
  isCompleteMatch: boolean;
}

/**
 * Normalize ingredient name for comparison.
 * Handles plurals, common variations, and extra whitespace.
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s*(pieces?|slices?|cloves?|leaves?|stalks?|bunche?s?|heads?)$/i, "")
    .replace(/ies$/, "y")
    .replace(/es$/, "")
    .replace(/s$/, "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Substitution groups — items in the same group can match each other.
 */
const SUBSTITUTIONS: Record<string, string[]> = {
  chicken: ["chicken breast", "chicken thigh", "chicken leg", "chicken wing"],
  beef: ["ground beef", "beef steak", "beef chuck", "stew meat"],
  pasta: ["spaghetti", "penne", "fettuccine", "linguine", "rigatoni"],
  rice: ["white rice", "brown rice", "jasmine rice", "basmati rice"],
  milk: ["whole milk", "2% milk", "skim milk"],
  oil: ["vegetable oil", "canola oil", "olive oil", "cooking oil"],
  onion: ["yellow onion", "white onion", "red onion", "sweet onion"],
  garlic: ["garlic clove", "minced garlic", "fresh garlic"],
  tomato: ["roma tomato", "cherry tomato", "grape tomato", "tomatoes"],
  pepper: ["bell pepper", "green pepper", "red pepper", "yellow pepper"],
  cheese: ["cheddar", "mozzarella", "parmesan", "swiss", "provolone"],
};

/**
 * Check if a pantry item matches a recipe ingredient.
 * Uses exact match, partial match, and substitution groups.
 */
function ingredientsMatch(
  pantryItem: PantryItemLike,
  recipeIngredient: RecipeIngredientLike,
): boolean {
  const pantryName = normalizeIngredientName(pantryItem.title || pantryItem.name || "");
  const ingredientName = normalizeIngredientName(recipeIngredient.name);

  if (!pantryName || !ingredientName) return false;

  // Exact match
  if (pantryName === ingredientName) return true;

  // Partial match
  if (pantryName.includes(ingredientName) || ingredientName.includes(pantryName)) {
    return true;
  }

  // Substitution groups
  for (const [base, variants] of Object.entries(SUBSTITUTIONS)) {
    const pantryInGroup =
      pantryName === base ||
      variants.some((v) => {
        const nv = normalizeIngredientName(v);
        return nv === pantryName || pantryName.includes(nv);
      });
    const ingredientInGroup =
      ingredientName === base ||
      variants.some((v) => {
        const nv = normalizeIngredientName(v);
        return nv === ingredientName || ingredientName.includes(nv);
      });

    if (pantryInGroup && ingredientInGroup) return true;
  }

  return false;
}

/**
 * Check if pantry has enough quantity of an ingredient.
 */
function hasEnoughQuantity(
  pantryItem: PantryItemLike,
  recipeIngredient: RecipeIngredientLike,
): boolean {
  if (!pantryItem.quantity || !recipeIngredient.quantity) return true;
  if (pantryItem.unit === recipeIngredient.unit) {
    return pantryItem.quantity >= recipeIngredient.quantity;
  }
  // Different units — assume sufficient (unit conversion is complex)
  return true;
}

/**
 * Find the first matching pantry item for a recipe ingredient.
 */
function findPantryMatch(
  ingredient: RecipeIngredientLike,
  pantryItems: PantryItemLike[],
): PantryItemLike | null {
  return pantryItems.find((item) => ingredientsMatch(item, ingredient)) || null;
}

/**
 * Calculate recipe matches based on pantry contents.
 * Returns matches sorted by percentage (highest first).
 */
export function findRecipeMatches(
  recipes: RecipeLike[],
  pantryItems: PantryItemLike[],
  minMatchPercentage: number = 0,
): RecipeMatch[] {
  const matches: RecipeMatch[] = [];

  for (const recipe of recipes) {
    const ingredients = recipe.ingredients || [];
    if (ingredients.length === 0) continue;

    const haveIngredients: IngredientMatch[] = [];
    const missingIngredients: RecipeIngredientLike[] = [];

    for (const ingredient of ingredients) {
      const pantryMatch = findPantryMatch(ingredient, pantryItems);

      if (pantryMatch) {
        haveIngredients.push({
          recipeIngredient: ingredient,
          pantryItem: pantryMatch,
          hasEnough: hasEnoughQuantity(pantryMatch, ingredient),
        });
      } else {
        missingIngredients.push(ingredient);
      }
    }

    const matchPercentage = Math.round(
      (haveIngredients.length / ingredients.length) * 100,
    );

    if (matchPercentage >= minMatchPercentage) {
      matches.push({
        recipe,
        matchPercentage,
        haveIngredients,
        missingIngredients,
        totalIngredients: ingredients.length,
        isCompleteMatch: missingIngredients.length === 0,
      });
    }
  }

  return matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
}
