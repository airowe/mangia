# Claude Code Quick Start

## TL;DR

Building a recipe-to-grocery-list app for the RevenueCat Shipyard competition.

**Creator:** Eitan Bernath (2.3M TikTok followers)  
**Prize:** $20,000  
**Deadline:** February 12, 2026

**Core feature:** Paste recipe URL → Extract ingredients → Generate grocery list (minus what's in pantry)

---

## The One-Liner

> "Give the app a link to a video you saw... and it will actually write a food list for you that you can go grocery shopping with" — Eitan Bernath

---

## Base Codebase

This project builds on **grosheries** (https://github.com/airowe/grosheries), an existing Expo React Native app that already has:

- ✅ Supabase auth & database
- ✅ Firecrawl recipe URL extraction  
- ✅ Recipe data models
- ✅ Pantry tracking (full CRUD)
- ✅ UI components, navigation, theming

---

## What to Build

### P0 (Must Have)
1. **Import Recipe Screen** — Paste URL → extract → save
2. **Home Screen** — "Want to Cook" queue
3. **Grocery List Screen** — Consolidated list with pantry deduction
4. **Pantry Screen** — Track what user has
5. **RevenueCat Integration** — Freemium subscription

### P1 (Should Have)
- Video URL support (TikTok, YouTube)
- Multi-recipe grocery list consolidation

### P2 (Premium Features)
- "What Can I Make?" (pantry → recipe matching)
- Cookbook collection tracking

---

## Key Files to Create

```
lib/
├── recipeParser.ts      # URL → recipe orchestrator
├── ingredientParser.ts  # Claude API extraction
├── groceryList.ts       # List generation + pantry check
├── revenuecat.ts        # Subscriptions

screens/
├── ImportRecipeScreen.tsx
├── GroceryListScreen.tsx
├── SubscriptionScreen.tsx
```

---

## PRD Documents

Read these in order:

1. `00-PROJECT-OVERVIEW.md` — Context and goals
2. `01-FEATURE-REQUIREMENTS.md` — Detailed feature specs
3. `02-DATA-MODELS.md` — TypeScript interfaces + SQL schema
4. `03-SCREENS-AND-NAVIGATION.md` — Screen specs
5. `04-SERVICES-AND-APIs.md` — Service implementations
6. `05-REVENUECAT-INTEGRATION.md` — Subscription setup
7. `06-GROSHERIES-CODE-MAP.md` — What to reuse/adapt/remove
8. `07-SPRINT-PLAN.md` — Day-by-day schedule
9. `08-SUBMISSION-CHECKLIST.md` — Deliverables

---

## Environment Variables Needed

```bash
# Existing (from grosheries)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_FIRECRAWL_API_KEY=

# New
EXPO_PUBLIC_CLAUDE_API_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_KEY=
EXPO_PUBLIC_RAPIDAPI_KEY=  # For video transcripts
```

---

## First Steps

1. Fork grosheries repo
2. Remove unused code (see `06-GROSHERIES-CODE-MAP.md`)
3. Set up new Supabase tables (see `02-DATA-MODELS.md`)
4. Create RevenueCat account
5. Start with `ImportRecipeScreen` — the core feature

---

## Success Criteria

- [ ] Can paste recipe URL and extract ingredients
- [ ] Can save recipes to "Want to Cook" queue
- [ ] Can track pantry items
- [ ] Can generate grocery list (minus pantry items)
- [ ] RevenueCat paywall works
- [ ] TestFlight build runs on device
