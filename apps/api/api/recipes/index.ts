// api/recipes/index.ts
// List and create recipes

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { createRecipeSchema } from "../../lib/schemas";
import { db, recipes, ingredients } from "../../db";
import { eq, desc } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization as string);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // GET - List recipes
  if (req.method === "GET") {
    try {
      const { status, limit = "50", offset = "0" } = req.query;

      const userRecipes = await db.query.recipes.findMany({
        where: eq(recipes.userId, user.id),
        with: {
          ingredients: true,
        },
        orderBy: [desc(recipes.createdAt)],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      return res.status(200).json({ recipes: userRecipes });
    } catch (error: any) {
      console.error("Error fetching recipes:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Create recipe
  if (req.method === "POST") {
    try {
      const body = validateBody(req.body, createRecipeSchema, res);
      if (!body) return;

      // Create recipe
      const [newRecipe] = await db
        .insert(recipes)
        .values({
          userId: user.id,
          title: body.title,
          description: body.description,
          imageUrl: body.imageUrl,
          sourceUrl: body.sourceUrl,
          sourceType: body.sourceType,
          status: body.status,
          mealType: body.mealType,
          prepTime: body.prepTime,
          cookTime: body.cookTime,
          totalTime: body.totalTime,
          servings: body.servings,
          calories: body.calories,
          instructions: body.instructions,
          notes: body.notes,
        })
        .returning();

      // Create ingredients if provided
      if (body.ingredients && body.ingredients.length > 0) {
        await db.insert(ingredients).values(
          body.ingredients.map((ing, index) => ({
            recipeId: newRecipe.id,
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

      // Fetch complete recipe with ingredients
      const completeRecipe = await db.query.recipes.findFirst({
        where: eq(recipes.id, newRecipe.id),
        with: {
          ingredients: true,
        },
      });

      return res.status(201).json({ recipe: completeRecipe });
    } catch (error: any) {
      console.error("Error creating recipe:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
