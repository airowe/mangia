# Pantry: Grocery → Pantry Transfer (PANTRY-001)

## Overview

When a user checks off items on their grocery list, automatically offer to transfer those items into the pantry. This is the single highest-impact pantry input method because it piggybacks on an existing workflow — shopping — and requires zero extra effort from the user.

---

## Problem

| Issue | Impact |
|-------|--------|
| Users buy groceries and check them off, but pantry stays empty | Pantry is always stale, "What Can I Make" feature is useless |
| Manual pantry entry is tedious — users won't do it regularly | Low pantry adoption, low retention |
| No link between shopping and pantry | Two features that should feed each other are siloed |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| When to trigger? | **On item check-off** — show inline "Add to pantry?" toggle | Lowest friction; user is already engaged with the item |
| Batch or individual? | **Batch** — "Add all checked items to pantry" button at bottom | Reduces taps for large shopping trips |
| What data to carry over? | Name, quantity, unit, category | Already available from grocery list item |
| Set expiry date? | **Smart defaults** based on category (see PRD-37) | Don't interrupt the shopping flow |
| Duplicate handling? | **Merge** — if item already in pantry, increment quantity | Avoids duplicates, keeps quantities accurate |
| Premium? | **No** — core feature for all users | Drives pantry adoption which drives premium conversion |

---

## Server Implementation

### New Endpoint: `POST /api/pantry/bulk-add`

Accepts an array of items to add/merge into the pantry in a single request.

```typescript
// Request
{
  "items": [
    {
      "name": "Chicken Breast",
      "quantity": 2,
      "unit": "lb",
      "category": "meat_seafood",
      "source": "grocery_transfer"
    }
  ],
  "mergeStrategy": "increment" // "increment" | "replace"
}

// Response
{
  "added": 3,
  "merged": 2,
  "items": [ /* full pantry items */ ]
}
```

**Logic:**
1. Authenticate user
2. Validate body with Zod (array of items, max 100)
3. For each item, check if a pantry item with the same normalized name exists
4. If exists and `mergeStrategy === "increment"`: add quantity
5. If not exists: create new pantry item with smart expiry default
6. Return created/updated items

### Modified: `apps/api/api/grocery-lists/[id].ts`

Add a `transferToPantry` field to the PATCH endpoint for checking off items, so the client can signal transfer intent.

---

## Client Changes

### `apps/mobile/screens/GroceryListScreen.tsx`

- When user checks off an item, show a subtle "Added to pantry" toast (auto-transfer by default)
- Add a toggle in grocery list settings: "Auto-add to pantry when checked" (default: ON)
- Add "Transfer All Checked → Pantry" button in the action bar
- After transfer, show summary toast: "5 items added to pantry"

### `apps/mobile/lib/groceryList.ts`

- Add `transferCheckedToPantry(items)` function
- Calls `POST /api/pantry/bulk-add` with checked items

---

## Acceptance Criteria

- [ ] `POST /api/pantry/bulk-add` creates or merges pantry items from an array
- [ ] Checking off grocery items auto-transfers to pantry (when setting enabled)
- [ ] Duplicate items are merged (quantity incremented) instead of creating duplicates
- [ ] "Transfer All Checked → Pantry" batch button works
- [ ] Transfer toast shows count of items added/merged
- [ ] User can disable auto-transfer in grocery list settings
- [ ] `pnpm typecheck` passes in all packages
