# Mangia

> From saved recipe to dinner made

Mangia is a recipe management app that bridges the gap between discovering recipes online and actually cooking them. Import recipes from any URL (blogs, YouTube, TikTok), track your pantry, and generate smart grocery lists that know what you already have.

## Features

### Core Features
- **Recipe Import**: Paste any recipe URL and automatically extract ingredients and instructions
- **Video URL Support**: Import recipes from YouTube and TikTok videos
- **Smart Grocery Lists**: Generate consolidated shopping lists from multiple recipes
- **Pantry Tracking**: Track what ingredients you have on hand
- **Pantry Deduction**: Grocery lists automatically subtract what's in your pantry

### Premium Features
- **Unlimited Recipe Imports**: Free tier limited to 3 imports/month
- **"What Can I Make?"**: Find recipes you can make with ingredients on hand
- **Cookbook Collection**: Track your physical cookbook collection
- **Grocery List Export**: Share lists via text, email, or other apps
- **Recipe Collections**: Organize recipes into custom folders
- **Cooking Mode**: Step-by-step guided cooking experience
- **Meal Planning**: Plan meals for the week

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native (Expo 53) |
| Language | TypeScript |
| UI Components | React Native Paper |
| Backend | Supabase (Auth, Postgres) |
| AI | Claude API (ingredient parsing) |
| Scraping | Firecrawl (recipe extraction) |
| Payments | RevenueCat |
| Navigation | React Navigation |

## Architecture

```
┌─────────────────────────────────────────┐
│           React Native (Expo 53)        │
│              iOS App                    │
├─────────────────────────────────────────┤
│              Services Layer             │
│  ┌─────────┐ ┌─────────┐ ┌───────────┐ │
│  │ Recipe  │ │ Grocery │ │ Pantry    │ │
│  │ Parser  │ │ List    │ │ Service   │ │
│  └────┬────┘ └────┬────┘ └─────┬─────┘ │
├───────┼──────────┼─────────────┼───────┤
│       │    Supabase            │       │
│       │   (Auth + Database)    │       │
├───────┼──────────┼─────────────┼───────┤
│ External APIs:                         │
│ • Firecrawl (recipe extraction)        │
│ • Claude API (ingredient parsing)      │
│ • RevenueCat (subscriptions)           │
└─────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Expo CLI
- iOS Simulator or physical device

### Environment Variables

Create a `.env` file with the following:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_FIRECRAWL_API_KEY=your_firecrawl_key
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_claude_api_key
EXPO_PUBLIC_REVENUECAT_API_KEY=your_revenuecat_key
```

### Installation

```bash
# Clone the repository
git clone https://github.com/airowe/mangia.git
cd mangia

# Install dependencies
pnpm install

# Start the development server
pnpm start

# Run on iOS
pnpm ios
```

### Database Setup

Run the Supabase migrations in order:

```bash
# In Supabase SQL editor, run migrations from:
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_recipes.sql
supabase/migrations/003_pantry.sql
supabase/migrations/004_collections.sql
supabase/migrations/005_cookbooks.sql
```

## Project Structure

```
mangia/
├── components/          # Reusable UI components
├── contexts/           # React contexts (auth, subscription)
├── hooks/              # Custom React hooks
├── lib/                # Service layer and API clients
├── models/             # TypeScript interfaces
├── navigation/         # React Navigation stacks
├── screens/            # Screen components
├── supabase/           # Database migrations
├── theme/              # Colors and styling
└── utils/              # Utility functions
```

## Monetization

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 3 recipes/month, basic grocery list, manual pantry |
| Premium | $4.99/mo or $29.99/yr | Unlimited imports, smart pantry, "What Can I Make?", collections, export |

## RevenueCat Integration

- **Products**: `mangia_premium_monthly`, `mangia_premium_yearly`
- **Entitlement**: `premium`
- **Paywall Triggers**: 4th recipe import, premium feature access

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Adam Rowe**
- GitHub: [@airowe](https://github.com/airowe)
- LinkedIn: [adamrowe](https://linkedin.com/in/adamrowe)

---

Built for the [RevenueCat Shipyard 2026 Hackathon](https://revenuecat-shipyard-2026.devpost.com/) - Eitan Bernath Creator Brief
