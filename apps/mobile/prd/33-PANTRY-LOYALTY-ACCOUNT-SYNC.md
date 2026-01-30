# Pantry: Loyalty Account Sync (PANTRY-008)

## Overview

Connect to grocery store loyalty accounts (Kroger, Walmart, Target Circle, Instacart) to automatically pull purchase history. Unlike email receipts (PANTRY-007), this uses official retailer APIs for structured, reliable data. The "holy grail" of pantry automation — every purchase synced automatically.

---

## Problem

| Issue | Impact |
|-------|--------|
| Even email parsing depends on users enabling receipt emails | Not everyone has digital receipts |
| Loyalty programs track every purchase with precision | Better data source than any scanning method |
| No direct integration between grocery apps and cooking apps | Industry gap that Mangia can fill |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Which retailers first? | **Kroger** (has public API), then Instacart, Walmart | Kroger has an actual developer program; others require partnerships |
| Auth method? | **OAuth 2.0** per retailer API | Standard, secure, user-consented |
| Sync frequency? | **On-demand** + optional weekly auto-sync | User controls when, with opt-in automation |
| Filter to food? | **Yes** — use category data from retailer | Retailers categorize products; filter to food/beverage |
| Premium? | **Yes** — premium exclusive | High-value differentiator, partnership potential |

---

## Server Implementation

### New Endpoints

**`GET /api/pantry/loyalty/providers`**
Returns available loyalty providers and connection status.

```typescript
// Response
{
  "providers": [
    {
      "id": "kroger",
      "name": "Kroger",
      "logo": "https://...",
      "connected": true,
      "lastSync": "2026-01-28T10:00:00Z",
      "status": "active"
    },
    {
      "id": "walmart",
      "name": "Walmart",
      "logo": "https://...",
      "connected": false,
      "status": "coming_soon"
    }
  ]
}
```

**`POST /api/pantry/loyalty/connect`**
Initiate OAuth flow for a retailer.

**`POST /api/pantry/loyalty/sync`**
Pull recent purchases from connected accounts.

```typescript
// Request
{
  "provider": "kroger",
  "lookbackDays": 14
}

// Response
{
  "provider": "kroger",
  "orders": [
    {
      "date": "2026-01-27",
      "store": "Kroger #1234",
      "items": [
        {
          "name": "Simple Truth Organic Whole Milk",
          "brand": "Simple Truth",
          "quantity": 1,
          "unit": "gallon",
          "category": "dairy_eggs",
          "upc": "0001111042101",
          "price": 5.99
        }
      ]
    }
  ],
  "totalItems": 28
}
```

### New Files

```
apps/api/lib/loyalty/
├── index.ts              # Provider registry + sync orchestrator
├── types.ts              # Shared types (LoyaltyProvider, PurchaseOrder)
├── kroger.ts             # Kroger API integration (OAuth + purchase history)
└── providers.ts          # Provider metadata (name, logo, status)
```

### Database Changes

New table: `loyalty_connections`
```sql
CREATE TABLE loyalty_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);
```

### Environment Variables

```
KROGER_CLIENT_ID=...
KROGER_CLIENT_SECRET=...
```

---

## Client Changes

### New Screen: `apps/mobile/screens/LoyaltyAccountsScreen.tsx`

- List of available retailers with connect/disconnect buttons
- Connected accounts show last sync date
- "Sync Now" button per provider
- Auto-sync toggle (weekly)
- Sync results: list of new items found, with "Add to Pantry" option

### `apps/mobile/screens/PantryScreen.tsx`

- Add "Sync Loyalty Accounts" option to add-item menu

### `apps/mobile/screens/AccountScreen.tsx`

- Add "Connected Accounts" section linking to LoyaltyAccountsScreen

---

## Acceptance Criteria

- [ ] Kroger OAuth flow connects user account
- [ ] `POST /api/pantry/loyalty/sync` pulls purchase history from Kroger API
- [ ] Items include name, brand, UPC, quantity, unit, category, price
- [ ] Non-food items are filtered out
- [ ] User can review synced items before adding to pantry
- [ ] Connection tokens are stored securely, refreshed on expiry
- [ ] "Connected Accounts" screen shows provider status
- [ ] Non-premium users receive 403
- [ ] `pnpm typecheck` passes in all packages
