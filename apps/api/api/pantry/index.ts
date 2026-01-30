// api/pantry/index.ts
// List and create pantry items

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { createPantryItemSchema } from "../../lib/schemas";
import { handleError } from "../../lib/errors";
import { db, pantryItems } from "../../db";
import { eq, asc } from "drizzle-orm";
import { getStockStatus, getStockLabel } from "../../lib/stock-status";
import { getExpiryDefault } from "../../lib/expiry-defaults";
import { logPantryEvent } from "../../lib/pantry-event-logger";

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

      const enrichedItems = items.map((item) => {
        const status = getStockStatus(item.quantity);
        return {
          ...item,
          stockStatus: status,
          stockLabel: getStockLabel(status),
        };
      });

      return res.status(200).json({ items: enrichedItems });
    } catch (error) {
      return handleError(error, res);
    }
  }

  // POST - Create pantry item
  if (req.method === "POST") {
    try {
      const body = validateBody(req.body, createPantryItemSchema, res);
      if (!body) return;

      const category = body.category ?? "other";
      const expiryDate = body.expiryDate
        ? new Date(body.expiryDate)
        : getExpiryDefault(body.name, category);

      const [newItem] = await db
        .insert(pantryItems)
        .values({
          userId: user.id,
          name: body.name,
          quantity: body.quantity,
          unit: body.unit,
          category,
          expiryDate,
          notes: body.notes,
        })
        .returning();

      logPantryEvent(user.id, body.name, "added", body.quantity ?? null, body.unit ?? null, "manual");

      return res.status(201).json({ item: newItem });
    } catch (error) {
      return handleError(error, res);
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
