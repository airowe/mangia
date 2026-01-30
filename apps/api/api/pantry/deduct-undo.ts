// api/pantry/deduct-undo.ts
// POST /api/pantry/deduct-undo — Undo a pantry deduction

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { db, pantryItems } from "../../db";
import { eq } from "drizzle-orm";
import { getUndoEntry, removeUndoEntry } from "../../lib/deduct-undo-store";

const undoSchema = z.object({
  undoToken: z.string().uuid(),
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

    const body = validateBody(req.body, undoSchema, res);
    if (!body) return;

    const entry = await getUndoEntry(body.undoToken);

    if (!entry || entry.userId !== user.id) {
      return res.status(404).json({ error: "Undo token expired or not found" });
    }

    let restored = 0;
    for (const item of entry.snapshot) {
      const existing = await db.query.pantryItems.findFirst({
        where: eq(pantryItems.id, item.id),
      });

      if (existing) {
        await db
          .update(pantryItems)
          .set({ quantity: item.quantity, updatedAt: new Date() })
          .where(eq(pantryItems.id, item.id));
        restored++;
      }
      // Items deleted during deduction (qty=0) can't be fully restored without more data
    }

    await removeUndoEntry(body.undoToken);

    return res.status(200).json({ restored });
  } catch (error) {
    return handleError(error, res);
  }
}
