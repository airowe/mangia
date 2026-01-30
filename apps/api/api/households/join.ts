// api/households/join.ts
// POST /api/households/join — Join a household via invite code

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { db, households, householdMembers } from "../../db";
import { eq } from "drizzle-orm";
import { getUserHousehold, canJoinHousehold } from "../../lib/household";

const joinSchema = z.object({
  inviteCode: z.string().min(1).max(20),
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

    const body = validateBody(req.body, joinSchema, res);
    if (!body) return;

    // Check if user already in a household
    const existing = await getUserHousehold(user.id);
    if (existing) {
      return res.status(409).json({
        error: "You already belong to a household. Leave it first.",
        code: "ALREADY_IN_HOUSEHOLD",
      });
    }

    // Find household by invite code
    const household = await db.query.households.findFirst({
      where: eq(households.inviteCode, body.inviteCode),
    });

    if (!household) {
      return res.status(404).json({
        error: "Invalid invite code",
        code: "INVALID_CODE",
      });
    }

    // Check capacity
    const hasRoom = await canJoinHousehold(household.id);
    if (!hasRoom) {
      return res.status(409).json({
        error: "This household is full (max 6 members)",
        code: "HOUSEHOLD_FULL",
      });
    }

    // Add member
    await db.insert(householdMembers).values({
      householdId: household.id,
      userId: user.id,
      role: "member",
    });

    // Return updated household
    const members = await db.query.householdMembers.findMany({
      where: eq(householdMembers.householdId, household.id),
    });

    return res.status(200).json({
      household: {
        id: household.id,
        name: household.name,
        members: members.map((m) => ({ userId: m.userId, role: m.role })),
      },
    });
  } catch (error) {
    return handleError(error, res);
  }
}
