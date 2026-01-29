// api/pantry/[id].ts
// Update and delete pantry items

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { db, pantryItems } from "../../db";
import { eq, and } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization as string);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Item ID required" });
  }

  // PATCH - Update pantry item
  if (req.method === "PATCH") {
    try {
      const body = req.body;

      const [updatedItem] = await db
        .update(pantryItems)
        .set({
          name: body.name,
          quantity: body.quantity,
          unit: body.unit,
          category: body.category,
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
          notes: body.notes,
          updatedAt: new Date(),
        })
        .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, user.id)))
        .returning();

      if (!updatedItem) {
        return res.status(404).json({ error: "Item not found" });
      }

      return res.status(200).json({ item: updatedItem });
    } catch (error: any) {
      console.error("Error updating pantry item:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - Delete pantry item
  if (req.method === "DELETE") {
    try {
      const [deletedItem] = await db
        .delete(pantryItems)
        .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, user.id)))
        .returning();

      if (!deletedItem) {
        return res.status(404).json({ error: "Item not found" });
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error deleting pantry item:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
