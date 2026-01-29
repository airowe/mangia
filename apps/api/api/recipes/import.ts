// api/recipes/import.ts
// POST /api/recipes/import — parse a URL and create a recipe in one call

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { checkImportLimit, incrementImportCount } from "../../lib/rate-limit";
import { handleError, ApiError } from "../../lib/errors";
import { db, recipes, ingredients } from "../../db";
import { eq } from "drizzle-orm";
import { parseRecipeFromUrl, detectUrlType } from "../../lib/recipe-parser";

const importSchema = z.object({
  url: z.string().url("Please provide a valid URL").refine(
    (url) => url.startsWith("http://") || url.startsWith("https://"),
    "Only HTTP and HTTPS URLs are supported",
  ),
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

    const body = validateBody(req.body, importSchema, res);
    if (!body) return;

    // Check import limit
    const limitResult = await checkImportLimit(user.id, user.isPremium);
    if (!limitResult.allowed) {
      return res.status(429).json({
        error: "Monthly recipe import limit reached",
        code: "IMPORT_LIMIT_REACHED",
        limit: limitResult.limit,
        remaining: 0,
        resetAt: limitResult.resetAt?.toISOString(),
      });
    }

    // Parse the URL into a structured recipe
    const parsed = await parseRecipeFromUrl(body.url);
    const sourceType = detectUrlType(body.url);

    // Insert recipe
    const [newRecipe] = await db
      .insert(recipes)
      .values({
        userId: user.id,
        title: parsed.title,
        description: parsed.description,
        imageUrl: parsed.imageUrl,
        sourceUrl: body.url,
        sourceType,
        status: "want_to_cook",
        prepTime: parsed.prepTime,
        cookTime: parsed.cookTime,
        servings: parsed.servings,
        instructions: parsed.instructions,
      })
      .returning();

    // Insert ingredients
    if (parsed.ingredients.length > 0) {
      await db.insert(ingredients).values(
        parsed.ingredients.map((ing, index) => ({
          recipeId: newRecipe.id,
          name: ing.name,
          quantity: ing.quantity ? parseFloat(ing.quantity) || null : null,
          unit: ing.unit || null,
          orderIndex: index,
        })),
      );
    }

    // Fetch complete recipe with ingredients
    const completeRecipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, newRecipe.id),
      with: { ingredients: true },
    });

    // Increment import counter
    await incrementImportCount(user.id);

    return res.status(201).json({ recipe: completeRecipe });
  } catch (error) {
    return handleError(error, res);
  }
}
