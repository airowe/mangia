// api/pantry/loyalty/providers.ts
// GET /api/pantry/loyalty/providers — List available loyalty providers

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../../lib/auth";
import { handleError } from "../../../lib/errors";
import { LOYALTY_PROVIDERS } from "../../../lib/loyalty";
import { db, loyaltyConnections } from "../../../db";
import { eq, and } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateRequest(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user's connected accounts
    const connections = await db.query.loyaltyConnections.findMany({
      where: eq(loyaltyConnections.userId, user.id),
    });

    const connectionMap = new Map(
      connections.map((c) => [c.provider, c]),
    );

    const providers = LOYALTY_PROVIDERS.map((provider) => {
      const conn = connectionMap.get(provider.id);
      return {
        ...provider,
        connected: !!conn,
        lastSync: conn?.lastSyncAt?.toISOString() ?? null,
      };
    });

    return res.status(200).json({ providers });
  } catch (error) {
    return handleError(error, res);
  }
}
