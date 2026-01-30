# Codebase Context

> **INSTRUCTION FOR AGENTS:** Read this file FIRST before exploring the codebase.

## Project Overview

**Mangia** - "From saved recipe to dinner made"

A recipe management iOS app that helps users import recipes from any URL (blogs, YouTube, TikTok), track pantry inventory, generate smart grocery lists, find recipes based on available ingredients, and plan weekly meals.

| Attribute | Value |
|-----------|-------|
| Name | Mangia |
| Type | React Native / Expo mobile app |
| Platform | iOS (primary), Android |
| Package Manager | pnpm |
| Bundle ID | `com.airowe.mangia` |
| EAS Project ID | `e4128852-4b78-49d1-b720-3a746267e2e4` |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Language | TypeScript 5.9 |
| Navigation | React Navigation 7.x (bottom tabs + native stack) |
| State | React Context + custom hooks |
| Auth | Clerk (`@clerk/clerk-expo`) |
| Backend API | Vercel serverless (`apps/api`) with Drizzle ORM |
| Database | Neon PostgreSQL (via Drizzle ORM) |
| Vision AI | Gemini 2.5 Flash-Lite (pantry scanning) |
| Monetization | RevenueCat (`react-native-purchases`) |
| Animations | React Native Reanimated 4.x |
| UI Effects | `@callstack/liquid-glass`, `expo-blur` |
| HTTP Client | Axios |
| Logging | LogRocket |

## Directory Structure

```
mangia/
├── App.tsx                    # Root component with providers
├── index.tsx                  # Entry point
├── app.json                   # Expo configuration
├── assets/                    # Icons, splash screens
├── components/
│   ├── cooking/               # CookingMode components (timer, controls, steps)
│   ├── editorial/             # Editorial-style UI (FeaturedCard, QueueItem, etc.)
│   ├── glass/                 # Glassmorphism components (GlassCard, GlassSheet)
│   ├── navigation/            # Tab bar, quick-add menu
│   ├── onboarding/            # Onboarding flow components
│   ├── pantry/                # Pantry-specific components
│   ├── recipe/                # Recipe detail components (Hero, IngredientList)
│   └── ui/                    # Generic UI (EmptyState, ErrorState, LoadingState)
├── contexts/
│   ├── ClerkTokenProvider.tsx # Auth token management
│   └── SubscriptionContext.tsx # Premium subscription state
├── fastlane/                  # App Store deployment
│   ├── Appfile                # Apple ID & team config
│   ├── Fastfile               # Lane definitions
│   ├── metadata/en-US/        # App Store listing content
│   └── screenshots/           # App Store screenshots
├── hooks/
│   ├── usePremiumFeature.ts   # Check premium access
│   ├── useRecipeLimit.ts      # Free tier recipe limits
│   ├── useSpeech.ts           # Text-to-speech for cooking mode
│   ├── useUser.ts             # User data from Clerk
│   └── useVoiceControl.ts     # Voice commands in cooking mode
├── lib/
│   ├── api/client.ts          # Axios API client singleton
│   ├── clerk.ts               # Clerk token cache
│   ├── revenuecat.ts          # RevenueCat SDK integration
│   ├── recipeParser.ts        # Recipe URL parsing
│   ├── groceryList.ts         # Grocery list logic
│   ├── pantry.ts              # Pantry operations
│   └── whatCanIMake.ts        # Recipe matching
├── marketing/
│   ├── icons/                 # App icons in all sizes
│   └── landing/               # Landing page HTML prototype
├── models/                    # TypeScript interfaces
│   ├── Recipe.ts              # Recipe, RecipeIngredient, ParsedRecipe
│   ├── Product.ts             # PantryItem
│   ├── GroceryList.ts         # Shopping list
│   ├── Collection.ts          # Recipe collections
│   ├── Cookbook.ts            # Saved cookbooks
│   ├── Meal.ts                # Meal planning
│   └── Subscription.ts        # Premium tiers
├── navigation/
│   ├── TabNavigator.tsx       # Bottom tab navigation
│   ├── HomeStack.tsx          # Home screen stack
│   ├── PantryStack.tsx        # Pantry management stack
│   ├── ShoppingStack.tsx      # Grocery list stack
│   └── RecipeLibraryStack.tsx # Recipe browser stack
├── screens/                   # All app screens (see Key Screens below)
├── services/
│   └── pantryService.ts       # Pantry CRUD operations
├── supabase/migrations/       # Database schema migrations
├── theme/
│   ├── tokens/
│   │   ├── colors.ts          # Editorial palette (terracotta, sage, cream)
│   │   ├── typography.ts      # Font scales, editorial text styles
│   │   ├── spacing.ts         # 4px grid system
│   │   └── animation.ts       # Duration presets, spring configs
│   ├── variants/
│   │   ├── light.ts           # Light mode semantic colors
│   │   └── dark.ts            # Dark mode semantic colors
│   ├── hooks/useTheme.ts      # Theme hook
│   └── index.ts               # ThemeProvider export
├── ui-redesign/               # HTML prototypes (reference only)
│   └── stitch_recipe_library/ # Screen mockups from Stitch
├── utils/
│   ├── categorizeIngredient.ts # Auto-categorize for grocery list
│   ├── parseInstructionIngredients.ts
│   ├── recipeScaling.ts       # Adjust servings
│   └── id.ts                  # UUID generation
├── website/                   # Marketing website (Vercel)
│   ├── index.html             # Landing page
│   ├── privacy.html           # Privacy policy
│   ├── terms.html             # Terms of service
│   ├── support.html           # FAQ/support
│   └── vercel.json            # Deployment config
└── apps/api/                  # Vercel serverless API
    ├── api/                   # API route handlers (Vercel convention)
    │   ├── pantry/            # Pantry CRUD + AI scan endpoints
    │   │   ├── index.ts       # GET (list), POST (create)
    │   │   ├── [id].ts        # PATCH (update), DELETE (remove)
    │   │   ├── scan.ts        # POST AI vision scan (Gemini)
    │   │   ├── scan-compare.ts # POST vision model comparison
    │   │   └── alerts.ts      # GET expiry alerts
    │   ├── recipes/           # Recipe CRUD + import
    │   ├── grocery-lists/     # Grocery list generation
    │   └── collections/       # Recipe collections
    ├── db/                    # Drizzle ORM schema + client
    │   └── schema.ts          # PostgreSQL table definitions
    ├── lib/                   # Shared server utilities
    │   ├── auth.ts            # Clerk JWT verification
    │   ├── errors.ts          # ApiError class + handleError
    │   ├── validation.ts      # Zod schema validation
    │   ├── pantry-scanner.ts  # Gemini 2.5 Flash-Lite vision
    │   ├── grocery-generator.ts # Ingredient categorization
    │   ├── stock-status.ts    # Pantry stock level computation
    │   └── vision-compare/    # Multi-model comparison harness
    │       ├── index.ts       # Orchestrator (Promise.allSettled)
    │       ├── types.ts       # ScannedItem, ModelResult types
    │       ├── prompt.ts      # Shared vision prompt
    │       └── providers/     # Per-model API adapters
    │           ├── gemini.ts  # Gemini 2.0/2.5 Flash/Pro
    │           └── claude.ts  # Claude Sonnet 4
    └── scripts/
        └── compare-vision.ts  # CLI comparison tool
```

