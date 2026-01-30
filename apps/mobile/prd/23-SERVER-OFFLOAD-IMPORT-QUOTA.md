# Server Offload: Import Quota (API-020)

## Overview

Move the import limit calculation from `useRecipeLimit.ts` to a dedicated server endpoint. Currently the client hardcodes `FREE_MONTHLY_IMPORTS = 3`, computes `startOfMonth` with client-side date math, fetches a raw count from `/api/recipes/import-count`, and derives `remaining`, `isLimitReached`, and `canImport` locally. The server already has `checkImportLimit()` in `lib/rate-limit.ts` — expose it as `GET /api/recipes/import-quota`.

---

## Problem

| Issue | Impact |
|-------|--------|
| `FREE_MONTHLY_IMPORTS = 3` hardcoded in client | Can't adjust limits without app update |
| Client computes `startOfMonth` with local timezone | Month boundary may differ from server |
| `import-count` endpoint returns raw count; client derives remaining | Duplicates logic already in `rate-limit.ts` |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| New endpoint or extend existing? | **New `GET /api/recipes/import-quota`** | Dedicated quota endpoint is more semantic than raw count |
| Keep `import-count`? | **Yes** — don't break existing callers | Deprecate later |

---

## Server Implementation

### New File: `apps/api/api/recipes/import-quota.ts`

`GET /api/recipes/import-quota`:
1. Authenticate user
2. Call `checkImportLimit(user.id, user.isPremium)` from `lib/rate-limit.ts`
3. Return `{ used, remaining, limit, isLimitReached, isPremium }`

```typescript
const result = await checkImportLimit(user.id, user.isPremium);
return res.status(200).json({
  used: result.limit - result.remaining,
  remaining: result.remaining,
  limit: result.limit,
  isLimitReached: !result.allowed,
  isPremium: !!user.isPremium,
});
```

### Client Changes

**`apps/mobile/hooks/useRecipeLimit.ts`:**
- Remove `FREE_MONTHLY_IMPORTS` constant
- Remove `startOfMonth` date computation
- Call `GET /api/recipes/import-quota` instead of `GET /api/recipes/import-count`
- Use server-provided `remaining`, `limit`, `isLimitReached` directly

---

## Acceptance Criteria

- [ ] `GET /api/recipes/import-quota` returns `{ used, remaining, limit, isLimitReached, isPremium }`
- [ ] `useRecipeLimit` uses server-provided values instead of local computation
- [ ] `FREE_MONTHLY_IMPORTS` constant removed from client hook
- [ ] `startOfMonth` date computation removed from client
- [ ] `pnpm typecheck` passes in all packages
