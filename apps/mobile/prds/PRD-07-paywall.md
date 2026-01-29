# PRD-07: Paywall Screen

## Objective

Implement the Mangia Pro paywall with benefit cards, plan selection toggle, and trial CTA.

## Reference

`/ui-redesign/screens/paywall_screen.html`

## Design Specifications

### Screen Layout

#### 1. Header Image Area (`#header-area_030`)
```
Height: 280px
Width: full

Image:
  - High-end dinner table setting
  - object-cover
  - Border-radius: rounded-b-[60px]

Overlay:
  - Black/20

Close button:
  - Position: absolute top-14 right-6
  - 32x32, rounded-full
  - bg-white/20, backdrop-blur-md
  - X icon (white)
  - Navigates to home

"Mangia Pro" badge:
  - Position: absolute -bottom-4 left-1/2 -translate-x-1/2
  - Dark background, cream text
  - Padding: px-6 py-2
  - Rounded-full
  - Border: 2px cream
  - Shadow: lg
  - Serif font, font-bold, text-lg
```

#### 2. Scrollable Content
```
Flex-1, flex-col
Padding: px-6 pt-10

Headline:
  - "Become the Head Chef of Your Kitchen"
  - Serif, 28px, dark
  - Centered
  - Margin-bottom: mb-8
```

#### 3. Benefits List (`#benefits-list_034`)
```
Space-y-4
Margin-bottom: mb-8

Each benefit card:
  - White background
  - Padding: p-4
  - Border-radius: 2xl
  - Border: 1px creamDark
  - Flex row, items-center, gap-4

  Icon circle:
    - 40x40, rounded-full
    - Background: accent color at 20% opacity
    - Icon in accent color

  Text:
    - Title: font-bold, dark, text-sm
    - Description: text-xs, brown

Benefits:
  1. Unlimited Recipes - infinity icon, sage
  2. Family Sharing - users icon, terracotta
  3. Scan Cookbooks - scan-search icon, deepBrown
```

#### 4. Footer Sticky (`#footer_038`)
```
Padding: p-6 pb-10
Background: white
Border-top: 1px creamDark
Border-radius: rounded-t-[32px]
Shadow (negative y)
```

#### 5. Plan Selector (`#plan-selector_039`)
```
Flex row, gap-4
Margin-bottom: mb-6

Annual plan (selected):
  - Flex-1
  - Background: terracotta
  - Text: white
  - Padding: p-4
  - Border-radius: 2xl
  - Border: 2px terracotta

  "Best Value" badge:
    - Position: absolute -top-3 right-2
    - creamDark background, dark text
    - text-[10px], font-bold, uppercase
    - Rounded-full

  Content:
    - "Annual" label (font-bold, text-sm, opacity-90)
    - "$29.99" (serif, text-2xl)
    - "/year" (text-xs, opacity-80)
    - "7 days free" tag (black/20 bg, rounded-lg)

Monthly plan:
  - Flex-1
  - White background
  - Border: 2px creamDark
  - Same structure, dark text
```

#### 6. CTA Button (`#btn-subscribe_040`)
```
Full width
Height: 56px
Background: dark
Text: cream
Rounded-full
Font-semibold, text-lg
Shadow: lg
Margin-bottom: mb-3

Text: "Start 7-Day Free Trial"
```

#### 7. Legal Text (`#legal-text_041`)
```
Centered
text-[10px]
Brown, opacity-60
"Auto-renews. Cancel anytime in Settings."
```

## Tasks

### 1. Create PaywallScreen.tsx

- Header image with badge
- Benefits list
- Plan selector (toggle state)
- Subscribe CTA
- RevenueCat integration

### 2. Create Components

**PaywallHeader.tsx:**
- Hero image
- Close button
- "Mangia Pro" badge

**BenefitCard.tsx:**
- Icon, title, description
- Configurable accent color

**PlanSelector.tsx:**
- Annual/Monthly toggle
- Visual selection state
- Price display

### 3. RevenueCat Integration

```tsx
import Purchases from 'react-native-purchases';

// Fetch offerings
const offerings = await Purchases.getOfferings();

// Purchase
const { customerInfo } = await Purchases.purchasePackage(package);
```

### 4. Handle Trial Logic

- Check if user eligible for trial
- Show "7 days free" only if eligible
- Handle post-trial conversion

## Files to Create

- `screens/PaywallScreen.tsx` (or update existing SubscriptionScreen)
- `components/paywall/PaywallHeader.tsx`
- `components/paywall/BenefitCard.tsx`
- `components/paywall/PlanSelector.tsx`

## Files to Modify

- Navigation to present paywall modally
- RevenueCat configuration

## Acceptance Criteria

- [ ] Header image has 60px bottom border radius
- [ ] "Mangia Pro" badge centered at bottom of header
- [ ] Benefits have colored icon backgrounds
- [ ] Plan selector shows Annual as default/selected
- [ ] "Best Value" badge on annual plan
- [ ] CTA uses dark background (not terracotta)
- [ ] Close button returns to previous screen
- [ ] RevenueCat purchase flow works
- [ ] Trial eligibility checked
