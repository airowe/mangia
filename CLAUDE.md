# Mangia - Project Instructions

## CRITICAL: Read Codebase Context First

**BEFORE using Glob, Grep, or exploring the codebase, you MUST:**

1. Read `.claude/codebase-context.md` - contains pre-built project context
2. Run `.claude/check-context-freshness.sh` - verify context is current

**DO NOT** use file search tools (Glob, Grep, Task with Explore agent) until you have read the context file. The context file contains:
- Complete directory structure with file purposes
- Key files organized by feature
- Patterns, conventions, and code style
- Database schema and domain concepts
- Quick commands and common gotchas

If the freshness check returns "STALE", regenerate context before proceeding:
```
/codebase-context
```

This saves tokens and ensures accurate understanding of the codebase.

---

## Project Overview

**Mangia** is a React Native / Expo recipe management app with:
- Recipe import from URLs (TikTok, YouTube, blogs)
- Pantry inventory tracking
- Smart grocery lists
- Cooking mode with voice control
- Meal planning

## Tech Stack

- **Framework**: React Native 0.81.5 + Expo SDK 54
- **Language**: TypeScript 5.9
- **Auth**: Clerk
- **Backend**: Supabase
- **Monetization**: RevenueCat

## Design System

Brand colors (editorial/magazine aesthetic):
- **Terracotta**: `#D97742` (primary)
- **Sage**: `#A8BCA0` (secondary)
- **Cream**: `#FBF9F5` (background)
- **Editorial Dark**: `#3A322C` (text)

Typography: Georgia serif for headlines, system fonts for body.

## Quick Commands

```bash
pnpm start              # Start Expo dev server
pnpm ios                # Run on iOS simulator
pnpm android            # Run on Android emulator
```

## Important Rules

- Do not commit changes without running QCHECK first
- Always ask for approval before committing
- Let user run terminals for app and server to view logs
- Never commit code without explicit user approval
