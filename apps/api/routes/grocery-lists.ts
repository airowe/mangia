// routes/grocery-lists.ts
// POST /api/grocery-lists/generate

import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { parseJson } from "../middleware/validate";
import { db, recipes, pantryItems } from "../db";
import { eq, inArray, and } from "drizzle-orm";
import { generateGroceryItems } from "../lib/grocery-generator";

const generateSchema = z.object({
  recipeIds: z.array(z.string().uuid()).min(1, "At least one recipe ID is required"),
});

export const groceryListsRoutes = new Hono<AuthEnv>();

groceryListsRoutes.use(authMiddleware);

groceryListsRoutes.post("/generate", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, generateSchema);

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

  const items = generateGroceryItems(
    recipesForGenerator,
    userPantryItems.map((p) => ({
      name: p.name,
      quantity: p.quantity,
      unit: p.unit,
    })),
  );

  return c.json({ items });
});