## Key Screens

| Screen | File | Purpose |
|--------|------|---------|
| Home | `screens/HomeScreen.tsx` | Featured recipes, cooking queue |
| Recipe Detail | `screens/RecipeDetailScreen.tsx` | Full recipe view, start cooking |
| Cooking Mode | `screens/CookingModeScreen.tsx` | Step-by-step cooking with voice |
| Import Recipe | `screens/ImportRecipeScreen.tsx` | Paste URL to import |
| Import Progress | `screens/RecipeImportProgressScreen.tsx` | Shows parsing progress |
| Pantry | `screens/PantryScreen.tsx` | Ingredient inventory |
| AI Scanner | `screens/AIPantryScannerScreen.tsx` | Camera-based pantry scan |
| Confirm Scanned | `screens/ConfirmScannedItemsScreen.tsx` | Review scanned items |
| Kitchen Alerts | `screens/KitchenAlertsScreen.tsx` | Expiring item notifications |
| Grocery List | `screens/GroceryListScreen.tsx` | Smart shopping list |
| What Can I Make | `screens/WhatCanIMakeScreen.tsx` | Recipes from available ingredients |
| Recipes | `screens/RecipesScreen.tsx` | Recipe library browser |
| Collections | `screens/CollectionsScreen.tsx` | Recipe organization |
| Subscription | `screens/SubscriptionScreen.tsx` | Premium paywall |
| Account | `screens/AccountScreen.tsx` | User settings |
| Auth | `screens/AuthScreen.tsx` | Sign in/up |
| Onboarding | `screens/OnboardingScreen.tsx` | New user tutorial |

