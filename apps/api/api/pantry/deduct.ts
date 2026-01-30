// api/pantry/deduct.ts
// POST /api/pantry/deduct — Deduct recipe ingredients from pantry after cooking

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { db, pantryItems, recipes } from "../../db";
import { eq, and } from "drizzle-orm";
import { normalizeItemName, ingredientsMatch } from "../../lib/ingredient-matcher";
import { setUndoEntry } from "../../lib/deduct-undo-store";
import { logPantryEvents } from "../../lib/pantry-event-logger";
import { randomUUID } from "crypto";

const deductSchema = z.object({
  recipeId: z.string().uuid(),
  servingsCooked: z.number().positive(),
  servingsOriginal: z.number().positive(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateRequest(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = validateBody(req.body, deductSchema, res);
    if (!body) return;

    // Fetch recipe with ingredients
    const recipe = await db.query.recipes.findFirst({
      where: and(eq(recipes.id, body.recipeId), eq(recipes.userId, user.id)),
      with: { ingredients: true },
    });

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    // Fetch user's pantry
    const userPantry = await db.query.pantryItems.findMany({
      where: eq(pantryItems.userId, user.id),
    });

    const scaleFactor = body.servingsCooked / body.servingsOriginal;
    const pantryNameMap = new Map<string, typeof userPantry[number]>();
    for (const item of userPantry) {
      pantryNameMap.set(normalizeItemName(item.name), item);
    }

    // Snapshot for undo
    const snapshot: { id: string; quantity: number | null }[] = [];
    const deducted: { name: string; deducted: number; remaining: number; removed: boolean }[] = [];
    const skipped: string[] = [];

    for (const ingredient of recipe.ingredients) {
      const scaledQty = (ingredient.quantity ?? 0) * scaleFactor;
      if (scaledQty <= 0) {
        skipped.push(ingredient.name);
        continue;
      }

      // Find matching pantry item
      let matchedPantryItem: typeof userPantry[number] | undefined;
      const normName = normalizeItemName(ingredient.name);

      // Exact normalized match first
      if (pantryNameMap.has(normName)) {
        matchedPantryItem = pantryNameMap.get(normName);
      } else {
        // Fuzzy match
        for (const pantryItem of userPantry) {
          if (ingredientsMatch(ingredient.name, pantryItem.name)) {
            matchedPantryItem = pantryItem;
            break;
          }
        }
      }

      if (!matchedPantryItem) {
        skipped.push(ingredient.name);
        continue;
      }

      // Save snapshot before modifying
      snapshot.push({ id: matchedPantryItem.id, quantity: matchedPantryItem.quantity });

      const currentQty = matchedPantryItem.quantity ?? 0;
      const newQty = Math.max(0, currentQty - scaledQty);
      const actualDeducted = currentQty - newQty;

      if (newQty <= 0) {
        // Remove item from pantry
        await db.delete(pantryItems).where(eq(pantryItems.id, matchedPantryItem.id));
        deducted.push({ name: matchedPantryItem.name, deducted: actualDeducted, remaining: 0, removed: true });
      } else {
        // Update quantity
        await db
          .update(pantryItems)
          .set({ quantity: newQty, updatedAt: new Date() })
          .where(eq(pantryItems.id, matchedPantryItem.id));
        deducted.push({ name: matchedPantryItem.name, deducted: actualDeducted, remaining: newQty, removed: false });
      }
    }

    // Log deduction events
    logPantryEvents(
      user.id,
      deducted.map((d) => ({ name: d.name, quantity: d.deducted, unit: null })),
      "deducted",
      "cooking_deduction",
    );

    // Store undo snapshot (60s TTL)
    const undoToken = randomUUID();
    await setUndoEntry(undoToken, {
      userId: user.id,
      snapshot,
      expiresAt: Date.now() + 60_000,
    });

    return res.status(200).json({
      deducted,
      skipped,
      undoToken,
    });
  } catch (error) {
    return handleError(error, res);
  }
}
