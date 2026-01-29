// api/pantry/index.ts
// List and create pantry items

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { db, pantryItems } from "../../db";
import { eq, asc } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization as string);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // GET - List pantry items
  if (req.method === "GET") {
    try {
      const items = await db.query.pantryItems.findMany({
        where: eq(pantryItems.userId, user.id),
        orderBy: [asc(pantryItems.name)],
      });

      return res.status(200).json({ items });
    } catch (error: any) {
      console.error("Error fetching pantry items:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Create pantry item
  if (req.method === "POST") {
    try {
      const body = req.body;

      const [newItem] = await db
        .insert(pantryItems)
        .values({
          userId: user.id,
          name: body.name,
          quantity: body.quantity,
          unit: body.unit,
          category: body.category || "other",
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
          notes: body.notes,
        })
        .returning();

      return res.status(201).json({ item: newItem });
    } catch (error: any) {
      console.error("Error creating pantry item:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
