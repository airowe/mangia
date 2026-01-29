# Server Offload: Kitchen Alerts — Pantry Expiry (API-012)

## Overview

Replace the hardcoded mock data in `KitchenAlertsScreen` with a real `GET /api/pantry/alerts` server endpoint that queries the user's pantry items by expiry date, classifies them as "expired" or "expiring soon", and returns pre-grouped, pre-sorted results. The screen currently renders static placeholder items and has no connection to actual pantry data.

---

## Problem

| Issue | Impact |
|-------|--------|
| Screen uses hardcoded `MOCK_EXPIRED` / `MOCK_EXPIRING` arrays | Feature is non-functional — users see fake data |
| No server endpoint to query pantry items by expiry status | Can't build real alerts without one |
| "Clear All" / "Delete" actions only mutate local state | Changes are lost on refresh; no server persistence |
| Category filter is client-side on mock data | Cannot filter real data |
| No badge count for alerts tab/icon | App can't show unread alert counts |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| What counts as "expiring soon"? | **Items expiring within 7 days** | Reasonable default; configurable via `window` query param |
| Should "Clear All" delete items from pantry? | **No** — dismiss alerts only | Users may still have the item; dismissing hides it from alerts until next expiry window |
| How to handle items with no expiry date? | **Exclude from alerts** | Only items with `expiryDate` set are relevant; most scanned items may not have dates |
| Separate endpoint or extend GET /api/pantry? | **New endpoint** | Different response shape (grouped by status, computed fields), distinct concern |
| Return human-readable expiry text from server? | **Yes** — `expiryText` like "Yesterday", "In 3 Days" | Avoids client date math; server is authoritative on "now" |

---

## Endpoint

### `GET /api/pantry/alerts`

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `window` | `number` | `7` | Days ahead to look for expiring items |
| `category` | `string` | (none) | Filter by ingredient category (e.g., `dairy_eggs`, `produce`) |

**Response:**
```json
{
  "expired": [
    {
      "id": "uuid",
      "name": "Greek Yogurt",
      "category": "dairy_eggs",
      "quantity": 1,
      "unit": "container",
      "expiryDate": "2026-01-28T00:00:00Z",
      "expiryText": "Yesterday",
      "daysUntilExpiry": -1
    }
  ],
  "expiring": [
    {
      "id": "uuid",
      "name": "Parmesan Cheese",
      "category": "dairy_eggs",
      "quantity": 8,
      "unit": "oz",
      "expiryDate": "2026-02-01T00:00:00Z",
      "expiryText": "In 3 Days",
      "daysUntilExpiry": 3
    }
  ],
  "counts": {
    "expired": 2,
    "expiring": 3,
    "total": 5
  }
}
```

The `counts` object enables badge display without loading the full list.

---

## Server Implementation

### New File: `apps/api/api/pantry/alerts.ts`

`GET /api/pantry/alerts`:
1. Authenticate user (Clerk)
2. Parse `window` (default 7, validate integer) and `category` from query
3. Query pantry items where:
   - `userId = user.id`
   - `expiryDate IS NOT NULL`
   - `expiryDate <= NOW() + window days` (expired OR expiring soon)
   - Optional: `category = ?`
4. Split results into `expired` (expiryDate < start of today) and `expiring` (expiryDate >= start of today AND <= today + window)
5. Sort: expired by most recently expired first (`expiryDate DESC`), expiring by soonest first (`expiryDate ASC`)
6. Compute `expiryText` and `daysUntilExpiry` for each item

### New File: `apps/api/lib/expiry-helpers.ts`

Pure utility functions:
- `computeDaysUntilExpiry(expiryDate: Date): number` — negative = days since expired
- `formatExpiryText(daysUntil: number): string` — "Yesterday", "2 days ago", "Tomorrow", "In 3 Days", "Today"
- `getAlertWindowDate(windowDays: number): Date` — returns cutoff date

### SQL Query Strategy

```sql
SELECT * FROM pantry_items
WHERE user_id = $1
  AND expiry_date IS NOT NULL
  AND expiry_date <= (CURRENT_DATE + $2 * INTERVAL '1 day')
ORDER BY expiry_date ASC;
```

Post-query split in TypeScript (simpler than two separate queries, and the result set is small).

---

## Client Changes

### New File: `apps/mobile/lib/kitchenAlerts.ts`

```typescript
export interface AlertItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  expiryText: string;
  daysUntilExpiry: number;
  type: "expired" | "expiring";
}

export interface AlertsResponse {
  expired: AlertItem[];
  expiring: AlertItem[];
  counts: { expired: number; expiring: number; total: number };
}

export async function fetchPantryAlerts(params?: {
  window?: number;
  category?: string;
}): Promise<AlertsResponse>
```

### Modified File: `apps/mobile/screens/KitchenAlertsScreen.tsx`

**Remove:**
- `MOCK_EXPIRED` and `MOCK_EXPIRING` constants (lines 38-77)
- Local `AlertItem` interface (lines 25-32) — import from `kitchenAlerts.ts`
- `useState` initialized with mock data (lines 84-85)

**Add:**
- Import `fetchPantryAlerts` from `../lib/kitchenAlerts`
- `useEffect` to fetch alerts on mount with AbortController
- Loading state + RefreshControl for pull-to-refresh
- Map `category` filter pill to `fetchPantryAlerts({ category })` — re-fetch on filter change
- `handleDeleteItem` calls `removeFromPantry(itemId)` then refreshes alerts
- `handleClearAll` calls `removeFromPantry` for all expired items (with confirmation)

**Keep unchanged:**
- All render/card/style code (cards already expect `name`, `expiryText`, `category`)
- Filter pill UI
- Empty state
- Animation entries

### Category Filter Mapping

The current UI filter pills use display names ("Dairy", "Produce", "Pantry", "Proteins"). These need to map to the DB `ingredient_category` enum:

| UI Pill | DB Category |
|---------|-------------|
| All | (no filter) |
| Dairy | `dairy_eggs` |
| Produce | `produce` |
| Pantry | `pantry` |
| Proteins | `meat_seafood` |

---

## Acceptance Criteria

- [ ] `GET /api/pantry/alerts` returns real pantry items grouped by expiry status
- [ ] Items with `expiryDate` before today appear in `expired` array
- [ ] Items with `expiryDate` within the next 7 days appear in `expiring` array
- [ ] Items with no `expiryDate` are excluded
- [ ] `window` param adjusts the look-ahead period
- [ ] `category` param filters by ingredient category
- [ ] `expiryText` returns human-readable strings ("Yesterday", "In 3 Days", etc.)
- [ ] `counts` object returns correct totals for badge display
- [ ] `KitchenAlertsScreen` loads real data on mount (no mock data)
- [ ] Pull-to-refresh re-fetches alerts
- [ ] Category filter pills re-fetch with `category` param
- [ ] "Delete" removes the pantry item server-side and refreshes the list
- [ ] "Clear All" removes all expired items with confirmation dialog
- [ ] Empty state shows when no alerts exist
- [ ] `pnpm typecheck` passes in all packages
