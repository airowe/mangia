# @mangia/mobile

React Native / Expo SDK 54 mobile app. TypeScript 5.9.

## Design System

Editorial/magazine aesthetic with warm, earthy tones.

**Colors** (defined in `theme/tokens/colors.ts`):
- Terracotta `#D97742` — primary accent, buttons, CTAs
- Sage `#A8BCA0` — secondary accent
- Cream `#FBF9F5` — background
- Editorial Dark `#3A322C` — text

**Typography**: Georgia serif for headlines, system fonts for body.

**Spacing**: 4px grid (xs:4, sm:8, md:12, lg:16, xl:24, xxl:32, xxxl:48).

## Patterns

- **Styling**: Inline styles with theme tokens — use `useTheme()` hook, not `StyleSheet.create`
- **Colors**: Use semantic colors (`theme.colors.primary`), not palette values directly
- **State**: React Context + custom hooks (no Redux)
- **Navigation**: React Navigation 7.x — bottom tabs (Home, Pantry, Shopping, Recipes) + native stacks
- **Auth**: Clerk (`@clerk/clerk-expo`) — token injected into API client via `ClerkTokenProvider`
- **Animations**: React Native Reanimated 4.x with native driver
- **HTTP**: Axios singleton at `lib/api/client.ts` — auto-injects auth token, 30s timeout
- **Monetization**: RevenueCat — `SubscriptionContext` manages premium state

## File Naming

- Components: PascalCase (`FeaturedRecipeCard.tsx`)
- Hooks: camelCase with `use` prefix (`usePremiumFeature.ts`)
- Utils: camelCase (`categorizeIngredient.ts`)
- Models: PascalCase (`Recipe.ts`)

## Key Workflows

- **Recipe Import**: User pastes URL → backend extracts → progress screen → added to library
- **Cooking Mode**: Recipe detail → mise en place checklist → step-by-step with voice → timer → mark complete
- **Grocery List**: Add recipes to queue → generate list (auto-deducts pantry) → check off while shopping
- **Pantry Scan**: Camera capture → `POST /api/pantry/scan` (Gemini vision) → confirm items → save

## Gotchas

- `DEV_BYPASS_AUTH` in `lib/devConfig.ts` skips auth during development
- Cooking mode uses `expo-keep-awake` to prevent screen sleep
- Voice control is premium-only, cooking mode only
