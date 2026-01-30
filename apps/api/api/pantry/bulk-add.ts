// api/pantry/bulk-add.ts
// POST /api/pantry/bulk-add — Add or merge multiple items into pantry

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { db, pantryItems } from "../../db";
import { eq, asc } from "drizzle-orm";
import { normalizeItemName } from "../../lib/ingredient-matcher";
import { categorizeIngredient } from "../../lib/grocery-generator";
import { getExpiryDefault } from "../../lib/expiry-defaults";
import { logPantryEvents } from "../../lib/pantry-event-logger";

const ingredientCategoryEnum = z.enum([
  "produce", "meat_seafood", "dairy_eggs", "bakery",
  "frozen", "canned", "pantry", "other",
]);

const bulkAddItemSchema = z.object({
  name: z.string().min(1).max(500),
  quantity: z.number().nonnegative().optional().default(1),
  unit: z.string().max(100).optional().default("piece"),
  category: ingredientCategoryEnum.optional(),
  source: z.string().max(100).optional(),
  expiryDate: z.string().optional().nullable(),
});

const bulkAddSchema = z.object({
  items: z.array(bulkAddItemSchema).min(1).max(100),
  mergeStrategy: z.enum(["increment", "replace"]).optional().default("increment"),
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

    const body = validateBody(req.body, bulkAddSchema, res);
    if (!body) return;

    // Fetch existing pantry items for merge detection
    const existing = await db.query.pantryItems.findMany({
      where: eq(pantryItems.userId, user.id),
      orderBy: [asc(pantryItems.name)],
    });

    const existingMap = new Map<string, typeof existing[number]>();
    for (const item of existing) {
      existingMap.set(normalizeItemName(item.name), item);
    }

    let addedCount = 0;
    let mergedCount = 0;
    const resultItems: typeof existing = [];

    for (const item of body.items) {
      const normalizedName = normalizeItemName(item.name);
      const category = item.category ?? categorizeIngredient(item.name);
      const existingItem = existingMap.get(normalizedName);

      if (existingItem) {
        // Merge: increment or replace quantity
        const newQuantity = body.mergeStrategy === "increment"
          ? (existingItem.quantity ?? 0) + (item.quantity ?? 1)
          : (item.quantity ?? 1);

        const [updated] = await db
          .update(pantryItems)
          .set({
            quantity: newQuantity,
            unit: item.unit || existingItem.unit,
            category,
            updatedAt: new Date(),
          })
          .where(eq(pantryItems.id, existingItem.id))
          .returning();

        resultItems.push(updated);
        mergedCount++;
      } else {
        // Create new item with smart expiry default if not provided
        const expiryDate = item.expiryDate
          ? new Date(item.expiryDate)
          : getExpiryDefault(item.name, category);

        const [created] = await db
          .insert(pantryItems)
          .values({
            userId: user.id,
            name: item.name,
            quantity: item.quantity ?? 1,
            unit: item.unit || "piece",
            category,
            expiryDate,
          })
          .returning();

        resultItems.push(created);
        // Update the map so subsequent items in the same batch can merge
        existingMap.set(normalizedName, created);
        addedCount++;
      }
    }

    // Log events for prediction tracking
    logPantryEvents(
      user.id,
      body.items.map((i) => ({ name: i.name, quantity: i.quantity ?? 1, unit: i.unit ?? "piece" })),
      "added",
      body.items[0]?.source ?? "bulk_add",
    );

    return res.status(200).json({
      added: addedCount,
      merged: mergedCount,
      items: resultItems,
    });
  } catch (error) {
    return handleError(error, res);
  }
}
