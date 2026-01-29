# Mangia API

Backend API for the Mangia recipe app. Built with Vercel Functions, Neon PostgreSQL, and Clerk authentication.

## Tech Stack

- **Runtime:** Vercel Serverless Functions
- **Database:** Neon PostgreSQL
- **ORM:** Drizzle ORM
- **Auth:** Clerk

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
```

### 3. Run database migrations

```bash
# Generate migrations from schema
pnpm drizzle-kit generate

# Apply migrations to Neon
pnpm db:migrate
```

### 4. Run locally

```bash
pnpm dev
```

## API Endpoints

### Auth (handled by Clerk on client)

All endpoints require `Authorization: Bearer <clerk_token>` header.

### Recipes

- `GET /api/recipes` - List user's recipes
- `POST /api/recipes` - Create recipe
- `GET /api/recipes/:id` - Get single recipe
- `PATCH /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Pantry

- `GET /api/pantry` - List pantry items
- `POST /api/pantry` - Add pantry item
- `PATCH /api/pantry/:id` - Update pantry item
- `DELETE /api/pantry/:id` - Delete pantry item

### Collections

- `GET /api/collections` - List collections
- `POST /api/collections` - Create collection

### Cookbooks (Premium)

- `GET /api/cookbooks` - List cookbooks
- `POST /api/cookbooks` - Add cookbook

## Deployment

```bash
vercel --prod
```

## Database Schema

See `db/schema.ts` for the complete Drizzle schema.
