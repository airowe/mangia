// api/pantry/barcode-lookup.ts
// POST /api/pantry/barcode-lookup — Look up product by barcode

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { lookupBarcode } from "../../lib/barcode-lookup";

const barcodeLookupSchema = z.object({
  barcode: z.string().min(8).max(20).regex(/^\d+$/, "Barcode must be numeric"),
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

    const body = validateBody(req.body, barcodeLookupSchema, res);
    if (!body) return;

    const product = await lookupBarcode(body.barcode);

    if (!product) {
      return res.status(200).json({
        found: false,
        barcode: body.barcode,
      });
    }

    return res.status(200).json({
      found: true,
      product,
    });
  } catch (error) {
    return handleError(error, res);
  }
}