## Design System

### Brand Colors (Editorial Palette)
```typescript
// theme/tokens/colors.ts - mangiaColors
terracotta: '#D97742'  // Primary accent, buttons, CTAs
sage: '#A8BCA0'        // Secondary accent, cards
cream: '#FBF9F5'       // Main background
creamDark: '#F5E3C1'   // Card backgrounds
editorialDark: '#3A322C' // Primary text
brown: '#7A716A'       // Secondary text
deepBrown: '#2A1F18'   // Cooking mode background
```

### Typography
- **Display/Headlines**: Georgia serif (editorial style)
- **Body text**: System fonts (SF Pro iOS, Roboto Android)
- **Key sizes**: display (34px), xxxl (28px), xxl (22px), xl (20px), lg (17px)

### Spacing (4px grid)
- xs: 4px | sm: 8px | md: 12px | lg: 16px | xl: 24px | xxl: 32px | xxxl: 48px

### Visual Style
- Magazine/editorial aesthetic with warm, earthy tones
- Glassmorphism effects (frosted glass cards, blurred headers)
- Rounded corners (8-32px radius)
- Featured recipe cards with gradient overlays
- Time stickers rotated at angle

## API Client

Singleton Axios client at `lib/api/client.ts`:
- Base URL from `EXPO_PUBLIC_API_URL`
- Auto-injects Clerk auth token via interceptor
- Handles 401 for session expiry
- 30s timeout

```typescript
import { apiClient } from './lib/api/client';
await apiClient.get<Recipe[]>('/recipes');
await apiClient.post<Recipe>('/recipes', { ...data });
```

## Authentication Flow

1. Clerk handles OAuth (Apple, Google) in `AuthScreen.tsx`
2. `ClerkTokenProvider` wraps app, injects token getter into API client
3. Token stored securely via `expo-secure-store` (`lib/clerk.ts`)
4. Backend validates Clerk JWT and syncs user to database
5. Premium status checked via RevenueCat

## Monetization (RevenueCat)

Integration in `lib/revenuecat.ts`:
- **Entitlement**: `premium`
- **Products**: `mangia_premium_monthly`, `mangia_premium_yearly`
- **Context**: `SubscriptionContext.tsx` manages state
- **Paywall**: `screens/SubscriptionScreen.tsx`

```typescript
// Check premium status
import { isPremiumUser, PREMIUM_ENTITLEMENT } from './lib/revenuecat';
const isPremium = await isPremiumUser();

// Purchase flow
import { purchasePackage, getOfferings } from './lib/revenuecat';
const offering = await getOfferings();
const result = await purchasePackage(offering.availablePackages[0]);
```

## Environment Variables

```bash
# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...

# API Backend
EXPO_PUBLIC_API_URL=https://mangia-api.vercel.app

# RevenueCat
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_...
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_...

# Recipe Extraction (at least one AI provider required)
EXPO_PUBLIC_FIRECRAWL_API_KEY=...        # Blog scraping
EXPO_PUBLIC_CLOUDFLARE_ACCOUNT_ID=...    # AI extraction (free tier)
EXPO_PUBLIC_CLOUDFLARE_API_TOKEN=...
EXPO_PUBLIC_GEMINI_API_KEY=...           # AI fallback
EXPO_PUBLIC_RAPIDAPI_KEY=...             # TikTok/YouTube transcripts

# API Server (apps/api/.env.local)
CLERK_SECRET_KEY=sk_test_...             # Clerk backend auth
DATABASE_URL=postgresql://...            # Neon PostgreSQL
GEMINI_API_KEY=...                       # Gemini Vision AI
ANTHROPIC_API_KEY=sk-ant-...             # Claude (comparison harness only)
```

## App Store / Fastlane

Fastlane configured in `fastlane/`:
- **Appfile**: Apple ID `adaminsley@gmail.com`, Team ID `6743126234`
- **Lanes**:
  - `upload_metadata` - Push metadata to App Store Connect
  - `upload_screenshots` - Push screenshots only
  - `beta` - Build and upload to TestFlight
  - `upload_testflight` - Upload existing IPA

```bash
# Upload metadata
cd fastlane && bundle exec fastlane upload_metadata

# Build & upload to TestFlight
bundle exec fastlane beta
```

## Website

