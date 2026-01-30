// api/households/leave.ts
// POST /api/households/leave — Leave current household (or remove a member if owner)

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { handleError } from "../../lib/errors";
import { db, households, householdMembers } from "../../db";
import { eq, and } from "drizzle-orm";
import { getUserHousehold } from "../../lib/household";

const leaveSchema = z.object({
  userId: z.string().uuid().optional(), // If owner, can remove another member
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

    const body = validateBody(req.body, leaveSchema, res);
    if (!body) return;

    const household = await getUserHousehold(user.id);
    if (!household) {
      return res.status(404).json({ error: "You are not in a household" });
    }

    const targetUserId = body.userId ?? user.id;

    // If removing someone else, must be owner
    if (targetUserId !== user.id && household.userRole !== "owner") {
      return res.status(403).json({
        error: "Only the household owner can remove members",
      });
    }

    // Owner can't leave — they must delete the household
    if (targetUserId === user.id && household.userRole === "owner") {
      // Delete the entire household
      await db.delete(householdMembers).where(
        eq(householdMembers.householdId, household.id),
      );
      await db.delete(households).where(eq(households.id, household.id));

      return res.status(200).json({
        action: "household_deleted",
        message: "Household deleted",
      });
    }

    // Remove the target member
    await db.delete(householdMembers).where(
      and(
        eq(householdMembers.householdId, household.id),
        eq(householdMembers.userId, targetUserId),
      ),
    );

    return res.status(200).json({
      action: "member_removed",
      userId: targetUserId,
    });
  } catch (error) {
    return handleError(error, res);
  }
}
