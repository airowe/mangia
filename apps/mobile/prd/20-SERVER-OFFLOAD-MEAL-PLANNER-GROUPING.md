# Server Offload: Meal Planner Week/Day Grouping (API-017)

## Overview

Move the week boundary calculation and day-meal grouping from `MealPlannerScreen.tsx` to the server. Currently the client computes Monday-as-week-start, calculates start/end of week, then filters meal plans by selected date and groups by meal type. The server should accept a date and return pre-grouped meal plans.

---

## Problem

| Issue | Impact |
|-------|--------|
| Client calculates week boundaries with manual date math | Locale-dependent, error-prone |
| Client filters `mealPlans` array by date and groups by meal type | Redundant processing on every date selection |
| "snack" meal type is excluded by hardcoded client filter | Business rule buried in UI code |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| New endpoint or extend existing? | **Extend `GET /api/meal-plans`** | Already accepts date range; add grouping |
| Return grouped by day or flat? | **Add `grouped` query param** | `?grouped=true` returns `{ [date]: { breakfast, lunch, dinner } }` |
| Include snacks? | **Yes, in a separate key** | Let client decide display |

---

## Server Implementation

### Modified File: `apps/api/api/meal-plans/index.ts`

When `grouped=true`:
1. Compute week boundaries from `date` param (Monday start)
2. Query meal plans for the week
3. Group by date, then by meal type within each date
4. Return structured response

**Response shape when `grouped=true`:**
```json
{
  "week": {
    "start": "2026-01-26",
    "end": "2026-02-01"
  },
  "days": {
    "2026-01-26": {
      "breakfast": { ... },
      "lunch": { ... },
      "dinner": { ... },
      "snacks": [{ ... }]
    }
  }
}
```

### Client Changes

**`apps/mobile/screens/MealPlannerScreen.tsx`:**
- Remove `startOfWeek`/`endOfWeek` date math (lines 90-95)
- Remove `getDayMeals()` function (lines 134-150)
- Call `GET /api/meal-plans?date=YYYY-MM-DD&grouped=true`
- Use pre-grouped response directly

---

## Acceptance Criteria

- [ ] `GET /api/meal-plans?date=2026-01-29&grouped=true` returns week-grouped meal plans
- [ ] Week starts on Monday
- [ ] Each day groups meals by type (breakfast, lunch, dinner, snacks)
- [ ] `MealPlannerScreen` no longer computes week boundaries client-side
- [ ] Non-grouped mode (`grouped` absent) still works as before
- [ ] `pnpm typecheck` passes in all packages
