// lib/recipeSharing.ts
// Utilities for formatting and sharing recipes

import { Share, Platform } from "react-native";
import { RecipeWithIngredients } from "./recipeService";

/**
 * Format a recipe for sharing as plain text
 */
export function formatRecipeForSharing(recipe: RecipeWithIngredients): string {
  let text = `🍴 ${recipe.title}\n`;

  // Timing info
  const times: string[] = [];
  if (recipe.prepTime) times.push(`Prep: ${recipe.prepTime} min`);
  if (recipe.cookTime) times.push(`Cook: ${recipe.cookTime} min`);
  if (times.length > 0) text += `⏱️ ${times.join(" | ")}\n`;

  if (recipe.servings) text += `👥 Serves ${recipe.servings}\n`;

  text += "\n";

  // Ingredients
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    text += "📝 Ingredients:\n";
    recipe.ingredients.forEach((ing) => {
      const qty = ing.quantity ? `${ing.quantity} ` : "";
      const unit = ing.unit ? `${ing.unit} ` : "";
      text += `• ${qty}${unit}${ing.name}\n`;
    });
    text += "\n";
  }

  // Instructions
  if (recipe.instructions && recipe.instructions.length > 0) {
    text += "👩‍🍳 Instructions:\n";
    recipe.instructions.forEach((step, idx) => {
      text += `${idx + 1}. ${step}\n`;
    });
    text += "\n";
  }

  // Source
  if (recipe.sourceUrl) {
    text += `📌 Source: ${recipe.sourceUrl}\n`;
  }

  text += "\n— Shared from Mangia 🍝";

  return text;
}

/**
 * Format just the ingredients list for quick sharing
 */
export function formatIngredientsForSharing(
  recipe: RecipeWithIngredients,
): string {
  let text = `🛒 Shopping list for: ${recipe.title}\n\n`;

  if (recipe.ingredients && recipe.ingredients.length > 0) {
    recipe.ingredients.forEach((ing) => {
      const qty = ing.quantity ? `${ing.quantity} ` : "";
      const unit = ing.unit ? `${ing.unit} ` : "";
      text += `☐ ${qty}${unit}${ing.name}\n`;
    });
  } else {
    text += "No ingredients listed.";
  }

  return text;
}

/**
 * Share a full recipe
 */
export async function shareRecipe(recipe: RecipeWithIngredients): Promise<void> {
  const message = formatRecipeForSharing(recipe);
  await Share.share({
    message,
    title: recipe.title,
  });
}

/**
 * Share just the ingredients as a shopping list
 */
export async function shareIngredients(
  recipe: RecipeWithIngredients,
): Promise<void> {
  const message = formatIngredientsForSharing(recipe);
  await Share.share({
    message,
    title: `Shopping list: ${recipe.title}`,
  });
}

/**
 * Options for sharing
 */
export type ShareOption = "full" | "ingredients";

/**
 * Share with options
 */
export async function shareWithOptions(
  recipe: RecipeWithIngredients,
  option: ShareOption,
): Promise<void> {
  switch (option) {
    case "ingredients":
      await shareIngredients(recipe);
      break;
    case "full":
    default:
      await shareRecipe(recipe);
      break;
  }
}
