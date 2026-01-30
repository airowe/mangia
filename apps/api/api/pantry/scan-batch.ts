// api/pantry/scan-batch.ts
// POST /api/pantry/scan-batch — Scan multiple photos and deduplicate items

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { scanPantryImage } from "../../lib/pantry-scanner";
import { deduplicateItems } from "../../lib/item-deduplicator";

const scanBatchSchema = z.object({
  images: z
    .array(
      z.object({
        imageBase64: z.string().max(5_500_000, "Image too large"),
        label: z.string().max(100).default("photo"),
      }),
    )
    .min(1)
    .max(5),
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
        error: "Batch scanning is a premium feature",
        code: "PREMIUM_REQUIRED",
      });
    }

    const body = validateBody(req.body, scanBatchSchema, res);
    if (!body) return;

    // Scan all images in parallel
    const scanPromises = body.images.map(async (img) => {
      try {
        const items = await scanPantryImage(img.imageBase64, false);
        return {
          label: img.label,
          itemCount: items.length,
          status: "success" as const,
          items: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
            confidence: item.confidence,
            expiryDate: item.expiryDate,
          })),
        };
      } catch (err) {
        return {
          label: img.label,
          itemCount: 0,
          status: "error" as const,
          items: [],
          error: err instanceof Error ? err.message : String(err),
        };
      }
    });

    const photoResults = await Promise.all(scanPromises);

    // Deduplicate across all photos
    const itemsBySource = photoResults
      .filter((r) => r.status === "success")
      .map((r) => ({ label: r.label, items: r.items }));

    const dedupResult = deduplicateItems(itemsBySource);

    return res.status(200).json({
      photoResults: photoResults.map(({ items, ...meta }) => meta),
      items: dedupResult.items,
      totalBeforeDedup: dedupResult.totalBeforeDedup,
      totalAfterDedup: dedupResult.totalAfterDedup,
      duplicatesRemoved: dedupResult.duplicatesRemoved,
    });
  } catch (error) {
    return handleError(error, res);
  }
}
