// api/pantry/scan-compare.ts
// POST /api/pantry/scan-compare — Compare vision models for pantry scanning

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { runComparison } from "../../lib/vision-compare";

const scanCompareSchema = z.object({
  imageBase64: z
    .string()
    .max(5_500_000, "Image too large. Maximum size is approximately 4MB."),
  models: z
    .array(
      z.enum(["gemini-2.0-flash", "gemini-2.5-flash", "gpt-4o"]),
    )
    .optional(),
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
        error: "Vision model comparison is a premium feature",
        code: "PREMIUM_REQUIRED",
      });
    }

    const body = validateBody(req.body, scanCompareSchema, res);
    if (!body) return;

    const result = await runComparison(body.imageBase64, {
      models: body.models,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}
