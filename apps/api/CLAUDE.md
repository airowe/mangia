# @mangia/api

Vercel serverless API. TypeScript 5.9, Drizzle ORM, Neon PostgreSQL.

## Stack

- **Runtime**: Vercel serverless functions (file-based routing in `api/`)
- **Database**: Neon PostgreSQL via Drizzle ORM (`db/schema.ts`)
- **Auth**: Clerk JWT verification (`lib/auth.ts`)
- **Validation**: Zod schemas (`lib/validation.ts`, `lib/schemas.ts`)
- **Errors**: `ApiError` class + `handleError` helper (`lib/errors.ts`)
- **AI Vision**: Gemini 2.5 Flash-Lite for pantry scanning (`lib/pantry-scanner.ts`)

## Commands

```bash
pnpm dev                # Vercel dev server
pnpm typecheck          # tsc --noEmit
pnpm db:migrate         # Run Drizzle migrations
```

## API Route Conventions

Routes live in `api/` following Vercel file-based routing:
- `api/pantry/index.ts` — GET (list), POST (create)
- `api/pantry/[id].ts` — PATCH (update), DELETE (remove)
- `api/pantry/scan.ts` — POST AI vision scan

Each handler validates with Zod, authenticates via Clerk, and returns JSON with proper error codes.

## Patterns

- All DB queries go through Drizzle ORM — never raw SQL
- Auth: verify Clerk JWT → extract userId → pass to queries
- Errors: throw `ApiError` with status code, caught by `handleError`
- Validation: Zod schemas in `lib/schemas.ts`, validated via `lib/validation.ts`
