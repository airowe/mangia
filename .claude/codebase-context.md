# Codebase Context

> Optional reference for AI agents. Read when you need to understand project structure.

## Project Overview

**Mangia** — Recipe management iOS app. Import recipes from URLs (blogs, YouTube, TikTok), track pantry inventory, generate smart grocery lists, cook step-by-step with voice control.

| Attribute | Value |
|-----------|-------|
| Type | React Native / Expo SDK 54 mobile app |
| Platform | iOS (primary), Android |
| Package Manager | pnpm (workspaces) |
| Bundle ID | `com.airowe.mangia` |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Language | TypeScript 5.9 |
| Navigation | React Navigation 7.x (bottom tabs + native stack) |
| State | React Context + custom hooks |
| Auth | Clerk (`@clerk/clerk-expo`) |
| Backend | Vercel serverless (`apps/api`) with Drizzle ORM |
| Database | Neon PostgreSQL |
| Vision AI | Gemini 2.5 Flash-Lite (pantry scanning) |
| Monetization | RevenueCat |
| Animations | React Native Reanimated 4.x |
| HTTP | Axios singleton with auth interceptor |

## Directory Structure

```
mangia/
├── apps/mobile/              # React Native app
│   ├── components/
│   │   ├── cooking/          # CookingMode (timer, controls, steps)
│   │   ├── editorial/        # Editorial-style cards and layouts
│   │   ├── glass/            # Glassmorphism components
│   │   ├── navigation/       # Tab bar, quick-add menu
│   │   ├── pantry/           # Pantry-specific components
│   │   ├── recipe/           # Recipe detail components
│   │   └── ui/               # Generic (EmptyState, ErrorState, Loading)
│   ├── contexts/             # ClerkTokenProvider, SubscriptionContext
│   ├── hooks/                # usePremiumFeature, useSpeech, useVoiceControl
│   ├── lib/                  # API client, parsers, pantry/grocery logic
│   ├── models/               # TypeScript interfaces (Recipe, Product, etc.)
│   ├── navigation/           # Tab + stack navigators
│   ├── screens/              # All app screens
│   ├── services/             # pantryService CRUD
│   ├── theme/                # Design tokens, light/dark variants
│   └── utils/                # Categorization, scaling, ID generation
├── apps/api/                 # Vercel serverless API
│   ├── api/                  # Route handlers (pantry/, recipes/, grocery-lists/, etc.)
│   ├── db/                   # Drizzle schema + client
│   └── lib/                  # Auth, errors, validation, AI scanners
└── packages/shared/          # Shared TypeScript types
```

## Domain Concepts

| Term | Meaning |
|------|---------|
| Recipe Queue | Recipes marked "Want to Cook" |
| Cooking Mode | Step-by-step guided cooking with voice/timers |
| Smart Grocery | Grocery list that auto-deducts pantry items |
| What Can I Make | Recipes filtered by available pantry ingredients |
| Collections | User-created recipe folders |
| Mise en Place | Ingredient prep checklist before cooking |

## Key Workflows

- **Recipe Import**: Paste URL → backend extracts via Firecrawl + AI → progress screen → added to library
- **Cooking**: Recipe detail → mise en place → step-by-step with voice → timer → mark complete
- **Grocery List**: Add recipes to queue → generate list (auto-deducts pantry) → check off while shopping → move to pantry
- **Pantry Scan**: Camera capture → Gemini vision API → confirm items → save to pantry (premium only)

## Patterns

- **Styling**: Inline styles with `useTheme()` hook, not StyleSheet.create
- **Colors**: Semantic colors (`theme.colors.primary`), not palette values directly
- **Navigation**: 4 bottom tabs (Home, Pantry, Shopping, Recipes) + native stacks
- **Auth**: Clerk token auto-injected into API client via `ClerkTokenProvider`
- **API routes**: Vercel file-based routing, Zod validation, Clerk JWT auth, Drizzle ORM
- **File naming**: Components PascalCase, hooks `use` prefix, utils camelCase

## Gotchas

- `DEV_BYPASS_AUTH` in `lib/devConfig.ts` skips auth during development
- Cooking mode uses `expo-keep-awake` to prevent screen sleep
- Voice control is premium-only, cooking mode only
- API client at `lib/api/client.ts` has 30s timeout, handles 401 session expiry
