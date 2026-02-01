# Codebase Context

> **INSTRUCTION FOR AGENTS:** Read this file when you need project context (new features, debugging, architecture questions). Skip for trivial tasks. This provides pre-built context to minimize exploration tokens.

---

## Project Overview

**Name:** Mangia
**Type:** Recipe management iOS app + API
**Package Manager:** pnpm (workspaces + Turborepo)
**Monorepo:** Yes — mobile app, API, shared types

**Purpose:** Import recipes from URLs (blogs, YouTube, TikTok), track pantry inventory, generate smart grocery lists, and cook step-by-step with voice control and Live Activity timers.

| Attribute | Value |
|-----------|-------|
| Name | Mangia |
| Bundle ID | `com.airowe.mangia` |
| App Group | `group.com.airowe.mangia` |
| Platform | iOS (primary) |
| Mobile | React Native 0.81.5 + Expo SDK 54 |
| API | Hono 4.x on Vercel (native Hono support) |
| Database | Neon PostgreSQL via Drizzle ORM |
| Auth | Clerk |
| Language | TypeScript 5.9 |

---

## Directory Structure

```
mangia/
├── apps/mobile/                 # React Native / Expo app
│   ├── components/
│   │   ├── cooking/             # CookingTimer, CookingControls, StepDisplay
│   │   ├── editorial/           # GroceryTeaser, FeaturedRecipeCard, editorial cards
│   │   ├── glass/               # Glassmorphism components
│   │   ├── navigation/          # CustomTabBar, QuickAddMenu
│   │   ├── pantry/              # PantryItemRow, CategorySection
│   │   ├── recipe/              # IngredientList, InstructionsPreview, StartCookingButton
│   │   └── ui/                  # EmptyState, ErrorState, Loading, modals
│   ├── contexts/                # ClerkTokenProvider, SubscriptionContext, TabBarLayoutContext
│   ├── hooks/                   # usePremiumFeature, useSpeech, useVoiceControl
│   ├── lib/                     # API client, parsers, pantry/grocery logic
│   │   └── api/                 # Axios client with auth interceptor
│   ├── live-activities/         # Voltra Live Activity for cooking timers
│   │   ├── CookingActivity.tsx  # Lock screen + Dynamic Island JSX layouts
│   │   └── useCookingActivity.ts # Hook wrapping Voltra API
│   ├── models/                  # TypeScript interfaces (Recipe, Product, etc.)
│   ├── navigation/              # TabNavigator, stacks (Home, Pantry, Shopping, Recipes)
│   ├── screens/                 # All app screens
│   ├── services/                # pantryService CRUD
│   ├── theme/                   # Design tokens, light/dark variants
│   │   └── tokens/              # colors.ts, typography.ts, spacing.ts
│   └── utils/                   # categorizeIngredient, recipeScaling, parseInstructionIngredients
├── apps/api/                    # Hono API on Vercel
│   ├── app.ts                   # Hono app with basePath("/api"), route mounts, middleware
│   ├── server.ts                # Local dev server (@hono/node-server)
│   ├── routes/                  # Route handlers
│   │   ├── recipes.ts           # CRUD + import + enrichment
│   │   ├── pantry.ts            # CRUD + AI scan
│   │   ├── grocery-lists.ts     # Generate + manage grocery lists
│   │   ├── collections.ts       # Recipe collections
│   │   ├── meal-plans.ts        # Meal planning
│   │   ├── households.ts        # Household management
│   │   ├── user.ts              # User profile
│   │   ├── features.ts          # Feature flags
│   │   ├── ingredients.ts       # Ingredient management
│   │   └── health.ts            # Health check
│   ├── middleware/               # Auth (Clerk JWT), error handler, CORS
│   ├── db/                      # Drizzle schema + client
│   ├── lib/                     # Utilities, AI scanners, validation
│   └── vercel.json              # Minimal config (buildCommand + outputDirectory)
├── packages/shared/             # Shared TypeScript types
│   └── src/types/               # recipe.ts, pantry.ts, grocery.ts, etc.
└── fastlane/                    # iOS build automation (in apps/mobile/)
    ├── Fastfile                 # Build + TestFlight upload
    ├── Matchfile                # Code signing (match)
    └── api_key.json             # App Store Connect key (gitignored)
```

