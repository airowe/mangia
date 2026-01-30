# Pantry: Cooking Deduction (PANTRY-002)

## Overview

When a user finishes cooking a recipe in Cooking Mode, automatically deduct the used ingredients from the pantry. This closes the loop: groceries come in via transfer (PANTRY-001), and get consumed when recipes are cooked. The pantry stays accurate without any manual updates.

---

## Problem

| Issue | Impact |
|-------|--------|
| After cooking, pantry still shows ingredients that were used | Pantry quantities are wrong, "What Can I Make" gives false positives |
| Users must manually subtract from pantry after every meal | Nobody does this — pantry drifts from reality |
| No feedback loop between cooking and inventory | Pantry feature feels disconnected from core cooking workflow |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| When to trigger? | **On Cooking Mode completion** — after marking recipe "done" | Natural end point; user has just cooked |
| Auto-deduct or confirm? | **Auto-deduct with undo** — show "Ingredients deducted" toast with "Undo" button | Least friction; undo handles edge cases (partial cook, substitutions) |
| What if ingredient not in pantry? | **Skip silently** | Don't block completion; user may have bought item same-day |
| Fuzzy matching? | **Yes** — normalize names for matching (lowercase, singularize, strip brand names) | "chicken breast" should match "Chicken Breast" in pantry |
| Handle scaled servings? | **Yes** — use the cooking session's actual serving count | If recipe is 4 servings but user cooked 2, deduct half |
| Zero or negative quantity? | **Remove item from pantry** if quantity hits 0 | Clean up empty items automatically |
| Premium? | **No** — core feature | Paired with PANTRY-001 for full lifecycle |

---

## Server Implementation

### New Endpoint: `POST /api/pantry/deduct`

Deducts recipe ingredients from pantry after cooking.

```typescript
// Request
{
  "recipeId": "uuid",
  "servingsCooked": 4,  // actual servings prepared
  "servingsOriginal": 4 // recipe's default servings
}

// Response
{
  "deducted": [
    { "name": "Chicken Breast", "deducted": 2, "remaining": 0, "removed": true },
    { "name": "Olive Oil", "deducted": 0.5, "remaining": 2.5, "removed": false }
  ],
  "skipped": ["Salt", "Black Pepper"],
  "undoToken": "uuid"  // for undo within 60 seconds
}
```

**Logic:**
1. Authenticate user
2. Fetch recipe ingredients with quantities/units
3. Scale quantities by `servingsCooked / servingsOriginal`
4. For each ingredient, fuzzy-match against user's pantry
5. Deduct matched quantities; remove items that hit 0
6. Return deduction summary + undo token
7. Store undo snapshot (Redis/memory, TTL 60s)

### New Endpoint: `POST /api/pantry/deduct/undo`

```typescript
// Request
{ "undoToken": "uuid" }
// Response
{ "restored": 5 }
```

### New File: `apps/api/lib/ingredient-matcher.ts`

Fuzzy ingredient matching utility:
- Normalize: lowercase, trim, singularize
- Strip common prefixes: "fresh", "dried", "ground", "organic"
- Strip brand names (known list + heuristic)
- Levenshtein distance fallback for close matches (threshold: 2)

---

## Client Changes

### `apps/mobile/screens/CookingModeScreen.tsx`

- On cooking completion, call `POST /api/pantry/deduct`
- Show toast: "Pantry updated — 8 ingredients deducted" with "Undo" action
- If undo tapped within 60s, call `POST /api/pantry/deduct/undo`

### `apps/mobile/components/cooking/CookingComplete.tsx`

- Add pantry deduction summary to the completion screen
- Show which items were deducted and which were skipped
- Optional: "These items are running low" callout for items at critical stock

---

## Acceptance Criteria

- [ ] `POST /api/pantry/deduct` deducts scaled ingredient quantities from pantry
- [ ] Fuzzy matching handles name variations (case, plurals, brand names)
- [ ] Items at 0 quantity are removed from pantry
- [ ] Scaled correctly when servings differ from recipe default
- [ ] Undo restores previous quantities within 60-second window
- [ ] Cooking Mode completion triggers deduction automatically
- [ ] Toast shows deduction summary with undo option
- [ ] Ingredients not found in pantry are skipped silently
- [ ] `pnpm typecheck` passes in all packages
