// api/recipes/[id].ts
// Get, update, delete single recipe

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { updateRecipeSchema } from "../../lib/schemas";
import { handleError } from "../../lib/errors";
import { db, recipes, ingredients } from "../../db";
import { eq, and } from "drizzle-orm";
import { getDifficulty, formatTotalTime } from "../../lib/recipe-metadata";
import { getServingSuggestions } from "../../lib/serving-suggestions";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization as string);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Recipe ID required" });
  }

  // GET - Get single recipe
  if (req.method === "GET") {
    try {
      const recipe = await db.query.recipes.findFirst({
        where: and(eq(recipes.id, id), eq(recipes.userId, user.id)),
        with: {
          ingredients: true,
        },
      });

      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      const enrichedRecipe = {
        ...recipe,
        difficulty: getDifficulty(recipe.prepTime, recipe.cookTime),
        formattedTotalTime: formatTotalTime(recipe.prepTime, recipe.cookTime),
        servingSuggestions: getServingSuggestions(recipe.servings || 4),
      };

      return res.status(200).json({ recipe: enrichedRecipe });
    } catch (error) {
      return handleError(error, res);
    }
  }

  // PATCH - Update recipe
  if (req.method === "PATCH") {
    try {
      const body = validateBody(req.body, updateRecipeSchema, res);
      if (!body) return;

      // Update recipe
      const [updatedRecipe] = await db
        .update(recipes)
        .set({
          title: body.title,
          description: body.description,
          imageUrl: body.imageUrl,
          sourceUrl: body.sourceUrl,
          status: body.status,
          mealType: body.mealType,
          prepTime: body.prepTime,
          cookTime: body.cookTime,
          totalTime: body.totalTime,
          servings: body.servings,
          calories: body.calories,
          instructions: body.instructions,
          notes: body.notes,
          rating: body.rating,
          updatedAt: new Date(),
        })
        .where(and(eq(recipes.id, id), eq(recipes.userId, user.id)))
        .returning();

      if (!updatedRecipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      // Update ingredients if provided
      if (body.ingredients) {
        // Delete existing ingredients
        await db.delete(ingredients).where(eq(ingredients.recipeId, id));

        // Insert new ingredients
        if (body.ingredients.length > 0) {
          await db.insert(ingredients).values(
            body.ingredients.map((ing, index) => ({
              recipeId: id,
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              category: ing.category,
              notes: ing.notes,
              isOptional: ing.isOptional,
              orderIndex: index,
            }))
          );
        }
      }

      // Fetch complete recipe
      const completeRecipe = await db.query.recipes.findFirst({
        where: eq(recipes.id, id),
        with: {
          ingredients: true,
        },
      });

      return res.status(200).json({ recipe: completeRecipe });
    } catch (error) {
      return handleError(error, res);
    }
  }

  // DELETE - Delete recipe
  if (req.method === "DELETE") {
    try {
      const [deletedRecipe] = await db
        .delete(recipes)
        .where(and(eq(recipes.id, id), eq(recipes.userId, user.id)))
        .returning();

      if (!deletedRecipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      return handleError(error, res);
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
