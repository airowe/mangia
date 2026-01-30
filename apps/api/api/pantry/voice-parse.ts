// api/pantry/voice-parse.ts
// POST /api/pantry/voice-parse — Parse natural language into pantry items

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { parseVoiceInput } from "../../lib/voice-parser";

const voiceParseSchema = z.object({
  transcript: z.string().min(1).max(2000),
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
        error: "Voice input is a premium feature",
        code: "PREMIUM_REQUIRED",
      });
    }

    const body = validateBody(req.body, voiceParseSchema, res);
    if (!body) return;

    const items = await parseVoiceInput(body.transcript);

    return res.status(200).json({ items });
  } catch (error) {
    return handleError(error, res);
  }
}
