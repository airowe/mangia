// api/pantry/loyalty/sync.ts
// POST /api/pantry/loyalty/sync — Pull purchases from connected loyalty account

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../../lib/auth";
import { validateBody } from "../../../lib/validation";
import { handleError } from "../../../lib/errors";
import { syncLoyaltyPurchases } from "../../../lib/loyalty";
import { db, loyaltyConnections } from "../../../db";
import { eq, and } from "drizzle-orm";

const syncSchema = z.object({
  provider: z.string().min(1),
  lookbackDays: z.number().int().min(1).max(30).default(14),
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

    if (!user.isPremium) {
      return res.status(403).json({
        error: "Loyalty sync is a premium feature",
        code: "PREMIUM_REQUIRED",
      });
    }

    const body = validateBody(req.body, syncSchema, res);
    if (!body) return;

    // Get stored connection
    const connection = await db.query.loyaltyConnections.findFirst({
      where: and(
        eq(loyaltyConnections.userId, user.id),
        eq(loyaltyConnections.provider, body.provider),
      ),
    });

    if (!connection) {
      return res.status(404).json({
        error: `No connected ${body.provider} account found`,
        code: "NOT_CONNECTED",
      });
    }

    const result = await syncLoyaltyPurchases(
      body.provider,
      connection.accessToken,
      body.lookbackDays,
    );

    // Update last sync timestamp
    await db
      .update(loyaltyConnections)
      .set({ lastSyncAt: new Date() })
      .where(eq(loyaltyConnections.id, connection.id));

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}
