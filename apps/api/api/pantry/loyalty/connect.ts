// api/pantry/loyalty/connect.ts
// POST /api/pantry/loyalty/connect — Store loyalty account connection

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../../lib/auth";
import { validateBody } from "../../../lib/validation";
import { handleError } from "../../../lib/errors";
import { getProvider } from "../../../lib/loyalty";
import { db, loyaltyConnections } from "../../../db";
import { eq, and } from "drizzle-orm";

const connectSchema = z.object({
  provider: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
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

    const body = validateBody(req.body, connectSchema, res);
    if (!body) return;

    const provider = getProvider(body.provider);
    if (!provider || provider.status !== "active") {
      return res.status(400).json({
        error: `Provider "${body.provider}" is not available`,
      });
    }

    // Upsert connection
    const existing = await db.query.loyaltyConnections.findFirst({
      where: and(
        eq(loyaltyConnections.userId, user.id),
        eq(loyaltyConnections.provider, body.provider),
      ),
    });

    if (existing) {
      await db
        .update(loyaltyConnections)
        .set({
          accessToken: body.accessToken,
          refreshToken: body.refreshToken ?? existing.refreshToken,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : existing.expiresAt,
        })
        .where(eq(loyaltyConnections.id, existing.id));
    } else {
      await db.insert(loyaltyConnections).values({
        userId: user.id,
        provider: body.provider,
        accessToken: body.accessToken,
        refreshToken: body.refreshToken ?? null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      });
    }

    return res.status(200).json({ connected: true, provider: body.provider });
  } catch (error) {
    return handleError(error, res);
  }
}
