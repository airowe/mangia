// routes/households.ts
// /api/households/*

import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { parseJson } from "../middleware/validate";
import { db, households, householdMembers } from "../db";
import { eq, and } from "drizzle-orm";
import { generateInviteCode, getUserHousehold, canJoinHousehold } from "../lib/household";

const createHouseholdSchema = z.object({
  name: z.string().min(1).max(200).default("My Household"),
});

const joinSchema = z.object({
  inviteCode: z.string().min(1).max(20),
});

const leaveSchema = z.object({
  userId: z.string().uuid().optional(),
});

export const householdsRoutes = new Hono<AuthEnv>();

householdsRoutes.use(authMiddleware);

// GET /api/households — Get current user's household
householdsRoutes.get("/", async (c) => {
  const user = c.get("user");
  const household = await getUserHousehold(user.id);

  if (!household) {
    return c.json({ household: null });
  }

  return c.json({ household });
});

// POST /api/households — Create household
householdsRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, createHouseholdSchema);

  if (!user.isPremium) {
    return c.json(
      { error: "Creating a household requires premium", code: "PREMIUM_REQUIRED" },
      403,
    );
  }

  const existing = await getUserHousehold(user.id);
  if (existing) {
    return c.json(
      { error: "You already belong to a household. Leave it first.", code: "ALREADY_IN_HOUSEHOLD" },
      409,
    );
  }

  const inviteCode = generateInviteCode();

  const [household] = await db
    .insert(households)
    .values({ name: body.name, ownerId: user.id, inviteCode })
    .returning();

  await db.insert(householdMembers).values({
    householdId: household.id,
    userId: user.id,
    role: "owner",
  });

  return c.json(
    {
      id: household.id,
      name: household.name,
      inviteCode: household.inviteCode,
      members: [{ userId: user.id, role: "owner" }],
    },
    201,
  );
});

// POST /api/households/join — Join a household via invite code
householdsRoutes.post("/join", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, joinSchema);

  const existing = await getUserHousehold(user.id);
  if (existing) {
    return c.json(
      { error: "You already belong to a household. Leave it first.", code: "ALREADY_IN_HOUSEHOLD" },
      409,
    );
  }

  const household = await db.query.households.findFirst({
    where: eq(households.inviteCode, body.inviteCode),
  });

  if (!household) {
    return c.json({ error: "Invalid invite code", code: "INVALID_CODE" }, 404);
  }

  const hasRoom = await canJoinHousehold(household.id);
  if (!hasRoom) {
    return c.json(
      { error: "This household is full (max 6 members)", code: "HOUSEHOLD_FULL" },
      409,
    );
  }

  await db.insert(householdMembers).values({
    householdId: household.id,
    userId: user.id,
    role: "member",
  });

  const members = await db.query.householdMembers.findMany({
    where: eq(householdMembers.householdId, household.id),
  });

  return c.json({
    household: {
      id: household.id,
      name: household.name,
      members: members.map((m) => ({ userId: m.userId, role: m.role })),
    },
  });
});

// POST /api/households/leave — Leave current household
householdsRoutes.post("/leave", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, leaveSchema);

  const household = await getUserHousehold(user.id);
  if (!household) {
    return c.json({ error: "You are not in a household" }, 404);
  }

  const targetUserId = body.userId ?? user.id;

  if (targetUserId !== user.id && household.userRole !== "owner") {
    return c.json(
      { error: "Only the household owner can remove members" },
      403,
    );
  }

  // Owner leaving = delete household
  if (targetUserId === user.id && household.userRole === "owner") {
    await db.delete(householdMembers).where(
      eq(householdMembers.householdId, household.id),
    );
    await db.delete(households).where(eq(households.id, household.id));

    return c.json({ action: "household_deleted", message: "Household deleted" });
  }

  await db.delete(householdMembers).where(
    and(
      eq(householdMembers.householdId, household.id),
      eq(householdMembers.userId, targetUserId),
    ),
  );

  return c.json({ action: "member_removed", userId: targetUserId });
});
