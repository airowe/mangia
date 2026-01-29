# PRD: Phase 3 - CookingModeScreen Redesign

## Objective
Transform CookingModeScreen from a cold, utilitarian interface to a warm, ambient cooking companion with editorial typography and satisfying interactions. This is the **highest priority** screen as cooking assistant is the primary use case.

## Prerequisites
- Phase 1 complete (design tokens with cooking colors)
- Phase 2 complete (editorial typography components)

## Current State
**File:** `screens/CookingModeScreen.tsx`

- Cold dark blue background (`#1a1a2e`)
- 28px sans-serif step text
- Basic timer with quick buttons
- Simple progress dots
- ProgressBar from react-native-paper

## Target State
- Warm brown ambient background (`#2A1F18`)
- 32px serif step text for better readability
- Circular timer with warm glow
- Animated step dots with satisfying transitions
- Terracotta accents throughout

## Detailed Changes

### 1. Replace Color Constants
Remove existing constants and use theme:

```typescript
// REMOVE these:
const COOKING_DARK_BG = '#1a1a2e';
const COOKING_TIMER_BG = '#2a2a4e';

// USE theme colors instead:
const { colors } = useTheme();
// colors.cookingBackground = '#2A1F18'
// colors.cookingBackgroundSecondary = '#3A2A20'
// colors.cookingAccent = terracotta[300]
// colors.cookingText = cream[100]
// colors.cookingTextSecondary = 'rgba(251, 249, 245, 0.7)'
```

### 2. Update Container Styles

```typescript
container: {
  flex: 1,
  backgroundColor: colors.cookingBackground,  // Warm brown #2A1F18
},
```

### 3. Update Step Text Styles
Use editorial typography for steps:

```typescript
// Replace stepText style with:
stepText: {
  ...typography.editorialStyles.cookingStep,  // 32px serif
  color: colors.cookingText,
  textAlign: 'center',
},

// Replace stepNumberText with:
stepNumberBadge: {
  backgroundColor: colors.primary,  // Terracotta
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.sm,
  borderRadius: borderRadius.full,
  marginBottom: spacing.xl,
  // Add subtle shadow for depth
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4,
},
stepNumberText: {
  ...typography.editorialStyles.cookingStepLabel,  // Uppercase, letter-spaced
  color: colors.cookingText,
},
```

Change step label format from "Step {n}" to "STEP {n} OF {total}".

### 4. Update Header Styles

```typescript
headerTitle: {
  ...typography.editorialStyles.cardTitle,  // Serif
  color: colors.cookingText,
},
headerProgress: {
  ...typography.styles.caption1,
  color: colors.cookingTextSecondary,
  marginTop: 2,
},
```

### 5. Update Timer Section

Replace simple timer display with enhanced version:

```typescript
timerSection: {
  backgroundColor: colors.cookingBackgroundSecondary,  // #3A2A20
  padding: spacing.lg,
  marginHorizontal: spacing.lg,
  borderRadius: borderRadius.lg,
  marginBottom: spacing.lg,
  alignItems: 'center',
},
timerDisplay: {
  fontSize: 56,  // Larger
  fontWeight: '200',  // Light weight for elegance
  color: colors.cookingText,
  fontVariant: ['tabular-nums'] as ['tabular-nums'],
  // Add glow when timer is running
},
timerRunningGlow: {
  textShadowColor: colors.primary,
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 20,
},
```

Update timer controls:
```typescript
timerButton: {
  backgroundColor: 'rgba(255,255,255,0.08)',  // Subtle
  marginHorizontal: spacing.sm,
  borderRadius: borderRadius.full,
},
```

Update quick timer buttons:
```typescript
quickTimerButton: {
  backgroundColor: 'rgba(255,255,255,0.08)',
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderRadius: borderRadius.full,
  minWidth: 56,
  alignItems: 'center',
},
quickTimerText: {
  color: colors.cookingText,
  ...typography.styles.label,
  fontWeight: '500',
},
```

### 6. Update Progress Dots

Replace basic dots with animated step indicator:

```typescript
// Enhanced dot styles
dot: {
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: 'rgba(255,255,255,0.2)',
},
dotActive: {
  backgroundColor: colors.primary,  // Terracotta
  width: 10,
  height: 10,
  // Add subtle glow
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.6,
  shadowRadius: 6,
},
dotCompleted: {
  backgroundColor: colors.secondary,  // Sage green for completed
  width: 10,
  height: 10,
},
```

Add state to track completed steps:
```typescript
const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

// When navigating to next step, mark previous as completed
const goToNextStep = useCallback(() => {
  if (currentStep < totalSteps - 1) {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    // ... existing navigation logic
  }
}, [currentStep, totalSteps]);
```

### 7. Update Progress Bar

Replace react-native-paper ProgressBar with custom warm version:

```typescript
// Custom progress bar component inline or extract
<View style={styles.progressBarContainer}>
  <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
</View>

progressBarContainer: {
  height: 3,
  backgroundColor: 'rgba(255,255,255,0.1)',
},
progressBarFill: {
  height: 3,
  backgroundColor: colors.primary,  // Terracotta
},
```

### 8. Update Swipe Hints

```typescript
swipeHintText: {
  color: colors.cookingTextSecondary,
  ...typography.styles.body,
},
```

### 9. Update Ingredients Panel

```typescript
ingredientsContainer: {
  flex: 1,
  padding: spacing.xl,
},
ingredientsTitle: {
  ...typography.editorialStyles.sectionHeading,  // Serif
  color: colors.cookingText,
  marginBottom: spacing.xl,
  textAlign: 'center',
},
ingredientRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: spacing.md,
  paddingVertical: spacing.sm,
},
ingredientText: {
  ...typography.editorialStyles.ingredient,
  color: colors.cookingText,
  flex: 1,
},
ingredientBullet: {
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: colors.primary,
  marginRight: spacing.md,
},
```

Replace MaterialCommunityIcons bullet with styled View.

### 10. Update IconButton Colors

All IconButtons should use `colors.cookingText` instead of hardcoded `colors.textOnPrimary`.

### 11. Update StatusBar

```typescript
<StatusBar style="light" />  // Keep light for dark background
```

### 12. Add Haptic Feedback on Step Complete

```typescript
import * as Haptics from 'expo-haptics';

const goToNextStep = useCallback(() => {
  if (currentStep < totalSteps - 1) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // ... rest of logic
  }
}, [currentStep, totalSteps]);
```

## Code Structure

The file already uses `useMemo` for styles, which is good. Update the styles object with all changes above, ensuring all hardcoded colors are replaced with theme values.

## Acceptance Criteria
- [ ] Background is warm brown (#2A1F18), not cold blue
- [ ] Step text is 32px serif font, highly readable
- [ ] Step badge shows "STEP 1 OF 8" format with terracotta background
- [ ] Timer has larger display with glow effect when running
- [ ] Progress dots use terracotta (active) and sage (completed)
- [ ] All colors from theme (supports future dark mode adjustments)
- [ ] Haptic feedback on step advancement
- [ ] `npx tsc --noEmit` passes
- [ ] Screen remains fully functional (navigation, timer, ingredients toggle)

## Testing
1. Load any recipe with multiple steps
2. Start cooking mode
3. Verify warm background color
4. Verify serif font on step text is readable at arm's length
5. Navigate through steps with swipe and buttons
6. Verify step dots animate correctly
7. Start a timer, verify glow effect
8. Toggle ingredients view
9. Complete recipe and verify exit flow

## Out of Scope
- Voice control integration
- Shake-to-advance gesture
- Background audio for timer completion
