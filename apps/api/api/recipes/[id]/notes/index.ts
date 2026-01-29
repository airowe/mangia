// api/recipes/[id]/notes/index.ts
// List and create recipe notes

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../../../lib/auth";
import { db, recipeNotes, recipes } from "../../../../db";
import { eq, and, desc } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization as string);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id: recipeId } = req.query;

  if (!recipeId || typeof recipeId !== "string") {
    return res.status(400).json({ error: "Recipe ID required" });
  }

  // Verify user owns this recipe
  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.userId, user.id)),
  });

  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }

  // GET - List notes for recipe
  if (req.method === "GET") {
    try {
      const notes = await db.query.recipeNotes.findMany({
        where: eq(recipeNotes.recipeId, recipeId),
        orderBy: [desc(recipeNotes.createdAt)],
      });

      return res.status(200).json(notes);
    } catch (error: any) {
      console.error("Error fetching recipe notes:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Create note
  if (req.method === "POST") {
    try {
      const { note, cooked_at } = req.body;

      if (!note) {
        return res.status(400).json({ error: "Note content is required" });
      }

      const [newNote] = await db
        .insert(recipeNotes)
        .values({
          recipeId,
          userId: user.id,
          note,
          cookedAt: cooked_at || new Date().toISOString().split("T")[0],
        })
        .returning();

      // Update recipe's cook count and last cooked date
      await db
        .update(recipes)
        .set({
          cookCount: (recipe.cookCount || 0) + 1,
          lastCookedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(recipes.id, recipeId));

      return res.status(201).json(newNote);
    } catch (error: any) {
      console.error("Error creating recipe note:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