Marketing site at `website/` deployed to `https://mangia-nu.vercel.app`:
- Landing page with app features
- Privacy policy
- Terms of service
- Support/FAQ page

URLs configured in `fastlane/metadata/en-US/`:
- `marketing_url.txt`: https://mangia-nu.vercel.app
- `privacy_url.txt`: https://mangia-nu.vercel.app/privacy
- `support_url.txt`: https://mangia-nu.vercel.app/support

## Quick Commands

```bash
# Development
pnpm start              # Start Expo dev server
pnpm ios                # Run on iOS simulator
pnpm android            # Run on Android emulator

# Native builds
npx expo prebuild --platform ios --clean  # Generate Xcode project
npx expo prebuild --platform android --clean

# EAS builds
eas build --platform ios
eas build --platform android

# Fastlane
cd fastlane && bundle exec fastlane beta  # Build & TestFlight
```

## Patterns & Conventions

### File Naming
- Components: PascalCase (`FeaturedRecipeCard.tsx`)
- Hooks: camelCase with `use` prefix (`usePremiumFeature.ts`)
- Utils: camelCase (`categorizeIngredient.ts`)
- Models: PascalCase (`Recipe.ts`)

### Component Organization
- Each domain folder has `index.ts` barrel export
- Components import theme via `useTheme()` hook
- Editorial components use Georgia font for headlines

### Styling
- Inline styles with theme tokens (no StyleSheet.create pattern)
- Colors from `theme.colors.*`
- Spacing from `theme.spacing.*`
- Typography styles from `theme.typography.*`

### Navigation
- All navigators use native stack
- Tab navigator has 4 tabs: Home, Pantry, Shopping, Recipes
- Floating action button for quick add in tab bar

## Common Gotchas

1. **Theme Colors**: Use semantic colors (`theme.colors.primary`) not palette directly
2. **API Calls**: Always await API client methods, handle errors
3. **Recipe Import**: URL parsing happens server-side, client shows progress
4. **Cooking Mode**: Uses `expo-keep-awake` to prevent screen sleep
5. **Voice Control**: Only available in cooking mode with premium
6. **Animations**: All animations use native driver for 60fps
7. **DEV_BYPASS_AUTH**: Set in `lib/devConfig.ts` to skip auth during development
8. **Fastlane credentials**: Stored in macOS Keychain, clear with `security delete-internet-password`

## Domain Concepts

| Term | Meaning |
|------|---------|
| Recipe Queue | Recipes marked "Want to Cook" |
| Cooking Mode | Step-by-step guided cooking experience |
| Smart Grocery | List that deducts pantry items automatically |
| What Can I Make | Recipes filtered by available pantry ingredients |
| Collections | User-created recipe folders |
| Mise en Place | Ingredient prep checklist before cooking |

## Key Workflows

### Recipe Import Flow
1. User pastes URL (TikTok, YouTube, blog) in `ImportRecipeScreen`
2. Backend extracts recipe via Firecrawl + AI
3. Progress shown on `RecipeImportProgressScreen`
4. Recipe added to library with "Want to Cook" status

### Cooking Flow
1. Start from recipe detail → Cooking Mode
2. Mise en place checklist (ingredient prep)
3. Step-by-step with voice reading option
4. Timer per step
5. Mark complete → update times_cooked, last_cooked_at

### Grocery List Flow
1. Add recipes to "Want to Cook"
2. Generate grocery list → auto-deducts pantry items
3. Check off items while shopping
4. Move purchased items to pantry

### Pantry Scanning Flow
1. Open AI Scanner from Pantry screen (premium only)
2. Point camera at pantry/fridge (expo-camera, 0.7 quality JPEG)
3. `POST /api/pantry/scan` → Gemini 2.5 Flash-Lite vision API
4. AI returns items with name, quantity, unit, expiry date
5. Items auto-categorized via `categorizeIngredient()`
6. Confirm/edit items on `ConfirmScannedItemsScreen`
7. Each selected item → `POST /api/pantry` to create

### Vision Model Comparison (Dev Tool)
- CLI: `npx tsx scripts/compare-vision.ts <image>`
- API: `POST /api/pantry/scan-compare`
- Models: Gemini 2.0 Flash, 2.5 Flash, 2.5 Flash-Lite, 2.5 Pro, Claude Sonnet
- Runs all models in parallel, returns side-by-side results
- Used to evaluate model quality (Flash-Lite won: fastest, cheapest, highest confidence)
