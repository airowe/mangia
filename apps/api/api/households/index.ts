// api/households/index.ts
// POST /api/households — Create a household
// GET /api/households — Get current user's household

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { db, households, householdMembers } from "../../db";
import { eq } from "drizzle-orm";
import { generateInviteCode, getUserHousehold } from "../../lib/household";

const createHouseholdSchema = z.object({
  name: z.string().min(1).max(200).default("My Household"),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await authenticateRequest(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // GET — current user's household
    if (req.method === "GET") {
      const household = await getUserHousehold(user.id);

      if (!household) {
        return res.status(200).json({ household: null });
      }

      return res.status(200).json({ household });
    }

    // POST — create household
    if (req.method === "POST") {
      if (!user.isPremium) {
        return res.status(403).json({
          error: "Creating a household requires premium",
          code: "PREMIUM_REQUIRED",
        });
      }

      // Check if user already belongs to a household
      const existing = await getUserHousehold(user.id);
      if (existing) {
        return res.status(409).json({
          error: "You already belong to a household. Leave it first.",
          code: "ALREADY_IN_HOUSEHOLD",
        });
      }

      const body = validateBody(req.body, createHouseholdSchema, res);
      if (!body) return;

      const inviteCode = generateInviteCode();

      const [household] = await db
        .insert(households)
        .values({
          name: body.name,
          ownerId: user.id,
          inviteCode,
        })
        .returning();

      // Add creator as owner member
      await db.insert(householdMembers).values({
        householdId: household.id,
        userId: user.id,
        role: "owner",
      });

      return res.status(201).json({
        id: household.id,
        name: household.name,
        inviteCode: household.inviteCode,
        members: [{ userId: user.id, role: "owner" }],
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return handleError(error, res);
  }
}
