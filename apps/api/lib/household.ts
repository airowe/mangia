// lib/household.ts
// Household management utilities

import { db, households, householdMembers } from "../db";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";

/**
 * Generate a human-readable invite code.
 * Format: MANGIA-XXXXXX (6 uppercase alphanumeric chars)
 */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 to avoid confusion
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `MANGIA-${code}`;
}

/**
 * Get the household a user belongs to (if any).
 */
export async function getUserHousehold(userId: string) {
  const membership = await db.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, userId),
    with: { household: true },
  });

  if (!membership) return null;

  const members = await db.query.householdMembers.findMany({
    where: eq(householdMembers.householdId, membership.householdId),
  });

  return {
    ...membership.household,
    members,
    userRole: membership.role,
  };
}

/**
 * Get all member user IDs for a household.
 */
export async function getHouseholdMemberIds(householdId: string): Promise<string[]> {
  const members = await db.query.householdMembers.findMany({
    where: eq(householdMembers.householdId, householdId),
  });
  return members.map((m) => m.userId);
}

const MAX_HOUSEHOLD_MEMBERS = 6;

/**
 * Check if a household has room for another member.
 */
export async function canJoinHousehold(householdId: string): Promise<boolean> {
  const members = await db.query.householdMembers.findMany({
    where: eq(householdMembers.householdId, householdId),
  });
  return members.length < MAX_HOUSEHOLD_MEMBERS;
}
