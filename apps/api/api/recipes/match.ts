// api/recipes/match.ts
// POST /api/recipes/match — match user's recipes against pantry contents

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { db, recipes, pantryItems } from "../../db";
import { eq } from "drizzle-orm";
import { findRecipeMatches } from "../../lib/ingredient-matching";

const matchSchema = z.object({
  minMatchPercentage: z.number().min(0).max(100).default(0),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateRequest(
      req.headers.authorization as string,
    );

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = validateBody(req.body, matchSchema, res);
    if (!body) return;

    // Fetch user's recipes with ingredients and pantry items in parallel
    const [userRecipes, userPantryItems] = await Promise.all([
      db.query.recipes.findMany({
        where: eq(recipes.userId, user.id),
        with: { ingredients: true },
      }),
      db.query.pantryItems.findMany({
        where: eq(pantryItems.userId, user.id),
      }),
    ]);

    // Map pantry items to the shape expected by the matching algorithm
    const pantryForMatching = userPantryItems.map((item) => ({
      id: item.id,
      title: item.name,
      quantity: item.quantity,
      unit: item.unit,
    }));

    // Run matching algorithm — map to RecipeLike shape
    const recipesForMatching = userRecipes.map((r) => ({
      id: r.id,
      title: r.title,
      ingredients: r.ingredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
      })),
    }));

    const matches = findRecipeMatches(
      recipesForMatching,
      pantryForMatching,
      body.minMatchPercentage,
    );

    return res.status(200).json({ matches });
  } catch (error) {
    return handleError(error, res);
  }
}