---

## Key Files by Feature

### Recipe Management
- `apps/api/routes/recipes.ts` — CRUD, import from URL, enrichment (difficulty, servingSuggestions)
- `apps/mobile/screens/RecipeDetailScreen.tsx` — Full recipe view with ingredients, instructions, scaling
- `apps/mobile/components/recipe/IngredientList.tsx` — Ingredient display with scaling controls
- `apps/mobile/components/recipe/InstructionsPreview.tsx` — All preparation steps
- `apps/mobile/components/recipe/StartCookingButton.tsx` — CTA positioned above tab bar
- `apps/mobile/utils/recipeScaling.ts` — Scale quantities with fraction formatting
- `apps/mobile/utils/parseInstructionIngredients.ts` — Highlight ingredient references in step text

### Cooking Mode
- `apps/mobile/screens/CookingModeScreen.tsx` — Full-screen cooking experience with step navigation
- `apps/mobile/components/cooking/CookingTimer.tsx` — Countdown timer with start/pause/reset
- `apps/mobile/live-activities/CookingActivity.tsx` — Voltra JSX for lock screen + Dynamic Island
- `apps/mobile/live-activities/useCookingActivity.ts` — Hook wrapping Voltra's useLiveActivity

### Pantry
- `apps/api/routes/pantry.ts` — CRUD + AI scan endpoint
- `apps/mobile/screens/PantryScreen.tsx` — Pantry inventory with categories
- `apps/mobile/screens/AIPantryScannerScreen.tsx` — Camera-based pantry scanning
- `apps/mobile/services/pantryService.ts` — Local CRUD operations

### Grocery Lists
- `apps/api/routes/grocery-lists.ts` — Generate (POST) + manage grocery lists
- `apps/mobile/screens/ShoppingListScreen.tsx` — Shopping list with check-off
- `apps/mobile/components/editorial/GroceryTeaser.tsx` — Missing items card on home screen
- `apps/mobile/lib/api/grocery.ts` — API client functions

### Navigation & Layout
- `apps/mobile/navigation/TabNavigator.tsx` — Bottom tabs wrapped in TabBarLayoutProvider
- `apps/mobile/components/navigation/CustomTabBar.tsx` — Floating pill tab bar with liquid glass
- `apps/mobile/contexts/TabBarLayoutContext.tsx` — Reports tab bar height for content positioning
- `apps/mobile/App.tsx` — Root app with deep link config (including `cooking/:recipeId`)

### Home Screen
- `apps/mobile/screens/HomeScreen.tsx` — Editorial home with featured recipes
- `apps/mobile/screens/WantToCookScreen.tsx` — Recipe queue with grocery count

### Auth & Monetization
- `apps/mobile/contexts/ClerkTokenProvider.tsx` — Injects Clerk token into API client
- `apps/mobile/contexts/SubscriptionContext.tsx` — RevenueCat premium state
- `apps/mobile/hooks/usePremiumFeature.ts` — Premium feature gating

### Shared Types
- `packages/shared/src/types/recipe.ts` — RecipeIngredient (quantity/unit optional)
- `packages/shared/src/types/pantry.ts` — Pantry item types
- `packages/shared/src/types/grocery.ts` — Grocery list types

---

## Patterns & Conventions

