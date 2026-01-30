// api/pantry/stock-check.ts
// GET /api/pantry/stock-check?item=milk — Check stock level of a specific item

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { handleError } from "../../lib/errors";
import { db, pantryItems } from "../../db";
import { eq } from "drizzle-orm";
import { getStockStatus, getStockLabel } from "../../lib/stock-status";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateRequest(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const itemQuery = req.query.item;
    if (!itemQuery || typeof itemQuery !== "string") {
      return res.status(400).json({ error: "Query parameter 'item' is required" });
    }

    const searchTerm = itemQuery.toLowerCase().trim();

    // Fetch all pantry items and do case-insensitive search
    const allItems = await db.query.pantryItems.findMany({
      where: eq(pantryItems.userId, user.id),
    });

    const match = allItems.find(
      (i) => i.name.toLowerCase().includes(searchTerm),
    );

    if (!match) {
      return res.status(200).json({
        found: false,
        item: itemQuery,
      });
    }

    const status = getStockStatus(match.quantity);

    return res.status(200).json({
      found: true,
      item: match.name,
      quantity: match.quantity,
      unit: match.unit,
      status,
      statusLabel: getStockLabel(status),
      expiryDate: match.expiryDate?.toISOString().split("T")[0] ?? null,
    });
  } catch (error) {
    return handleError(error, res);
  }
}
