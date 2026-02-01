# Refactoring Workflow

## Task

[DESCRIBE THE REFACTORING GOAL HERE]

---

## Phase 1: QPLAN - Understand Before Changing

Before refactoring:

1. Read `.claude/codebase-context.md` for project context
2. Understand the current implementation thoroughly
3. Identify all callers/dependencies
4. Document current behavior (this IS the spec)
5. Identify what should NOT change
6. Plan incremental, reversible steps

**Key Principle:** Refactoring changes structure, NOT behavior.

**Deliverable:** Refactoring plan in TodoWrite

---

## Phase 2: Ensure Test Coverage First

### Step 1: Audit Existing Tests

- What's already tested?
- What's missing coverage?
- Are tests testing behavior or implementation?

### Step 2: Add Missing Tests BEFORE Refactoring

```typescript
describe('existingFunction', () => {
  // Add tests that document current behavior
  // These become your safety net
  it('preserves existing behavior X', () => { ... });
});
```

### Step 3: Verify All Tests Pass

**DO NOT proceed until you have confidence in test coverage.**

---

## Phase 3: Incremental Refactoring

### Small Steps

1. Make ONE small change
2. Run typecheck
3. If green, continue
4. If red, revert and try smaller step

### Safe Refactoring Patterns

- Extract function/variable
- Inline function/variable
- Rename
- Move to new file
- Introduce parameter object

### Unsafe Patterns (Avoid)

- Big bang rewrites
- Multiple changes at once
- Changing behavior "while we're here"
- Deleting tests that "don't apply anymore"

---

## Phase 4: Quality Gates

Run after EVERY change - ALL must pass:

```bash
pnpm typecheck  # 0 errors required
pnpm lint       # 0 errors required
```

**If any test fails:** Your refactoring changed behavior. Revert.

---

## Phase 5: Code Review (Refactoring QCHECK)

Score each 0-10:

### Behavior Preservation

- [ ] All existing tests still pass
- [ ] No functional changes
- [ ] API contracts unchanged

### Code Quality Improvement

- [ ] Readability improved
- [ ] Complexity reduced
- [ ] Duplication removed
- [ ] Better naming

### Architecture

- [ ] Follows project patterns
- [ ] Proper file organization
- [ ] Dependencies simplified

### Safety

- [ ] Incremental changes
- [ ] Each step reversible
- [ ] No big bang changes

**Target:** >= 92/100

---

## Success Criteria

ALL must be true:

- [ ] ALL existing tests pass (behavior preserved)
- [ ] Quality gates pass (0 errors)
- [ ] QCHECK score >= 92/100
- [ ] No functional changes (only structural)
- [ ] Code is measurably better

---

## Completion

When ALL criteria are met, stage changes and wait for user commit approval:

```
refactor(scope): description of structural change
```

Then output:

```
<promise>REFACTOR COMPLETE - QCHECK SCORE: [score]/100</promise>
```
