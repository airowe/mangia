# @mangia/api

Hono API deployed to Vercel with native Hono support. TypeScript 5.9, Drizzle ORM, Neon PostgreSQL.

## Stack

- **Framework**: Hono 4.x with `basePath("/api")` — Vercel detects `app.ts` default export automatically
- **Database**: Neon PostgreSQL via Drizzle ORM (`db/schema.ts`)
- **Auth**: Clerk JWT verification (`middleware/auth.ts`)
- **Validation**: Zod schemas
- **Errors**: `ApiError` class + `errorHandler` middleware
- **Vision AI**: Gemini 2.5 Flash-Lite for pantry scanning (`lib/pantry-scanner.ts`)

## Commands

```bash
pnpm dev:api            # Hono dev server (port 3001) via @hono/node-server
pnpm typecheck          # tsc --noEmit
pnpm db:migrate         # Run Drizzle migrations
```

## API Route Conventions

Routes are defined in `routes/` and mounted in `app.ts`:

```typescript
// app.ts
const app = new Hono().basePath("/api");
app.route("/recipes", recipesRoutes);
app.route("/pantry", pantryRoutes);
app.route("/grocery-lists", groceryListsRoutes);
```

Each route file exports a Hono instance:

```typescript
// routes/recipes.ts
const recipesRoutes = new Hono();
recipesRoutes.get("/", async (c) => { ... });
recipesRoutes.get("/:id", async (c) => { ... });
recipesRoutes.post("/", async (c) => { ... });
```

## Deployment

Vercel natively detects `app.ts` exporting a Hono instance — no catch-all handler or `@vercel/node` needed. Configuration in `vercel.json` is minimal (just buildCommand and outputDirectory).

## Patterns

- All DB queries go through Drizzle ORM — never raw SQL
- Auth: Clerk JWT middleware -> extract userId -> pass to queries
- Errors: throw `ApiError` with status code, caught by `errorHandler` middleware
- Validation: Zod schemas validated in route handlers
- CORS: `hono/cors` middleware applied globally

## Key Files

- `app.ts` — Hono app with basePath, middleware, and route mounts
- `server.ts` — Local dev server using `@hono/node-server`
- `routes/` — Route handlers (recipes, pantry, grocery-lists, etc.)
- `middleware/` — Auth, error handling
- `db/` — Drizzle schema + client
- `lib/` — Utilities, AI scanners, validation
