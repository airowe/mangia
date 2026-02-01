# Claude Code Instructions for Mangia

## Codebase Context

**Read `.claude/codebase-context.md` when you need to understand the project structure, find key files, or learn conventions.** This file contains pre-built context about directory layout, key files by feature, patterns, tech stack, and gotchas.

Do NOT read it for trivial tasks (typos, small edits, quick questions). Only read it when you genuinely need project context — e.g., implementing a new feature, debugging across files, or understanding architecture.

## Project-Specific Rules

1. **Always ask for commit approval** - User must explicitly approve commits
2. **Always run QCHECK before presenting completed work** - Self-review all major code changes
3. **Never push code with type errors** - `pnpm typecheck` must pass with zero errors
4. **Use Conventional Commits** - https://www.conventionalcommits.org/en/v1.0.0

## Quick Reference

- **Mobile app:** `apps/mobile/`
- **API:** `apps/api/`
- **Shared types:** `packages/shared/`
- **Codebase context:** `.claude/codebase-context.md`
- **Ralph Loop prompts:** `.claude/ralph-prompts/`
- **Agent definitions:** `.claude/agents/`
- **Command templates:** `.claude/commands/`
