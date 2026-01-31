# Mangia

Recipe management app: import recipes from URLs, track pantry inventory, generate grocery lists, cook step-by-step with voice. React Native/Expo mobile + Vercel serverless API.

## Monorepo

pnpm workspaces + Turborepo. Two packages:

- `apps/mobile` — React Native / Expo SDK 54 mobile app
- `apps/api` — Hono API deployed to Vercel (Drizzle ORM + Neon PostgreSQL)

See each package's `CLAUDE.md` for package-specific guidance.
For full project structure and workflows, see `.claude/codebase-context.md`.

## Commands

```bash
pnpm typecheck          # Typecheck all packages
pnpm lint               # Lint all packages
pnpm start:mobile       # Expo dev server
pnpm dev:api            # Hono dev server (port 3001)
pnpm ios                # iOS simulator
```

## Rules

- Never commit without explicit user approval — run QCHECK first

## Shortcuts

### QCHECK
Skeptical senior engineer analysis for every major code change:

1. **Functions** — Score (0-10): Readability, Complexity, Data structures, No unused params, Testability, No hidden deps, Good naming
2. **Tests** — Score (0-10): Parameterized inputs, Tests real defects, Clear descriptions, Pre-computed expectations, Style rules, Edge cases
3. **Implementation** — Score (0-10): Clarifying questions, Critical thinking, Approach confirmed, Consistent naming, Simple functions, Minimal comments, Isolated changes, No TODOs
4. **Tooling** — Run: `pnpm typecheck && pnpm lint`
5. **Quality Score** — Average all scores (target: >= 92/100)
6. **Must** ask for confirmation before committing

### QPLAN
Analyze similar parts of the codebase. Ensure plan is consistent, minimal, and reuses existing code.

### QCODE
Implement plan and verify tests pass. Run: `pnpm typecheck && pnpm lint`

### QGIT
Stage, commit (Conventional Commits), push. Must achieve QCHECK >= 92 first.

## Domain Concepts

| Term | Meaning |
|------|---------|
| Recipe Queue | Recipes marked "Want to Cook" |
| Cooking Mode | Step-by-step guided cooking with voice/timers |
| Smart Grocery | List that auto-deducts pantry items |
| What Can I Make | Recipes filtered by available pantry ingredients |
| Collections | User-created recipe folders |
