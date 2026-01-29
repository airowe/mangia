# PRD: API-004 - Free Tier Enforcement

## Overview
Implement free tier limits using the existing `monthlyImportCount` and `monthlyImportResetAt` columns in the users table, and the `FREE_TIER_LIMITS` constants from `@mangia/shared`.

## Problem Statement
The database schema has `monthlyImportCount` and `monthlyImportResetAt` columns, and `@mangia/shared` exports `FREE_TIER_LIMITS`, but none of this is wired up. Free users can import unlimited recipes.

## Success Criteria
- [ ] Recipe creation (POST /recipes) checks and enforces monthly import limits for non-premium users
- [ ] Monthly counter resets automatically when a new month begins
- [ ] Counter increments on successful recipe creation
- [ ] Premium users bypass all limits
- [ ] Rate limit response returns clear error with remaining count and reset date
- [ ] Shared `FREE_TIER_LIMITS` constants are used (not hardcoded values)
- [ ] `pnpm typecheck` passes

## Technical Approach

### Step 1: Create rate limit helper
Create `apps/api/lib/rate-limit.ts`:
```typescript
import { db, users } from "../db";
import { eq } from "drizzle-orm";
import { FREE_TIER_LIMITS } from "@mangia/shared";

export async function checkImportLimit(userId: string, isPremium: boolean) {
  if (isPremium) return { allowed: true };

  const [user] = await db.select({
    monthlyImportCount: users.monthlyImportCount,
    monthlyImportResetAt: users.monthlyImportResetAt,
  }).from(users).where(eq(users.id, userId));

  const now = new Date();
  const resetAt = user.monthlyImportResetAt ? new Date(user.monthlyImportResetAt) : null;

  // Reset counter if we're in a new month
  if (!resetAt || now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
    await db.update(users).set({
      monthlyImportCount: 0,
      monthlyImportResetAt: now,
    }).where(eq(users.id, userId));
    return { allowed: true, remaining: FREE_TIER_LIMITS.recipesPerMonth };
  }

  const count = user.monthlyImportCount ?? 0;
  if (count >= FREE_TIER_LIMITS.recipesPerMonth) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: resetAt,
      limit: FREE_TIER_LIMITS.recipesPerMonth,
    };
  }

  return { allowed: true, remaining: FREE_TIER_LIMITS.recipesPerMonth - count };
}

export async function incrementImportCount(userId: string) {
  await db.update(users).set({
    monthlyImportCount: sql`${users.monthlyImportCount} + 1`,
  }).where(eq(users.id, userId));
}
```

### Step 2: Wire into POST /recipes
In `api/recipes/index.ts`, before creating the recipe:
1. Call `checkImportLimit(user.id, user.isPremium)`
2. If not allowed, return 429 with error message and limit info
3. After successful creation, call `incrementImportCount(user.id)`

### Step 3: Verify FREE_TIER_LIMITS exists in shared
Check that `@mangia/shared` exports `FREE_TIER_LIMITS` with a `recipesPerMonth` property. If the property name differs, align with whatever exists.

### Step 4: Verify
- `pnpm typecheck` passes

## Out of Scope
- Collection count limits
- Pantry item count limits
- Premium upgrade prompts/flows
- Usage analytics dashboard

## Promise Statement
STOP WHEN: POST /recipes enforces monthly import limits for free users using FREE_TIER_LIMITS from @mangia/shared, the counter auto-resets monthly, premium users bypass limits, and `pnpm typecheck` passes with zero errors.
