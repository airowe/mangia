// api/pantry/email-receipts.ts
// POST /api/pantry/email-receipts — Scan Gmail for grocery receipts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { findAndParseReceipts } from "../../lib/email-receipt";

const emailReceiptScanSchema = z.object({
  provider: z.enum(["gmail"]),
  accessToken: z.string().min(1),
  lookbackDays: z.number().int().min(1).max(30).default(7),
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
        error: "Email receipt parsing is a premium feature",
        code: "PREMIUM_REQUIRED",
      });
    }

    const body = validateBody(req.body, emailReceiptScanSchema, res);
    if (!body) return;

    const result = await findAndParseReceipts(body.accessToken, body.lookbackDays);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}
