# PRD-06: Onboarding Flow

## Objective

Implement the 3-screen onboarding flow with editorial poster-style design, benefit cards, and social authentication.

## Reference

- `/ui-redesign/screens/onboarding_problem_solution.html`
- `/ui-redesign/screens/onboarding_features.html`
- `/ui-redesign/screens/onboarding_get_started.html`

## Screen 1: Problem/Solution

### Design Specifications

```
Background: cream (#FBF9F5)

Header:
  - Padding: pt-14 px-6
  - "Skip" button (right): terracotta, font-semibold, text-sm, uppercase

Decorative shapes:
  - Circle: top-20 -left-10, 160px, creamDark, opacity-60
  - Rounded shape: top-1/4 right-[-20px], 128px, sage, opacity-20

Hero image container:
  - Aspect ratio: 4:5
  - Max-height: 420px
  - Transform: rotate-[-2deg]

  Poster frame:
    - Border: 4px dark
    - Border-radius: rounded-t-[140px] rounded-b-[40px]
    - Overflow: hidden
    - Shadow: xl
    - Contains hero image

  Sticker tag:
    - Position: absolute -bottom-6 -right-2
    - Terracotta circle, 96px
    - Rotated 12deg
    - "No More\nMess" text (white, bold, uppercase)
    - Border: 2px white

Text content:
  - Max-width: 320px
  - Centered

  Headline:
    - "Stop the screenshot chaos."
    - 32px, serif
    - "screenshot" in italic terracotta

  Body:
    - "Your recipes are scattered everywhere..."
    - Brown text, text-lg, leading-relaxed

Footer:
  - Padding: p-8 pb-12

  Pagination dots:
    - Active: 32x10, rounded-full, dark
    - Inactive: 10x10, rounded-full, creamDark

  CTA: "Organize My Kitchen"
    - Full width, 56px height
    - Terracotta background
    - Rounded-full
    - Font-semibold, text-lg
```

## Screen 2: Features

### Design Specifications

```
Similar header and footer to Screen 1

Main content:
  - Benefits grid with mixed corner radius cards
  - "Italian Market" poster aesthetic

  Benefit card styling:
    - Mixed radii: rounded-[24px] rounded-tl-[8px]
    - Border: 2px dark
    - Background: varies (white, sage/10, terracotta/10)
    - Padding: p-5

  Each card:
    - Icon in colored circle
    - Title (font-bold, dark)
    - Description (brown, text-sm)

Benefits:
  1. "Import Anything" - link icon, sage accent
  2. "Hands-Free Cooking" - chef-hat icon, terracotta accent
  3. "Smart Shopping" - shopping-cart icon, dark accent

Pagination: dot 2 active

CTA: "Continue"
```

## Screen 3: Get Started

### Design Specifications

```
Background: cream

Hero area:
  - Large background image (cooking scene)
  - Rounded bottom: rounded-b-[60px]
  - Gradient overlay

Content card:
  - White background
  - Rounded-top: rounded-t-[32px]
  - Overlap hero: -mt-8
  - Shadow

Social proof pill:
  - "Join 50,000+ home cooks"
  - Dark background, cream text
  - Rounded-full

Headline: "Your recipes.\nOne beautiful home."
  - Serif, 28px, dark
  - Centered

Auth buttons:
  - Full width, 56px height
  - Rounded-full
  - Gap: space-y-3

  Apple: Black background, white text, Apple icon
  Google: White background, dark border, Google icon
  Email: creamDark background, dark text, mail icon

Legal text:
  - text-xs, brown, opacity-60
  - Terms and privacy policy links
```

## Tasks

### 1. Create OnboardingScreen.tsx

Horizontal pager with 3 screens:
- Use FlatList with pagingEnabled
- Or use a pager library (react-native-pager-view)

### 2. Create Onboarding Components

**OnboardingProblemSolution.tsx:**
- Poster frame with rotated image
- Sticker badge
- Mixed typography headline

**OnboardingFeatures.tsx:**
- Benefits cards grid
- Mixed corner radius cards
- Icon + text layout

**OnboardingGetStarted.tsx:**
- Hero image
- Social auth buttons
- Clerk integration

**PaginationDots.tsx:**
- Reusable pagination indicator
- Animated active state

### 3. Integrate with Clerk Auth

Connect social auth buttons:
- Apple Sign In
- Google Sign In
- Email/Password option

### 4. Add Skip Flow

- "Skip" navigates to Get Started screen
- Get Started → Paywall or Home

## Files to Create

- `screens/OnboardingScreen.tsx`
- `components/onboarding/OnboardingProblemSolution.tsx`
- `components/onboarding/OnboardingFeatures.tsx`
- `components/onboarding/OnboardingGetStarted.tsx`
- `components/onboarding/PaginationDots.tsx`

## Files to Modify

- `App.tsx` - Add onboarding to navigation flow
- Check first launch state

## Acceptance Criteria

- [ ] 3-screen horizontal pager
- [ ] Poster frame has asymmetric border radius
- [ ] Sticker badge rotated 12 degrees
- [ ] "screenshot" word in italic terracotta
- [ ] Benefit cards have mixed corner radii
- [ ] Pagination dots animate between screens
- [ ] Social auth buttons work with Clerk
- [ ] Skip button navigates to final screen
- [ ] Proper safe area handling
