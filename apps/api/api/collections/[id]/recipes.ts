// api/collections/[id]/recipes.ts
// Add and remove recipes from a collection

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../../lib/auth";
import { validateBody } from "../../../lib/validation";
import { collectionRecipeSchema } from "../../../lib/schemas";
import { handleError } from "../../../lib/errors";
import { db, collections, recipes, recipeCollections } from "../../../db";
import { eq, and } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization as string);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id: collectionId } = req.query;

  if (!collectionId || typeof collectionId !== "string") {
    return res.status(400).json({ error: "Collection ID required" });
  }

  // Verify collection ownership
  const collection = await db.query.collections.findFirst({
    where: and(eq(collections.id, collectionId), eq(collections.userId, user.id)),
  });

  if (!collection) {
    return res.status(404).json({ error: "Collection not found" });
  }

  // POST - Add recipe to collection
  if (req.method === "POST") {
    try {
      const body = validateBody(req.body, collectionRecipeSchema, res);
      if (!body) return;

      // Verify recipe ownership
      const recipe = await db.query.recipes.findFirst({
        where: and(eq(recipes.id, body.recipeId), eq(recipes.userId, user.id)),
      });

      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      // Check for duplicate
      const existing = await db.query.recipeCollections.findFirst({
        where: and(
          eq(recipeCollections.collectionId, collectionId),
          eq(recipeCollections.recipeId, body.recipeId)
        ),
      });

      if (existing) {
        return res.status(409).json({ error: "Recipe already in collection" });
      }

      const [entry] = await db
        .insert(recipeCollections)
        .values({
          collectionId,
          recipeId: body.recipeId,
        })
        .returning();

      return res.status(201).json({ recipeCollection: entry });
    } catch (error) {
      return handleError(error, res);
    }
  }

  // DELETE - Remove recipe from collection
  if (req.method === "DELETE") {
    try {
      const body = validateBody(req.body, collectionRecipeSchema, res);
      if (!body) return;

      const [deleted] = await db
        .delete(recipeCollections)
        .where(
          and(
            eq(recipeCollections.collectionId, collectionId),
            eq(recipeCollections.recipeId, body.recipeId)
          )
        )
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Recipe not found in collection" });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      return handleError(error, res);
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
