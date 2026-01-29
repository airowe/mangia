// api/pantry/[id].ts
// Update and delete pantry items

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { updatePantryItemSchema } from "../../lib/schemas";
import { handleError } from "../../lib/errors";
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
      const body = validateBody(req.body, updatePantryItemSchema, res);
      if (!body) return;

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
    } catch (error) {
      return handleError(error, res);
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
    } catch (error) {
      return handleError(error, res);
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
