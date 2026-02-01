# Feature Development Workflow

## Task

[DESCRIBE YOUR FEATURE HERE]

---

## Phase 1: QPLAN

Before writing any code:

1. Read `.claude/codebase-context.md` for project context
2. Search codebase for similar implementations
3. Identify files that need modification
4. Check existing patterns and conventions
5. Plan minimal, isolated changes
6. List dependencies and potential impacts

**Deliverable:** Brief plan in TodoWrite

---

## Phase 2: TDD Cycle

Follow Test-Driven Development where applicable:

### Step 1: Stub

- Create function/component stubs with correct signatures
- Define types/interfaces first
- Export from appropriate modules

### Step 2: Failing Test

- Write test BEFORE implementation
- Test should fail with meaningful error
- Cover: happy path, edge cases, error cases
- Colocate in `*.spec.ts` next to source

### Step 3: Implement

- Write minimal code to pass the test
- No over-engineering
- Follow existing code patterns (see `apps/mobile/CLAUDE.md` or `apps/api/CLAUDE.md`)

### Step 4: Green

- Run tests
- All tests must pass
- If failing, iterate until green

**Repeat for each piece of functionality.**

---

## Phase 3: Quality Gates

Run all gates - ALL must pass:

```bash
pnpm typecheck  # 0 errors required
pnpm lint       # 0 errors required
```

If any fail:

1. Fix the issues
2. Re-run gates
3. Do not proceed until all pass

---

## Phase 4: Security Review

Check for OWASP Top 10 vulnerabilities:

### Input Validation

- [ ] All user inputs sanitized
- [ ] SQL injection prevented (Drizzle ORM parameterized queries)
- [ ] XSS prevented (output encoding)

### Authentication & Authorization

- [ ] Clerk auth checks on all protected API routes
- [ ] No sensitive data in URLs/logs
- [ ] Token handling secure

### Data Protection

- [ ] No secrets in code
- [ ] No API keys exposed to client

**If any security issues found:** Fix immediately before proceeding.

---

## Phase 5: Code Review (Enhanced QCHECK)

Score each category 0-10:

### Functions (target avg: 9+)

- [ ] Readable without comments
- [ ] Low cyclomatic complexity
- [ ] No unused parameters
- [ ] Easily testable
- [ ] No hidden dependencies
- [ ] Clear, domain-appropriate names

### Implementation (target avg: 9+)

- [ ] Follows existing patterns
- [ ] Consistent naming
- [ ] Simple, composable functions
- [ ] Minimal comments
- [ ] Isolated changes
- [ ] No TODO comments

**Calculate total score:** (sum of all scores) / (number of items) * 10
**Target:** >= 92/100

---

## Phase 6: Final Verification

Before completion:

1. Re-run all quality gates one final time
2. Verify no regressions introduced
3. Check git diff for unintended changes
4. Ensure commit message follows Conventional Commits

---

## Success Criteria

ALL must be true:

- [ ] Quality gates pass (0 errors)
- [ ] QCHECK score >= 92/100
- [ ] Security review passes
- [ ] Code follows CLAUDE.md best practices

---

## Completion

When ALL criteria are met, stage changes and wait for user commit approval, then output:

```
<promise>FEATURE COMPLETE - QCHECK SCORE: [score]/100</promise>
```
