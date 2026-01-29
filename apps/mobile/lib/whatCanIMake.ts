// lib/whatCanIMake.ts
// Service for matching recipes to available pantry items

import { RecipeWithIngredients, fetchAllUserRecipes } from "./recipeService";
import { fetchPantryItems } from "./pantry";
import { PantryItem } from "../models/Product";
import { RecipeIngredient } from "../models/Recipe";
import { RequestOptions } from "../hooks/useAbortableEffect";

export interface RecipeMatch {
  recipe: RecipeWithIngredients;
  matchPercentage: number;
  haveIngredients: IngredientMatch[];
  missingIngredients: RecipeIngredient[];
  totalIngredients: number;
  isCompleteMatch: boolean;
}

export interface IngredientMatch {
  recipeIngredient: RecipeIngredient;
  pantryItem: PantryItem;
  hasEnough: boolean;
}

/**
 * Normalize ingredient name for comparison
 * Handles plurals, common variations, and removes extra whitespace
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove common suffixes
    .replace(/\s*(pieces?|slices?|cloves?|leaves?|stalks?|bunche?s?|heads?)$/i, "")
    // Handle plurals
    .replace(/ies$/, "y")
    .replace(/es$/, "")
    .replace(/s$/, "")
    // Remove parenthetical notes
    .replace(/\s*\([^)]*\)/g, "")
    // Normalize whitespace
    .replace(/\s+/g, " ");
}

/**
 * Check if a pantry item matches a recipe ingredient
 * Uses fuzzy matching to handle variations in naming
 */
function ingredientsMatch(
  pantryItem: PantryItem,
  recipeIngredient: RecipeIngredient
): boolean {
  const pantryName = normalizeIngredientName(pantryItem.title);
  const ingredientName = normalizeIngredientName(recipeIngredient.name);

  // Exact match
  if (pantryName === ingredientName) return true;

  // Partial match (pantry contains ingredient or vice versa)
  if (pantryName.includes(ingredientName) || ingredientName.includes(pantryName)) {
    return true;
  }

  // Check for common substitutions
  const substitutions: Record<string, string[]> = {
    "chicken": ["chicken breast", "chicken thigh", "chicken leg", "chicken wing"],
    "beef": ["ground beef", "beef steak", "beef chuck", "stew meat"],
    "pasta": ["spaghetti", "penne", "fettuccine", "linguine", "rigatoni"],
    "rice": ["white rice", "brown rice", "jasmine rice", "basmati rice"],
    "milk": ["whole milk", "2% milk", "skim milk"],
    "oil": ["vegetable oil", "canola oil", "olive oil", "cooking oil"],
    "onion": ["yellow onion", "white onion", "red onion", "sweet onion"],
    "garlic": ["garlic clove", "minced garlic", "fresh garlic"],
    "tomato": ["roma tomato", "cherry tomato", "grape tomato", "tomatoes"],
    "pepper": ["bell pepper", "green pepper", "red pepper", "yellow pepper"],
    "cheese": ["cheddar", "mozzarella", "parmesan", "swiss", "provolone"],
  };

  // Check substitution groups
  for (const [base, variants] of Object.entries(substitutions)) {
    const pantryInGroup = pantryName === base || variants.some(v =>
      normalizeIngredientName(v) === pantryName || pantryName.includes(normalizeIngredientName(v))
    );
    const ingredientInGroup = ingredientName === base || variants.some(v =>
      normalizeIngredientName(v) === ingredientName || ingredientName.includes(normalizeIngredientName(v))
    );

    if (pantryInGroup && ingredientInGroup) return true;
  }

  return false;
}

/**
 * Check if pantry has enough quantity of an ingredient
 */
function hasEnoughQuantity(
  pantryItem: PantryItem,
  recipeIngredient: RecipeIngredient
): boolean {
  // If no quantities specified, assume we have enough
  if (!pantryItem.quantity || !recipeIngredient.quantity) return true;

  // If same units, compare directly
  if (pantryItem.unit === recipeIngredient.unit) {
    return pantryItem.quantity >= recipeIngredient.quantity;
  }

  // For different units, assume we have enough (quantity conversion is complex)
  return true;
}

/**
 * Find matching pantry item for a recipe ingredient
 */
function findPantryMatch(
  ingredient: RecipeIngredient,
  pantryItems: PantryItem[]
): PantryItem | null {
  return pantryItems.find(item => ingredientsMatch(item, ingredient)) || null;
}

/**
 * Calculate recipe matches based on pantry contents
 */
export async function findRecipeMatches(
  minMatchPercentage: number = 0,
  options?: RequestOptions,
): Promise<RecipeMatch[]> {
  // Fetch recipes and pantry items
  const [recipes, pantryItems] = await Promise.all([
    fetchAllUserRecipes(options),
    fetchPantryItems(options),
  ]);

  const matches: RecipeMatch[] = [];

  for (const recipe of recipes) {
    const ingredients = recipe.ingredients || [];

    // Skip recipes with no ingredients
    if (ingredients.length === 0) continue;

    const haveIngredients: IngredientMatch[] = [];
    const missingIngredients: RecipeIngredient[] = [];

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
      (haveIngredients.length / ingredients.length) * 100
    );

    // Only include recipes that meet minimum match threshold
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

  // Sort by match percentage (highest first)
  return matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
}

/**
 * Find recipes that can be made completely with current pantry
 */
export async function findCompleteMatches(): Promise<RecipeMatch[]> {
  const allMatches = await findRecipeMatches(100);
  return allMatches.filter(m => m.isCompleteMatch);
}

/**
 * Find recipes that are almost complete (80%+ match)
 */
export async function findAlmostCompleteMatches(): Promise<RecipeMatch[]> {
  const allMatches = await findRecipeMatches(80);
  return allMatches.filter(m => !m.isCompleteMatch);
}
