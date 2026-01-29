# Server Offload: Serving Size Suggestions (API-018)

## Overview

Move the `getServingSuggestions()` function from `utils/recipeScaling.ts` to a server endpoint. Currently the client generates serving suggestions using hardcoded common sizes `[1, 2, 4, 6, 8]`, the original serving count, and derived values (half, double). The server can provide personalized suggestions based on user history.

---

## Problem

| Issue | Impact |
|-------|--------|
| Common serving sizes hardcoded (`[1, 2, 4, 6, 8]`) | Can't personalize based on household size or cooking history |
| Max serving cap (24) and max suggestions (6) hardcoded | Inflexible for large-batch cooking |
| Pure client logic, no user context | Missed personalization opportunity |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| New endpoint or computed field? | **Computed field on recipe response** | No extra request; add `servingSuggestions: number[]` to recipe detail response |
| Personalization now? | **No** — replicate current logic first | Avoid scope creep; personalization is a future enhancement |

---

## Server Implementation

### New File: `apps/api/lib/serving-suggestions.ts`

Port `getServingSuggestions()` from mobile:

```typescript
export function getServingSuggestions(originalServings: number): number[] {
  const suggestions = new Set<number>();
  [1, 2, 4, 6, 8].forEach((s) => suggestions.add(s));
  suggestions.add(originalServings);
  suggestions.add(originalServings * 2);
  if (originalServings >= 2) {
    suggestions.add(Math.floor(originalServings / 2));
  }
  return Array.from(suggestions)
    .filter((s) => s > 0 && s <= 24)
    .sort((a, b) => a - b)
    .slice(0, 6);
}
```

### Modified File: `apps/api/api/recipes/[id].ts`

Add `servingSuggestions` to the GET response for a single recipe:
```typescript
const suggestions = getServingSuggestions(recipe.servings || 4);
return res.status(200).json({ recipe: { ...recipe, servingSuggestions: suggestions } });
```

### Client Changes

**`apps/mobile/utils/recipeScaling.ts`:**
- Remove `getServingSuggestions()` function
- Keep `scaleIngredient()` and other scaling utils (pure math, UI-specific)

**`apps/mobile/screens/RecipeDetailScreen.tsx`** (or wherever suggestions are consumed):
- Use `recipe.servingSuggestions` from the API response instead of calling local function

---

## Acceptance Criteria

- [ ] `GET /api/recipes/:id` includes `servingSuggestions: number[]` in response
- [ ] Suggestions match current logic (common sizes + original + half + double, max 6, capped at 24)
- [ ] Client uses server-provided suggestions
- [ ] `getServingSuggestions` removed from mobile utils
- [ ] `pnpm typecheck` passes in all packages
