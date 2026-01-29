// lib/rate-limit.ts
// Free tier import limit enforcement

import { db, users } from "../db";
import { eq, sql } from "drizzle-orm";
import { FREE_TIER_LIMITS } from "@mangia/shared";

interface ImportLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt?: Date;
}

/**
 * Checks whether a user can import a new recipe.
 * Automatically resets the monthly counter when a new month begins.
 */
export async function checkImportLimit(
  userId: string,
  isPremium: boolean | null
): Promise<ImportLimitResult> {
  const limit = FREE_TIER_LIMITS.RECIPES_PER_MONTH;

  if (isPremium) {
    return { allowed: true, remaining: Infinity, limit };
  }

  const [user] = await db
    .select({
      monthlyImportCount: users.monthlyImportCount,
      monthlyImportResetAt: users.monthlyImportResetAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return { allowed: false, remaining: 0, limit };
  }

  const now = new Date();
  const resetAt = user.monthlyImportResetAt
    ? new Date(user.monthlyImportResetAt)
    : null;

  // Reset counter if we're in a new month
  if (
    !resetAt ||
    now.getMonth() !== resetAt.getMonth() ||
    now.getFullYear() !== resetAt.getFullYear()
  ) {
    await db
      .update(users)
      .set({
        monthlyImportCount: 0,
        monthlyImportResetAt: now,
      })
      .where(eq(users.id, userId));

    return { allowed: true, remaining: limit, limit };
  }

  const count = user.monthlyImportCount ?? 0;
  if (count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt: resetAt,
    };
  }

  return { allowed: true, remaining: limit - count, limit };
}

/**
 * Increments the monthly import counter for a user.
 */
export async function incrementImportCount(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      monthlyImportCount: sql`COALESCE(${users.monthlyImportCount}, 0) + 1`,
    })
    .where(eq(users.id, userId));
}
