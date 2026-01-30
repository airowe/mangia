// api/pantry/predictions.ts
// GET /api/pantry/predictions — Predict which items need reordering

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { handleError } from "../../lib/errors";
import { predictReorderDates } from "../../lib/consumption-predictor";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateRequest(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!user.isPremium) {
      return res.status(403).json({
        error: "Predictive reordering is a premium feature",
        code: "PREMIUM_REQUIRED",
      });
    }

    const predictions = await predictReorderDates(user.id);

    return res.status(200).json({ predictions });
  } catch (error) {
    return handleError(error, res);
  }
}
