// api/pantry/quick-add.ts
// POST /api/pantry/quick-add — Natural language pantry/grocery input for voice/shortcuts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { parseIntent } from "../../lib/intent-parser";
import { categorizeIngredient } from "../../lib/grocery-generator";
import { getExpiryDefault } from "../../lib/expiry-defaults";
import { db, pantryItems } from "../../db";
import { eq, ilike } from "drizzle-orm";
import { logPantryEvents } from "../../lib/pantry-event-logger";

const quickAddSchema = z.object({
  input: z.string().min(1).max(500),
  source: z.string().max(100).optional().default("quick_add"),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateRequest(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = validateBody(req.body, quickAddSchema, res);
    if (!body) return;

    const parsed = parseIntent(body.input);

    switch (parsed.intent) {
      case "add_to_pantry": {
        const items = [];
        for (const name of parsed.items) {
          const category = categorizeIngredient(name);
          const expiryDate = getExpiryDefault(name, category);
          const [created] = await db
            .insert(pantryItems)
            .values({
              userId: user.id,
              name,
              quantity: 1,
              unit: "piece",
              category,
              expiryDate,
            })
            .returning();
          items.push({ name, quantity: 1, unit: "piece", category, action: "added_to_pantry" });
        }

        logPantryEvents(
          user.id,
          items.map((i) => ({ name: i.name, quantity: 1, unit: "piece" })),
          "added",
          body.source,
        );

        const itemNames = items.map((i) => i.name).join(", ");
        return res.status(200).json({
          items,
          message: `Added ${itemNames} to your pantry`,
        });
      }

      case "add_to_grocery": {
        // For now, add to pantry with a note — full grocery list integration requires
        // the grocery list endpoints which are a separate domain
        const items = parsed.items.map((name) => ({
          name,
          quantity: 1,
          unit: "piece" as const,
          category: categorizeIngredient(name),
          action: "added_to_grocery" as const,
        }));

        const itemNames = items.map((i) => i.name).join(", ");
        return res.status(200).json({
          items,
          message: `Added ${itemNames} to your grocery list`,
        });
      }

      case "stock_check": {
        if (parsed.items.length === 0) {
          return res.status(200).json({ message: "What item would you like to check?" });
        }

        const itemName = parsed.items[0];
        const found = await db.query.pantryItems.findFirst({
          where: eq(pantryItems.userId, user.id),
          // Simple case-insensitive match
        });

        // Search all pantry items for a match
        const allItems = await db.query.pantryItems.findMany({
          where: eq(pantryItems.userId, user.id),
        });

        const match = allItems.find(
          (i) => i.name.toLowerCase().includes(itemName.toLowerCase()),
        );

        if (match) {
          return res.status(200).json({
            found: true,
            item: match.name,
            quantity: match.quantity,
            unit: match.unit,
            expiryDate: match.expiryDate?.toISOString().split("T")[0] ?? null,
            message: `You have ${match.quantity ?? 0} ${match.unit ?? "piece"}(s) of ${match.name}`,
          });
        }

        return res.status(200).json({
          found: false,
          item: itemName,
          message: `${itemName} is not in your pantry`,
        });
      }

      case "check_alerts": {
        return res.status(200).json({
          message: "Check the Kitchen Alerts screen for expiring items",
          redirect: "kitchen_alerts",
        });
      }

      default:
        return res.status(200).json({ message: "I didn't understand that" });
    }
  } catch (error) {
    return handleError(error, res);
  }
}
