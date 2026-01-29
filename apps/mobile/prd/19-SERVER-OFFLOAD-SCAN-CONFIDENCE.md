# Server Offload: Scanned Item Confidence Threshold (API-016)

## Overview

Move the confidence threshold logic from `ConfirmScannedItemsScreen.tsx` to the `POST /api/pantry/scan` server response. Currently the client applies `confidence >= 0.7` to determine if a scanned item is auto-confirmed or needs review. The server should return a `requiresReview` boolean on each item.

---

## Problem

| Issue | Impact |
|-------|--------|
| Confidence threshold (0.7) hardcoded in client | Can't A/B test or adjust per user tier without app update |
| Business rule split between server (scanning) and client (classification) | Inconsistent ownership |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Where to set threshold? | **Server-side constant** | Single source of truth, adjustable without app update |
| Premium users get different threshold? | **Not now** | Keep simple; flag for future |

---

## Server Implementation

### Modified File: `apps/api/lib/pantry-scanner.ts`

Add `requiresReview` to the `ScannedPantryItem` return type:

```typescript
const CONFIDENCE_THRESHOLD = 0.7;

return parsed.items.map((item) => ({
  name: item.name,
  category: categorizeIngredient(item.name),
  confidence: 0.85,
  quantity: item.quantity || 1,
  unit: item.unit || "piece",
  expiryDate: extractExpiry ? (item.expiryDate ?? null) : null,
  requiresReview: 0.85 < CONFIDENCE_THRESHOLD, // false for default confidence
}));
```

### Client Changes

**`apps/mobile/screens/ConfirmScannedItemsScreen.tsx`:**
- Remove `confidence >= 0.7` checks (lines 64-65)
- Use `item.requiresReview` from the API response
- `status: item.requiresReview ? "review" : "confirmed"`
- `isSelected: !item.requiresReview`

---

## Acceptance Criteria

- [ ] `POST /api/pantry/scan` returns `requiresReview` on each item
- [ ] Items with confidence >= 0.7 have `requiresReview: false`
- [ ] Items with confidence < 0.7 have `requiresReview: true`
- [ ] `ConfirmScannedItemsScreen` uses `requiresReview` instead of local threshold
- [ ] `pnpm typecheck` passes in all packages
