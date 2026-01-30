// api/pantry/receipt-scan.ts
// POST /api/pantry/receipt-scan — Extract food items from a grocery receipt photo

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { scanReceipt } from "../../lib/receipt-scanner";

const receiptScanSchema = z.object({
  imageBase64: z
    .string()
    .max(5_500_000, "Image too large. Maximum size is approximately 4MB."),
  storeName: z.string().max(200).optional(),
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
        error: "Receipt scanning is a premium feature",
        code: "PREMIUM_REQUIRED",
      });
    }

    const body = validateBody(req.body, receiptScanSchema, res);
    if (!body) return;

    const result = await scanReceipt(body.imageBase64, body.storeName);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}
