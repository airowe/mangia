// api/recipes/[id]/notes/[noteId].ts
// Delete single recipe note

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../../../lib/auth";
import { db, recipeNotes, recipes } from "../../../../db";
import { eq, and } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization as string);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id: recipeId, noteId } = req.query;

  if (!recipeId || typeof recipeId !== "string") {
    return res.status(400).json({ error: "Recipe ID required" });
  }

  if (!noteId || typeof noteId !== "string") {
    return res.status(400).json({ error: "Note ID required" });
  }

  // Verify user owns this recipe
  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.userId, user.id)),
  });

  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }

  // DELETE - Delete note
  if (req.method === "DELETE") {
    try {
      const [deleted] = await db
        .delete(recipeNotes)
        .where(
          and(
            eq(recipeNotes.id, noteId),
            eq(recipeNotes.recipeId, recipeId),
            eq(recipeNotes.userId, user.id)
          )
        )
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Note not found" });
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error deleting recipe note:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
