# PRD: API-006 - API Error Handling & Hardening

## Overview
Standardize error handling across all API endpoints with consistent error response format, proper error types, and defensive checks.

## Problem Statement
Current error handling issues:
- Error responses leak raw error messages (`error.message`) which may contain DB details
- Inconsistent error response shapes across endpoints
- No centralized error handling pattern
- `catch (error: any)` pattern loses type safety
- Missing `name` validation on required fields (e.g., POST /collections doesn't check if `name` is provided before DB insert — though Zod from API-002 should handle this)
- Meal plan POST uses `??` (nullish coalescing) where it should use update-or-create logic more defensively

## Success Criteria
- [x] Consistent error response format: `{ error: string, code?: string, details?: object }`
- [x] Production errors don't leak internal details (DB errors, stack traces)
- [x] Centralized error handler utility
- [x] All endpoints use the centralized error handler in catch blocks
- [x] User ownership checks use a shared helper function
- [x] `pnpm typecheck` passes

## Technical Approach

### Step 1: Create error handling utility
Create `apps/api/lib/errors.ts`:
```typescript
import type { VercelResponse } from "@vercel/node";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

export function handleError(error: unknown, res: VercelResponse) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  console.error("Unhandled error:", error);
  return res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
```

### Step 2: Create ownership check helper
Create or add to `apps/api/lib/auth.ts`:
```typescript
export function requireOwnership(resourceUserId: string, requestUserId: string) {
  if (resourceUserId !== requestUserId) {
    throw new ApiError(404, "Not found"); // 404 not 403 to avoid leaking resource existence
  }
}
```

### Step 3: Update all endpoint catch blocks
Replace:
```typescript
catch (error: any) {
  console.error("Error:", error);
  return res.status(500).json({ error: error.message });
}
```
With:
```typescript
catch (error) {
  return handleError(error, res);
}
```

### Step 4: Update ownership checks
Replace inline ownership checks with `requireOwnership()` calls.

### Step 5: Verify
- `pnpm typecheck` passes
- Error responses are consistent

## Out of Scope
- Request logging middleware
- Rate limiting (beyond free tier from API-004)
- CORS configuration (Vercel handles this)
- Request ID tracking
- Error monitoring (Sentry, etc.)

## Promise Statement
STOP WHEN: All endpoints use centralized error handling via handleError(), ownership checks use a shared helper, error responses follow a consistent format without leaking internals, and `pnpm typecheck` passes with zero errors.
