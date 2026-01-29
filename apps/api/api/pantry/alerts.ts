// api/pantry/alerts.ts
// GET /api/pantry/alerts — pantry items grouped by expiry status

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { handleError } from "../../lib/errors";
import { db, pantryItems } from "../../db";
import { eq, and, lte, sql, type SQL } from "drizzle-orm";
import {
  computeDaysUntilExpiry,
  formatExpiryText,
  getAlertWindowDate,
} from "../../lib/expiry-helpers";

const VALID_CATEGORIES = [
  "produce", "meat_seafood", "dairy_eggs", "bakery",
  "frozen", "canned", "pantry", "other",
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateRequest(
      req.headers.authorization as string,
    );

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { window: windowParam, category } = req.query;

    // Parse and validate window (default 7 days)
    let windowDays = 7;
    if (windowParam && typeof windowParam === "string") {
      const parsed = parseInt(windowParam, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 365) {
        windowDays = parsed;
      }
    }

    // Build query conditions
    const conditions: SQL[] = [
      eq(pantryItems.userId, user.id),
      sql`${pantryItems.expiryDate} IS NOT NULL`,
      lte(pantryItems.expiryDate, getAlertWindowDate(windowDays)),
    ];

    // Optional category filter
    if (category && typeof category === "string" && VALID_CATEGORIES.includes(category)) {
      conditions.push(eq(pantryItems.category, category as any));
    }

    // Single query, split in code
    const items = await db.query.pantryItems.findMany({
      where: and(...conditions),
      orderBy: (pantryItems, { asc }) => [asc(pantryItems.expiryDate)],
    });

    // expiryDate is guaranteed non-null by the IS NOT NULL SQL condition above
    const enriched = items.map((item) => {
      const daysUntil = computeDaysUntilExpiry(item.expiryDate!);
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        expiryDate: item.expiryDate!.toISOString(),
        expiryText: formatExpiryText(daysUntil),
        daysUntilExpiry: daysUntil,
      };
    });

    const expired: typeof enriched = [];
    const expiring: typeof enriched = [];
    for (const item of enriched) {
      if (item.daysUntilExpiry < 0) {
        expired.push(item);
      } else {
        expiring.push(item);
      }
    }

    // Sort expired: most recently expired first (closest to today)
    expired.sort((a, b) => b.daysUntilExpiry - a.daysUntilExpiry);
    // expiring is already sorted by expiryDate ASC (soonest first)

    return res.status(200).json({
      expired,
      expiring,
      counts: {
        expired: expired.length,
        expiring: expiring.length,
        total: expired.length + expiring.length,
      },
    });
  } catch (error) {
    return handleError(error, res);
  }
}
