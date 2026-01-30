# Server Offload: Premium Feature Definitions (API-021)

## Overview

Move the premium feature definitions from `usePremiumFeature.ts` to a server endpoint. Currently the client hardcodes `PREMIUM_FEATURES` — a record mapping feature keys to `{ title, description, icon }`. The server should provide this configuration so features can be toggled, renamed, or re-described without an app update.

---

## Problem

| Issue | Impact |
|-------|--------|
| `PREMIUM_FEATURES` record hardcoded in client | Can't rename, reorder, or toggle features without app update |
| All features gated identically (`checkFeature` just returns `isPremium`) | Can't make specific features free/premium dynamically |
| Feature descriptions tied to app bundle | A/B testing copy changes is impossible |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| New endpoint or extend user profile? | **New `GET /api/features`** | Feature config is app-level, not user-level |
| Cache strategy? | **Cache on client for session duration** | Feature config rarely changes; avoid hitting API on every screen |

---

## Server Implementation

### New File: `apps/api/api/features/index.ts`

`GET /api/features`:
1. Authenticate user
2. Return feature list with premium status per feature

```typescript
const FEATURES = [
  { key: "unlimited_imports", title: "Unlimited Recipe Imports", description: "Import as many recipes as you want from any source", icon: "download-multiple", requiresPremium: true },
  { key: "what_can_i_make", title: "What Can I Make?", description: "Find recipes based on ingredients you have", icon: "chef-hat", requiresPremium: true },
  { key: "cookbook_collection", title: "Cookbook Collection", description: "Organize recipes into custom collections", icon: "bookshelf", requiresPremium: true },
  { key: "grocery_export", title: "Export Grocery Lists", description: "Share grocery lists to other apps", icon: "export", requiresPremium: true },
  { key: "meal_planning", title: "Meal Planning", description: "Plan your weekly meals in advance", icon: "calendar-week", requiresPremium: true },
  { key: "advanced_search", title: "Advanced Search", description: "Filter by dietary restrictions, time, and more", icon: "filter-variant", requiresPremium: true },
];

return res.status(200).json({
  features: FEATURES,
  userIsPremium: !!user.isPremium,
});
```

### Client Changes

**`apps/mobile/hooks/usePremiumFeature.ts`:**
- Remove `PREMIUM_FEATURES` constant and `PremiumFeature` type
- Fetch features from `GET /api/features` on mount
- Cache response in state
- `checkFeature(key)` looks up `requiresPremium` from server data
- Export fetched features for paywall display

---

## Acceptance Criteria

- [ ] `GET /api/features` returns feature list with `requiresPremium` flag
- [ ] `usePremiumFeature` fetches features from server
- [ ] `PREMIUM_FEATURES` constant removed from client
- [ ] `checkFeature` uses server-provided `requiresPremium` flag
- [ ] Paywall screen displays server-provided titles/descriptions
- [ ] `pnpm typecheck` passes in all packages
