# PRD-05: Cooking Mode Screen

## Objective

Redesign the cooking mode for hands-free use with warm dark background, large serif text, integrated timer, and voice control indicator.

## Reference

`/ui-redesign/screens/cooking_mode.html`

## Design Specifications

### Screen Layout

**Full screen dark mode:**
```
Background: deepBrown (#2A1F18)
Text: cream (#FBF9F5)
No tab bar visible
```

#### 1. Progress Header (`#cooking-header_300`)
```
Padding: pt-14 (safe area) px-6
Margin-bottom: mb-8
Flex row, justify-between, items-center

Close button (left):
  - 40x40, rounded-full
  - Border: 1px white/20
  - Icon: X (white/60)
  - Navigates back to recipe detail

Step indicator (center):
  - Background: terracotta
  - Padding: px-4 py-1.5
  - Border-radius: full
  - Text: "STEP 3 OF 8"
    - text-xs, font-bold, tracking-widest, uppercase
  - Shadow: md

Ingredients toggle (right):
  - Same style as close button
  - Icon: list
  - Opens ingredients panel
```

#### 2. Main Step Content (`#step-content_301`)
```
Flex-1, flex-col, px-8
Overflow: hidden (for decorative elements)

Decorative background:
  - Absolute positioned
  - Terracotta circle (256px)
  - Position: top-0 right-[-50px]
  - Blur: 100px
  - Opacity: 20%

Step category:
  - Sage text
  - Font-bold, uppercase, tracking-widest, text-sm
  - Margin-bottom: mb-6
  - Example: "PREPARING THE BASE"

Large instruction text:
  - Flex-1, flex items-center
  - Font: serif
  - Size: 34px
  - Line-height: 1.3 (44px)
  - Color: cream

  Highlighted elements:
    - Ingredients: terracotta, underline dotted, cursor-pointer
    - Times: terracotta, font-bold
```

#### 3. Timer Card (`#timer-card_302`)
```
Background: #3E342F (slightly lighter than deepBrown)
Border-radius: 2xl
Padding: p-4
Flex row, justify-between, items-center
Border: 1px white/10
Shadow: lg
Margin-top: mt-6

Left side (flex row, gap-4):
  - Circular progress indicator:
    - 48x48
    - Border: 4px sage (with top segment transparent for animation)
    - Timer icon inside (sage)
  - Time display:
    - "02:00" (serif, text-2xl, font-bold)
    - "Timer" label (text-xs, white/40, uppercase, tracking-wide)

Right side:
  - "Start" button
    - Background: sage
    - Text: deepBrown, font-bold, text-sm
    - Padding: px-5 py-2
    - Border-radius: full
    - Shadow: md
```

#### 4. Bottom Controls (`#cooking-controls_303`)
```
Padding: p-8 pb-12
Flex row, justify-between, items-center

Previous button (left):
  - 56x56, rounded-full
  - Background: white/5
  - Icon: arrow-left (28px, white/40)
  - On hover: white

Voice control indicator (center):
  - Flex col, items-center, gap-2
  - Opacity: 50%
  - Mic icon (24px)
  - "Listening" label (text-[10px], uppercase, tracking-widest)

Next button (right):
  - 80x80, rounded-full (larger!)
  - Background: terracotta
  - Border: 4px deepBrown
  - Ring: 2px terracotta
  - Icon: arrow-right (32px, white)
  - Shadow: lg
```

## Interaction Specifications

### Swipe Navigation
- Horizontal swipe between steps
- Spring animation on transition
- Current step highlighted

### Timer Behavior
- Tap "Start" to begin countdown
- Timer shows circular progress
- Haptic feedback when timer completes
- Optional sound notification

### Voice Control (Future)
- "Next" / "Previous" commands
- "Start timer" / "Stop timer"
- Visual feedback when listening

### Keep Awake
- Screen should not dim during cooking mode
- Use `expo-keep-awake` or similar

## Tasks

### 1. Rewrite CookingModeScreen.tsx

Complete overhaul:
- Dark deepBrown background
- Progress header with step indicator
- Large serif instruction text
- Integrated timer card
- Navigation controls

### 2. Create Components

**CookingHeader.tsx:**
- Close button
- Step indicator pill
- Ingredients toggle

**CookingStepContent.tsx:**
- Large serif text
- Highlighted ingredients/times
- Decorative background element

**CookingTimer.tsx:**
- Circular progress indicator
- Time display
- Start/Pause/Reset controls

**CookingControls.tsx:**
- Previous/Next buttons
- Voice indicator
- Asymmetric button sizing

### 3. Implement Keep Awake

```tsx
import { useKeepAwake } from 'expo-keep-awake';

function CookingModeScreen() {
  useKeepAwake();
  // ...
}
```

### 4. Horizontal Step Swiping

Use FlatList with horizontal paging:
```tsx
<FlatList
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  data={steps}
  // ...
/>
```

## Files to Modify

- `screens/CookingModeScreen.tsx` (complete rewrite)
- Create: `components/cooking/CookingHeader.tsx`
- Create: `components/cooking/CookingStepContent.tsx`
- Create: `components/cooking/CookingTimer.tsx`
- Create: `components/cooking/CookingControls.tsx`

## Acceptance Criteria

- [ ] Background is deepBrown (#2A1F18), NOT cold blue
- [ ] Instruction text is 34px serif font
- [ ] Step indicator is terracotta pill
- [ ] Timer card has sage accent color
- [ ] Next button is larger than previous (80px vs 56px)
- [ ] Decorative terracotta blur circle visible
- [ ] Screen stays awake during cooking
- [ ] Horizontal swipe between steps works
- [ ] Close button returns to recipe detail
- [ ] Ingredients toggle opens panel
