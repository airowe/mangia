# Server Offload: Pantry Stock Status (API-013)

## Overview

Move the pantry stock status calculation from `PantryScreen.tsx` client-side functions to the `GET /api/pantry` server response. Currently the client hardcodes quantity thresholds (critical <=1, low <=3, medium <=5, full >5) to compute stock status badges. The server should return a computed `stockStatus` field on each pantry item.

---

## Problem

| Issue | Impact |
|-------|--------|
| Stock thresholds hardcoded in client (`getStockStatus`) | Can't adjust per item type without app update |
| Status computed on every render | Redundant computation |
| No server knowledge of stock levels | Can't trigger push notifications for low-stock items |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| New endpoint or extend existing? | **Extend `GET /api/pantry`** | Same data, just add computed fields |
| Thresholds per item type? | **Global for now** | Keep simple; future enhancement can use category-specific thresholds |

---

## Server Implementation

### Modified File: `apps/api/api/pantry/index.ts`

Add computed fields to each item in the GET response:

```typescript
type StockStatus = "critical" | "low" | "medium" | "full";

function getStockStatus(quantity: number | null): StockStatus {
  const qty = quantity ?? 0;
  if (qty <= 1) return "critical";
  if (qty <= 3) return "low";
  if (qty <= 5) return "medium";
  return "full";
}

function getStockLabel(status: StockStatus): string {
  const labels: Record<StockStatus, string> = {
    critical: "Running Low",
    low: "Low Stock",
    medium: "Medium",
    full: "In Stock",
  };
  return labels[status];
}
```

Map over query results to add `stockStatus` and `stockLabel` before returning.

### Client Changes

**`apps/mobile/screens/PantryScreen.tsx`:**
- Remove `getStockStatus()`, `getStockLabel()`, `getStockColor()` local functions
- Use `item.stockStatus` and `item.stockLabel` from API response
- Keep `getStockColor()` as a UI-only mapping (color is a presentation concern)

---

## Acceptance Criteria

- [ ] `GET /api/pantry` returns `stockStatus` and `stockLabel` on each item
- [ ] Thresholds match current client logic (critical <=1, low <=3, medium <=5, full >5)
- [ ] `PantryScreen` uses server-provided status instead of local computation
- [ ] `pnpm typecheck` passes in all packages