### Naming
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts`
- Models: `PascalCase.ts`
- API routes: `kebab-case.ts`

### Components
- Use `useTheme()` hook for colors — never hardcode
- Inline styles with theme tokens, not `StyleSheet.create`
- Use `React.memo` for list items and expensive components
- Animations via Reanimated's `entering`/`exiting` props

### State
- Global state via React Context (no Redux)
- Auth state via `ClerkTokenProvider`
- Premium state via `SubscriptionContext`
- Tab bar layout via `TabBarLayoutContext`
- Local state with `useState`/`useReducer`

### API
- Routes in `apps/api/routes/` mounted on Hono app in `app.ts`
- Base path: `/api` (e.g., `GET /api/recipes/:id`)
- Auth: Clerk JWT middleware
- Validation: Zod schemas
- Errors: `ApiError` class caught by `errorHandler` middleware
- All DB access through Drizzle ORM

### Design System
- Terracotta `#D97742` for primary actions
- Sage `#A8BCA0` for secondary/grocery elements
- Cream `#FBF9F5` for backgrounds
- Deep Brown `#3A322C` for text and cooking mode
- Georgia serif for headlines, system fonts for body
- 4px spacing grid

---

## Current Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | Expo SDK 54, React Native 0.81, React Navigation 7.x |
| API | Hono 4.x, Vercel (native Hono support) |
| Database | Neon PostgreSQL, Drizzle ORM |
| Auth | Clerk (mobile + API) |
| State | React Context + hooks |
| Animations | React Native Reanimated 4.x |
| Styling | Inline styles + theme tokens |
| HTTP | Axios with auth interceptor |
| Monetization | RevenueCat |
| Vision AI | Gemini 2.5 Flash-Lite |
| Live Activities | Voltra 1.1.2 |
| Build/CI | Fastlane, pnpm + Turborepo |
| iOS Signing | Fastlane Match (AppStore profiles) |

---

## Domain Concepts

| Term | Meaning |
|------|---------|
| Recipe Queue | Recipes marked "Want to Cook" |
| Cooking Mode | Step-by-step guided cooking with voice/timers |
| Smart Grocery | Grocery list that auto-deducts pantry items |
| What Can I Make | Recipes filtered by available pantry ingredients |
| Collections | User-created recipe folders |
| Mise en Place | Ingredient prep checklist before cooking |
| Live Activity | iOS lock screen / Dynamic Island countdown during cooking |

---

## Important Rules

1. **Never commit without user approval** — always run QCHECK first
2. **Read this file before exploring** — saves tokens
3. **Hono native on Vercel** — no `api/[[...route]].ts` catch-all, Vercel auto-detects `app.ts`
4. **RecipeIngredient.quantity/unit are optional** — always use `?? 0` / `?? ''` fallbacks
5. **pnpm only** — never use npm or yarn
6. **iOS 17.0+ deployment target** — required for Live Activities

---

## Quick Commands

```bash
pnpm typecheck              # Typecheck all packages
pnpm lint                   # Lint all packages
pnpm start:mobile           # Expo dev server
pnpm dev:api                # Hono dev server (port 3001)
pnpm ios                    # iOS simulator
npx expo prebuild --clean   # Generate native projects (resets build numbers!)
fastlane beta               # Build + upload to TestFlight
```

---

## Gotchas

1. **DEV_BYPASS_AUTH** in `lib/devConfig.ts` skips auth during development
2. **Cooking mode** uses `expo-keep-awake` to prevent screen sleep
3. **Voice control** is premium-only, cooking mode only
4. **Live Activities** require dev client (not Expo Go) and iOS 17.0+
5. **`expo prebuild --clean`** resets build numbers — Fastfile queries `latest_testflight_build_number` first
6. **App Group** `group.com.airowe.mangia` shared between main app, ShareExtension, and MangiaLiveActivity
7. **Fastlane signing** — each extension target needs its own App ID + provisioning profile with App Groups
8. **API client** at `lib/api/client.ts` has 30s timeout, handles 401 session expiry
9. **Grocery generate endpoint** is POST not GET — `groceryListsRoutes.post("/generate", ...)`
10. **RecipeIngredient** quantity and unit are nullable in DB — shared types mark them optional
11. **fastlane/api_key.json** is gitignored — contains App Store Connect private key
