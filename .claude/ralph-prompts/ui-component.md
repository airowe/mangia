# UI Component Workflow

## Task

[DESCRIBE THE UI COMPONENT/CHANGE HERE]

---

## Phase 1: QPLAN

Before writing any code:

1. Read `.claude/codebase-context.md` and `apps/mobile/CLAUDE.md` for context
2. Check existing components in `apps/mobile/components/`
3. Review design system (theme tokens, editorial aesthetic)
4. Identify reusable components vs new ones
5. Plan component hierarchy

**Design Guidelines (from mobile CLAUDE.md):**

- Editorial/magazine aesthetic with warm, earthy tones
- Use `useTheme()` hook — never hardcode colors
- Inline styles with theme tokens, not `StyleSheet.create`
- Cards should feel tactile with subtle shadows
- Animations should feel natural and purposeful

**Deliverable:** Component plan in TodoWrite

---

## Phase 2: Implementation

### Step 1: Define Types

```typescript
type MyComponentProps = {
  // Define props interface first
};
```

### Step 2: Implement Component

- Start with structure (JSX)
- Add styling (inline with theme tokens)
- Add animations (Reanimated `entering`/`exiting` props)
- Add interactivity (haptics via `expo-haptics`)

### Step 3: Verify

```bash
pnpm typecheck
```

---

## Phase 3: Quality Gates

Run all gates - ALL must pass:

```bash
pnpm typecheck  # 0 errors required
pnpm lint       # 0 errors required
```

---

## Phase 4: UI Review Checklist

### Visual Review

- [ ] Component renders correctly
- [ ] Matches Mangia editorial aesthetic
- [ ] Uses theme tokens (terracotta, sage, cream, deep brown)
- [ ] Typography uses Georgia serif for headlines
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Empty states handled

### Interactions

- [ ] Touch handlers work with haptic feedback
- [ ] Animations smooth (Reanimated, no jank)
- [ ] No layout shifts
- [ ] Proper `activeOpacity` on TouchableOpacity

### Platform Considerations

- [ ] Safe area insets handled where needed
- [ ] Works on different screen sizes
- [ ] Tab bar doesn't overlap content (use `TabBarLayoutContext` if needed)

---

## Phase 5: Code Review (UI-Focused QCHECK)

Score each 0-10:

### Component Quality

- [ ] Single responsibility
- [ ] Props well-defined with TypeScript types
- [ ] `React.memo` if used in lists
- [ ] Reusable where appropriate

### Styling Quality

- [ ] Uses `useTheme()` hook
- [ ] No hardcoded colors or spacing
- [ ] Consistent with existing components
- [ ] Inline styles (not StyleSheet.create)

### Performance

- [ ] No unnecessary re-renders
- [ ] Proper memoization if needed
- [ ] Images use `expo-image`

**Target:** >= 92/100

---

## Success Criteria

ALL must be true:

- [ ] Quality gates pass (0 errors)
- [ ] QCHECK score >= 92/100
- [ ] UI checklist complete
- [ ] Matches editorial design aesthetic

---

## Completion

When ALL criteria are met, stage changes and wait for user commit approval:

```
feat(mobile): add ComponentName for [purpose]
```

Then output:

```
<promise>UI COMPLETE - QCHECK SCORE: [score]/100</promise>
```
