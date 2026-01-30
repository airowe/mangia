# Pantry: Predictive Reordering (PANTRY-010)

## Overview

Track consumption patterns over time and predict when staple items will run out. Proactively suggest items to add to the grocery list before the user realizes they need them. "You usually buy milk every 9 days. You're due in 2 days."

---

## Problem

| Issue | Impact |
|-------|--------|
| Users realize they're out of staples only when they need them | Frustrating mid-recipe discovery, extra store trips |
| No intelligence about consumption patterns | App is reactive, not proactive |
| Grocery list is manual — user must remember what they need | Forgotten items are the #1 grocery frustration |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Data source? | **Pantry add/deduct history** | Every add (purchase) and deduct (cooking) builds pattern |
| Minimum data? | **3 purchase cycles** before prediction | Need enough data points for meaningful averages |
| Algorithm? | **Weighted moving average** of purchase intervals | Simple, explainable, no ML infrastructure needed |
| Notification? | **In-app card** on Home screen + optional push notification | Non-intrusive; user controls push |
| Auto-add to grocery? | **Suggest only** — user confirms | Don't auto-add items users might not want |
| Premium? | **Yes** — AI/intelligence feature | High value, premium differentiator |

---

## Server Implementation

### New Database Table: `pantry_events`

Track every pantry add and deduct event for pattern analysis.

```sql
CREATE TABLE pantry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'added' | 'deducted' | 'removed'
  quantity REAL,
  unit TEXT,
  source TEXT, -- 'grocery_transfer' | 'barcode' | 'receipt' | 'voice' | 'scan' | 'manual' | 'cooking_deduction'
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_pantry_events_user ON pantry_events(user_id, item_name, created_at);
```

### New Endpoint: `GET /api/pantry/predictions`

```typescript
// Response
{
  "predictions": [
    {
      "itemName": "Whole Milk",
      "averageCycleDays": 9,
      "lastPurchased": "2026-01-20",
      "predictedRunOut": "2026-01-29",
      "daysUntilRunOut": 0,
      "urgency": "now",       // "now" | "soon" (≤3 days) | "upcoming" (≤7 days)
      "confidence": 0.85,
      "purchaseCount": 7
    },
    {
      "itemName": "Eggs",
      "averageCycleDays": 12,
      "lastPurchased": "2026-01-22",
      "predictedRunOut": "2026-02-03",
      "daysUntilRunOut": 5,
      "urgency": "soon",
      "confidence": 0.72,
      "purchaseCount": 4
    }
  ]
}
```

**Logic:**
1. Authenticate user + premium check
2. Query `pantry_events` for items with ≥3 "added" events
3. For each item, calculate weighted moving average of intervals between adds
4. More recent intervals weighted higher (exponential decay)
5. Predict next run-out: `lastPurchased + averageCycleDays`
6. Classify urgency: now (overdue), soon (≤3d), upcoming (≤7d)
7. Return sorted by urgency

### New File: `apps/api/lib/consumption-predictor.ts`

- `predictReorderDates(userId)` — queries events, computes predictions
- `calculateWeightedAverage(intervals)` — exponential decay weighting
- Filters out items with too few data points or high variance (unpredictable)

### Modified Endpoints

All pantry add/deduct endpoints should log to `pantry_events`:
- `POST /api/pantry` — log "added" event
- `POST /api/pantry/bulk-add` — log "added" events
- `POST /api/pantry/deduct` — log "deducted" events
- `DELETE /api/pantry/[id]` — log "removed" event

---

## Client Changes

### New Component: `apps/mobile/components/pantry/ReorderSuggestions.tsx`

- Card shown on HomeScreen and PantryScreen
- Lists items predicted to run out soon
- Each item has "Add to Grocery List" button
- Urgency indicators (red: now, yellow: soon, blue: upcoming)

### `apps/mobile/screens/HomeScreen.tsx`

- Add ReorderSuggestions card below recipe queue

### `apps/mobile/screens/PantryScreen.tsx`

- Add "Running Low" section at top of pantry list

---

## Acceptance Criteria

- [ ] `pantry_events` table logs all pantry add/deduct/remove actions
- [ ] All existing pantry endpoints log events
- [ ] `GET /api/pantry/predictions` returns items predicted to run out
- [ ] Predictions require ≥3 purchase cycles
- [ ] Weighted moving average favors recent patterns
- [ ] Urgency classification: now (overdue), soon (≤3d), upcoming (≤7d)
- [ ] Home screen shows reorder suggestions card
- [ ] User can add predicted items to grocery list with one tap
- [ ] Non-premium users receive 403
- [ ] `pnpm typecheck` passes in all packages
