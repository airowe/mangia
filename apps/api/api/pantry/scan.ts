// api/pantry/scan.ts
// POST /api/pantry/scan — AI vision scan of pantry/fridge photo

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError, ApiError } from "../../lib/errors";
import { scanPantryImage } from "../../lib/pantry-scanner";

const scanSchema = z.object({
  imageBase64: z
    .string()
    .max(5_500_000, "Image too large. Maximum size is approximately 4MB."),
  extractExpiry: z.boolean().default(true),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateRequest(
      req.headers.authorization as string,
    );

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Premium-only feature
    if (!user.isPremium) {
      return res.status(403).json({
        error: "AI Pantry Scanner is a premium feature",
        code: "PREMIUM_REQUIRED",
      });
    }

    const body = validateBody(req.body, scanSchema, res);
    if (!body) return;

    const items = await scanPantryImage(body.imageBase64, body.extractExpiry);

    return res.status(200).json({ items });
  } catch (error) {
    return handleError(error, res);
  }
}
