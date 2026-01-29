# Server Offload: Product-Pantry De-duplication (API-014)

## Overview

Move the product-pantry de-duplication filter from `HomeScreen.tsx` client-side to a server endpoint. Currently the client fetches all products, then filters out products already in the user's pantry using `allProducts.filter(p => !pantryItems.some(i => i.id === p.id))`. The server should return only products not already in the pantry.

---

## Problem

| Issue | Impact |
|-------|--------|
| Client fetches ALL products then filters locally | Wastes bandwidth on large product catalogs |
| Requires two separate fetches (products + pantry) to merge | Double latency |
| O(n*m) filtering on device | Slow for large datasets |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| New endpoint or query param? | **New query param `excludePantry=true`** on existing products endpoint | Keeps existing endpoint, adds opt-in filtering |
| Match by ID or name? | **By name (normalized)** | Pantry items may not share IDs with products; fuzzy name matching is more useful |

---

## Server Implementation

### Modified File: Products endpoint (or `apps/api/api/pantry/index.ts` if no products endpoint exists)

Add `excludePantry=true` query parameter that:
1. Fetches user's pantry item names
2. Excludes products whose normalized name matches any pantry item
3. Returns filtered product list

If no products endpoint exists, add a helper that the HomeScreen can call to get "suggested items to add" based on common grocery items minus what's already in pantry.

### Client Changes

**`apps/mobile/screens/HomeScreen.tsx`:**
- Remove client-side `availableProducts` filter
- Pass `excludePantry=true` param when fetching products
- Use response directly

---

## Acceptance Criteria

- [ ] Server filters out products already in user's pantry
- [ ] `HomeScreen` no longer does client-side de-duplication
- [ ] Matching uses normalized names (case-insensitive)
- [ ] `pnpm typecheck` passes in all packages
