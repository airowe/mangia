// api/cookbooks/[id].ts
// Get, update, and delete individual cookbooks

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { updateCookbookSchema } from "../../lib/schemas";
import { db, cookbooks } from "../../db";
import { eq, and } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization as string);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Premium check
  if (!user.isPremium) {
    return res.status(403).json({ error: "Premium feature" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid cookbook ID" });
  }

  // GET - Get single cookbook
  if (req.method === "GET") {
    try {
      const cookbook = await db.query.cookbooks.findFirst({
        where: and(eq(cookbooks.id, id), eq(cookbooks.userId, user.id)),
      });

      if (!cookbook) {
        return res.status(404).json({ error: "Cookbook not found" });
      }

      return res.status(200).json({ cookbook });
    } catch (error: any) {
      console.error("Error fetching cookbook:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // PATCH - Update cookbook
  if (req.method === "PATCH") {
    try {
      const body = validateBody(req.body, updateCookbookSchema, res);
      if (!body) return;

      // Verify ownership
      const existing = await db.query.cookbooks.findFirst({
        where: and(eq(cookbooks.id, id), eq(cookbooks.userId, user.id)),
      });

      if (!existing) {
        return res.status(404).json({ error: "Cookbook not found" });
      }

      const [updated] = await db
        .update(cookbooks)
        .set({
          title: body.title ?? existing.title,
          author: body.author ?? existing.author,
          coverImageUrl: body.coverImageUrl ?? existing.coverImageUrl,
          isbn: body.isbn ?? existing.isbn,
          notes: body.notes ?? existing.notes,
          updatedAt: new Date(),
        })
        .where(eq(cookbooks.id, id))
        .returning();

      return res.status(200).json({ cookbook: updated });
    } catch (error: any) {
      console.error("Error updating cookbook:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - Delete cookbook
  if (req.method === "DELETE") {
    try {
      // Verify ownership
      const existing = await db.query.cookbooks.findFirst({
        where: and(eq(cookbooks.id, id), eq(cookbooks.userId, user.id)),
      });

      if (!existing) {
        return res.status(404).json({ error: "Cookbook not found" });
      }

      await db.delete(cookbooks).where(eq(cookbooks.id, id));

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error deleting cookbook:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
