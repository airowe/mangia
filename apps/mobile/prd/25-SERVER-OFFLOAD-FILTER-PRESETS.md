# Server Offload: Recipe Filter Presets (API-022)

## Overview

Move the hardcoded recipe filter thresholds from `RecipesScreen.tsx` to a server endpoint. Currently the client maps filter pill IDs to query params using hardcoded thresholds: `"favorites"` → `minRating: 4`, `"quick"` → `maxTotalTime: 30`. The server should define these presets so thresholds can be tuned without an app update.

---

## Problem

| Issue | Impact |
|-------|--------|
| "Quick & Easy" threshold (30 min) hardcoded in client | Can't adjust without app update |
| "Favorites" threshold (rating >= 4) hardcoded in client | Can't A/B test different thresholds |
| Filter pill labels and IDs coupled to client code | Can't add new presets dynamically |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| New endpoint or query param? | **New `GET /api/recipes/filter-presets`** | Presets are configuration, not data |
| Include all pills or just parameterized ones? | **All pills** | Client renders what server sends; enables dynamic pill ordering |

---

## Server Implementation

### New File: `apps/api/api/recipes/filter-presets.ts`

`GET /api/recipes/filter-presets`:
1. Authenticate user (optional — presets are public config, but auth keeps pattern consistent)
2. Return ordered array of filter presets

```typescript
const FILTER_PRESETS = [
  { id: "all", label: "All", params: {} },
  { id: "favorites", label: "Favorites", params: { minRating: 4 } },
  { id: "quick", label: "Quick & Easy", params: { maxTotalTime: 30 } },
  { id: "dinner", label: "Dinner Party", params: { mealType: "dinner" } },
  { id: "dessert", label: "Dessert", params: { mealType: "dessert" } },
];

return res.status(200).json({ presets: FILTER_PRESETS });
```

### Client Changes

**`apps/mobile/screens/RecipesScreen.tsx`:**
- Remove `FILTERS` constant and `FilterType` type
- Remove `buildFilterParams()` switch statement
- Fetch presets from `GET /api/recipes/filter-presets` on mount
- Store presets in state; render pills from server data
- When pill tapped, merge `preset.params` with base params (`status`, `sort`, `search`)

---

## Acceptance Criteria

- [ ] `GET /api/recipes/filter-presets` returns ordered preset array with `{ id, label, params }`
- [ ] `RecipesScreen` renders filter pills from server data
- [ ] Hardcoded `FILTERS`, `FilterType`, and `buildFilterParams` switch removed
- [ ] Filter pill tap merges server-provided params with base query
- [ ] `pnpm typecheck` passes in all packages
