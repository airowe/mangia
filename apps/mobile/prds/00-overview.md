# Mangia UI Redesign - PRD Overview

## Project Summary

Complete UI overhaul of Mangia recipe app to match the editorial magazine-style designs in `/ui-redesign/screens/`. The goal is pixel-perfect replication of the HTML prototypes.

## Design Source of Truth

All designs are located in `/ui-redesign/screens/`:
- `onboarding_problem_solution.html`
- `onboarding_features.html`
- `onboarding_get_started.html`
- `paywall_screen.html`
- `home_screen.html`
- `recipe_detail.html`
- `cooking_mode.html`

## Design System

### Colors (CSS Variables)
```
--mangia-terracotta: #D97742  (Primary)
--mangia-sage: #A8BCA0        (Secondary/Success)
--mangia-cream: #FBF9F5       (Background)
--mangia-cream-dark: #F5E3C1  (Card backgrounds)
--mangia-dark: #3A322C        (Primary text)
--mangia-brown: #7A716A       (Secondary text)
--mangia-deep-brown: #2A1F18  (Dark mode/Cooking mode)
--mangia-taupe: #A9A29A       (Tertiary text)
```

### Typography
- **Serif (Georgia)**: Headlines, recipe titles, large display text
- **Sans-serif (System)**: Body text, labels, buttons
- **Uppercase tracking**: Labels use `tracking-widest` (letter-spacing)

### Key Design Elements
- Rounded corners: `rounded-full` for buttons, `rounded-2xl` for cards, `rounded-[32px]` for featured cards
- Sticker tags: Rotated circular badges with `rotate-12`
- Glass tab bar: `backdrop-blur-xl` with `bg-white/80`
- Floating FAB: Centered "+" button that extends above tab bar

## Navigation Changes

**Tab Bar (4 tabs + FAB):**
1. Home (lucide:home)
2. Pantry (lucide:box)
3. **Shopping** (lucide:shopping-cart) - REPLACES Planner
4. Recipes (lucide:book-open)
5. Center FAB (+) - Opens quick add menu

## PRD Execution Order

1. **PRD-01**: Design System Foundation (tokens, theme provider)
2. **PRD-02**: Tab Bar & Navigation Redesign
3. **PRD-03**: Home Screen (Want to Cook)
4. **PRD-04**: Recipe Detail Screen
5. **PRD-05**: Cooking Mode Screen
6. **PRD-06**: Onboarding Flow (3 screens)
7. **PRD-07**: Paywall Screen
8. **PRD-08**: Shopping List Screen (new)
9. **PRD-09**: Pantry Screen Refresh
10. **PRD-10**: Recipes Library Screen

## Success Criteria

- [ ] All screens visually match HTML prototypes
- [ ] Colors use exact hex values from design system
- [ ] Typography uses Georgia serif for headlines
- [ ] Tab bar has glass blur effect with floating FAB
- [ ] Cooking mode uses warm deep brown background
- [ ] All buttons are pill-shaped (rounded-full)
- [ ] No purple Material Design colors anywhere
