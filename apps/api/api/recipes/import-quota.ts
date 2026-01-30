// api/recipes/import-quota.ts
// GET /api/recipes/import-quota — return structured import quota for current user

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { handleError } from "../../lib/errors";
import { checkImportLimit } from "../../lib/rate-limit";

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

    const result = await checkImportLimit(user.id, user.isPremium);

    return res.status(200).json({
      used: result.limit - result.remaining,
      remaining: result.remaining,
      limit: result.limit,
      isLimitReached: !result.allowed,
      isPremium: !!user.isPremium,
    });
  } catch (error) {
    return handleError(error, res);
  }
}
