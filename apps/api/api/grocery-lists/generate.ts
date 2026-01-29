// api/grocery-lists/generate.ts
// POST /api/grocery-lists/generate — consolidate ingredients from recipes, subtract pantry

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { db, recipes, pantryItems } from "../../db";
import { eq, inArray, and } from "drizzle-orm";
import { generateGroceryItems } from "../../lib/grocery-generator";

const generateSchema = z.object({
  recipeIds: z.array(z.string().uuid()).min(1, "At least one recipe ID is required"),
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

    const body = validateBody(req.body, generateSchema, res);
    if (!body) return;

    // Fetch requested recipes (owned by this user) and pantry items in parallel
    const [userRecipes, userPantryItems] = await Promise.all([
      db.query.recipes.findMany({
        where: and(
          eq(recipes.userId, user.id),
          inArray(recipes.id, body.recipeIds),
        ),
        with: { ingredients: true },
      }),
      db.query.pantryItems.findMany({
        where: eq(pantryItems.userId, user.id),
      }),
    ]);

    // Map to the shape expected by the generator
    const recipesForGenerator = userRecipes.map((r) => ({
      id: r.id,
      title: r.title,
      ingredients: r.ingredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        category: ing.category,
      })),
    }));

    // Generate consolidated grocery items
    const items = generateGroceryItems(
      recipesForGenerator,
      userPantryItems.map((p) => ({
        name: p.name,
        quantity: p.quantity,
        unit: p.unit,
      })),
    );

    return res.status(200).json({ items });
  } catch (error) {
    return handleError(error, res);
  }
}
