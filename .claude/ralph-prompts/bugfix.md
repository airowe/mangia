# Bug Fix Workflow

## Task

[DESCRIBE THE BUG HERE - include reproduction steps if known]

---

## Phase 1: Investigate

Before fixing:

1. Read `.claude/codebase-context.md` for project context
2. Reproduce the bug (understand the failure)
3. Identify root cause (not just symptoms)
4. Check if similar bugs exist elsewhere
5. Understand the intended behavior
6. Check for related tests that should have caught this

**Deliverable:** Root cause identified in TodoWrite

---

## Phase 2: TDD - Write Failing Test First

### Step 1: Reproduce in Test

- Write a test that FAILS due to the bug
- Test should demonstrate the exact broken behavior
- Include edge cases that might be related

### Step 2: Verify Test Fails

- Run tests
- Confirm the new test fails
- Failure message should indicate the bug

---

## Phase 3: Implement Fix

### Minimal Fix

- Fix ONLY the bug - no refactoring
- No "while I'm here" improvements
- Isolated, focused change

### Verify Fix

- Run tests
- New test should now PASS
- All existing tests should still PASS

---

## Phase 4: Quality Gates

Run all gates - ALL must pass:

```bash
pnpm typecheck  # 0 errors required
pnpm lint       # 0 errors required
```

---

## Phase 5: Security Review

Check if the bug had security implications:

- [ ] Input validation failure?
- [ ] Authentication/authorization bypass?
- [ ] Data exposure?

Does the fix introduce new risks?

- [ ] No new attack vectors
- [ ] No regression in security controls
- [ ] Error handling doesn't leak info

---

## Phase 6: Code Review (Focused QCHECK)

Score each 0-10:

### Fix Quality

- [ ] Addresses root cause (not symptoms)
- [ ] Minimal, isolated change
- [ ] No side effects
- [ ] Follows existing patterns

### Test Quality

- [ ] Test reproduces the exact bug
- [ ] Test will catch regression
- [ ] Edge cases considered

### Regression Check

- [ ] No existing tests broken
- [ ] No unintended behavior changes

**Target:** >= 92/100

---

## Success Criteria

ALL must be true:

- [ ] Bug is fixed (verified by new test)
- [ ] Quality gates pass (0 errors)
- [ ] QCHECK score >= 92/100
- [ ] No regressions introduced

---

## Completion

When ALL criteria are met, stage changes and wait for user commit approval:

```
fix(scope): brief description of bug fix
```

Then output:

```
<promise>BUG FIXED - QCHECK SCORE: [score]/100</promise>
```
