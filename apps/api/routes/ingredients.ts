// routes/ingredients.ts
// POST /api/ingredients/categorize

import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { parseJson } from "../middleware/validate";
import { categorizeIngredient } from "../lib/grocery-generator";

const categorizeSchema = z.object({
  names: z.array(z.string().min(1)).min(1).max(100),
});

export const ingredientsRoutes = new Hono<AuthEnv>();

ingredientsRoutes.use(authMiddleware);

ingredientsRoutes.post("/categorize", async (c) => {
  const { names } = await parseJson(c, categorizeSchema);
  const categories = names.map((name: string) => ({
    name,
    category: categorizeIngredient(name),
  }));
  return c.json({ categories });
});
