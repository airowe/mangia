// api/collections/[id].ts
// Get, update, delete single collection

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { updateCollectionSchema } from "../../lib/schemas";
import { db, collections, recipeCollections } from "../../db";
import { eq, and } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization as string);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Collection ID required" });
  }

  // GET - Get single collection with recipes
  if (req.method === "GET") {
    try {
      const collection = await db.query.collections.findFirst({
        where: and(eq(collections.id, id), eq(collections.userId, user.id)),
        with: {
          recipeCollections: {
            with: {
              recipe: true,
            },
          },
        },
      });

      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }

      const result = {
        ...collection,
        recipeCount: collection.recipeCollections.length,
        recipes: collection.recipeCollections.map((rc) => rc.recipe),
        recipeCollections: undefined,
      };

      return res.status(200).json({ collection: result });
    } catch (error: any) {
      console.error("Error fetching collection:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // PATCH - Update collection
  if (req.method === "PATCH") {
    try {
      const body = validateBody(req.body, updateCollectionSchema, res);
      if (!body) return;

      const [updated] = await db
        .update(collections)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(and(eq(collections.id, id), eq(collections.userId, user.id)))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Collection not found" });
      }

      return res.status(200).json({ collection: updated });
    } catch (error: any) {
      console.error("Error updating collection:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - Delete collection
  if (req.method === "DELETE") {
    try {
      const [deleted] = await db
        .delete(collections)
        .where(and(eq(collections.id, id), eq(collections.userId, user.id)))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Collection not found" });
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error deleting collection:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
