// api/ingredients/categorize.ts
// Batch categorize ingredient names into store sections

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { categorizeIngredient } from "../../lib/grocery-generator";

const categorizeSchema = z.object({
  names: z.array(z.string().min(1)).min(1).max(100),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization as string);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = validateBody(req.body, categorizeSchema, res);
    if (!body) return;

    const categories = body.names.map((name) => ({
      name,
      category: categorizeIngredient(name),
    }));

    return res.status(200).json({ categories });
  } catch (error) {
    return handleError(error, res);
  }
}
