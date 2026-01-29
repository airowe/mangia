# Server Offload: Recipe Difficulty Calculation (API-019)

## Overview

Move the `getDifficulty()` and `formatTime()` functions from `RecipesScreen.tsx` to computed fields on the server recipe response. Currently the client calculates difficulty (Easy/Medium/Hard based on total time thresholds) and formats time display on every render. These should be computed once on the server.

---

## Problem

| Issue | Impact |
|-------|--------|
| Difficulty thresholds (30min=Easy, 60min=Medium) hardcoded in client | Can't adjust without app update |
| `getDifficulty()` and `formatTime()` called per recipe per render | Redundant computation |
| Difficulty logic duplicated across screens (RecipesScreen, HomeScreen, etc.) | Inconsistency risk |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| New endpoint or computed field? | **Computed fields on recipe response** | No extra request; add `difficulty` and `formattedTotalTime` to recipe objects |
| Where to compute? | **In the GET handler after query** | Map over results before returning |

---

## Server Implementation

### New File: `apps/api/lib/recipe-metadata.ts`

```typescript
export type Difficulty = "Easy" | "Medium" | "Hard";

export function getDifficulty(prepTime: number | null, cookTime: number | null): Difficulty {
  const totalTime = (prepTime || 0) + (cookTime || 0);
  if (totalTime <= 30) return "Easy";
  if (totalTime <= 60) return "Medium";
  return "Hard";
}

export function formatTotalTime(prepTime: number | null, cookTime: number | null): string {
  const totalTime = (prepTime || 0) + (cookTime || 0);
  if (totalTime === 0) return "";
  if (totalTime < 60) return `${totalTime} min`;
  const hours = Math.floor(totalTime / 60);
  const mins = totalTime % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
}
```

### Modified File: `apps/api/api/recipes/index.ts`

In the GET handler, map over `userRecipes` to add computed fields:

```typescript
const enrichedRecipes = userRecipes.map((r) => ({
  ...r,
  difficulty: getDifficulty(r.prepTime, r.cookTime),
  formattedTotalTime: formatTotalTime(r.prepTime, r.cookTime),
}));
```

### Modified File: `apps/api/api/recipes/[id].ts`

Same enrichment for single recipe responses.

### Client Changes

**`apps/mobile/screens/RecipesScreen.tsx`:**
- Remove local `getDifficulty()` and `formatTime()` functions (lines 54-69)
- Use `recipe.difficulty` and `recipe.formattedTotalTime` from API response

---

## Acceptance Criteria

- [ ] `GET /api/recipes` includes `difficulty` and `formattedTotalTime` on each recipe
- [ ] `GET /api/recipes/:id` includes same fields
- [ ] Thresholds match current logic (<=30 Easy, <=60 Medium, else Hard)
- [ ] Time formatting matches current logic (minutes, hours+minutes)
- [ ] `RecipesScreen` uses server-provided fields
- [ ] Local `getDifficulty()` and `formatTime()` removed from screen
- [ ] `pnpm typecheck` passes in all packages
