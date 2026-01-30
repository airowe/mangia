# Pantry: Smart Home Integration (PANTRY-011)

## Overview

Integrate with smart home platforms (Apple HomeKit/Shortcuts, Amazon Alexa) to allow voice-first pantry management from smart speakers and watches. "Hey Siri, tell Mangia I'm out of milk." This brings pantry management to the ambient computing layer.

---

## Problem

| Issue | Impact |
|-------|--------|
| Phone-based input requires picking up the device | Friction in the kitchen when hands are messy/busy |
| Smart speakers are always listening but can't update Mangia | Missed opportunity for ambient pantry updates |
| Apple Watch is on the wrist but has no pantry input | Wearable convenience wasted |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Platform priority? | **Apple Shortcuts (Siri)** first, then Alexa | iOS-first app; Shortcuts is native, no external SDK |
| Integration method? | **Siri Shortcuts** via `expo-shortcuts` or native module | Deeplink-based, works from Siri, Watch, HomePod |
| Alexa approach? | **Alexa Smart Home Skill** | Requires separate skill submission but massive reach |
| What operations? | **Add items, check stock, read alerts** | Cover the 3 most common voice pantry actions |
| Premium? | **Free: basic add, Premium: full voice control** | Basic voice add has low server cost |

---

## Server Implementation

### New Endpoint: `POST /api/pantry/quick-add`

Simplified endpoint for voice/shortcut integrations that accepts natural language.

```typescript
// Request
{
  "input": "I'm out of milk and eggs",
  "source": "siri_shortcut"
}

// Response
{
  "items": [
    { "name": "Milk", "quantity": 1, "unit": "piece", "category": "dairy_eggs", "action": "added_to_grocery" },
    { "name": "Eggs", "quantity": 1, "unit": "piece", "category": "dairy_eggs", "action": "added_to_grocery" }
  ],
  "message": "Added Milk and Eggs to your grocery list"
}
```

"I'm out of X" → adds to grocery list. "I have X" or "I bought X" → adds to pantry.

### New Endpoint: `GET /api/pantry/stock-check`

```typescript
// Request: GET /api/pantry/stock-check?item=milk
// Response
{
  "found": true,
  "item": "Whole Milk",
  "quantity": 0.5,
  "unit": "gallon",
  "status": "low",
  "expiryDate": "2026-02-01"
}
```

### New File: `apps/api/lib/intent-parser.ts`

Parse voice intent from natural language:
- "I'm out of X" / "We need X" → `{ intent: "add_to_grocery", items: [...] }`
- "I bought X" / "I have X" → `{ intent: "add_to_pantry", items: [...] }`
- "Do I have X?" / "How much X do I have?" → `{ intent: "stock_check", item: "X" }`
- "What's expiring?" → `{ intent: "check_alerts" }`

---

## Client Changes

### Siri Shortcuts Integration

#### New File: `apps/mobile/lib/siri-shortcuts.ts`

Register Siri Shortcuts for:
1. **"Add to Mangia Pantry"** — input: text → `POST /api/pantry/quick-add`
2. **"Check Mangia Stock"** — input: text → `GET /api/pantry/stock-check`
3. **"Mangia Kitchen Alerts"** — → `GET /api/pantry/alerts`

Uses `expo-shortcuts` or native `IntentKit` bridge.

#### `apps/mobile/screens/AccountScreen.tsx`

- Add "Siri Shortcuts" section
- "Set up Siri" buttons for each shortcut
- Test shortcut functionality

### Apple Watch (Future)

- WatchOS companion via `react-native-watch-connectivity`
- Quick-add complications
- Grocery list on wrist

---

## Acceptance Criteria

- [ ] `POST /api/pantry/quick-add` parses natural language and adds items
- [ ] Intent detection distinguishes "out of" (grocery) vs "bought" (pantry) vs "do I have" (check)
- [ ] `GET /api/pantry/stock-check` returns stock status for queried item
- [ ] Siri Shortcut registered for "Add to Mangia Pantry"
- [ ] Siri Shortcut registered for "Check Mangia Stock"
- [ ] Shortcut setup accessible from Account screen
- [ ] Works from HomePod via Siri
- [ ] `pnpm typecheck` passes in all packages
