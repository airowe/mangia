# PRD: PERF-004 - Animation API Cleanup

## Overview
Migrate all legacy React Native Animated API usage to Reanimated for consistent, performant animations throughout the app.

## Problem Statement
The codebase mixes two animation libraries:
- `react-native` Animated API (legacy, JS-driven)
- `react-native-reanimated` (modern, UI-thread)

This causes:
- Inconsistent animation performance
- Larger bundle size (two animation systems)
- Confusing code patterns
- Scroll animations running on JS thread instead of UI thread

## Success Criteria
- [ ] All `import { Animated } from 'react-native'` removed
- [ ] All Animated.Value converted to useSharedValue
- [ ] All Animated.event converted to useAnimatedScrollHandler
- [ ] All Animated.timing/spring converted to withTiming/withSpring
- [ ] Animated.View/ScrollView replaced with Reanimated equivalents
- [ ] No TypeScript errors
- [ ] App builds successfully
- [ ] Animations work correctly

## Technical Approach

### Step 1: Find All Legacy Animated Usage
Search for:
- `import { Animated } from 'react-native'`
- `new Animated.Value`
- `Animated.event`
- `Animated.timing`
- `Animated.spring`
- `Animated.View`
- `Animated.ScrollView`

### Step 2: Migration Patterns

#### Animated.Value → useSharedValue
```typescript
// Before
const scrollY = useRef(new Animated.Value(0)).current;

// After
const scrollY = useSharedValue(0);
```

#### Animated.event → useAnimatedScrollHandler
```typescript
// Before
<Animated.ScrollView
  onScroll={Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  )}
/>

// After
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollY.value = event.contentOffset.y;
  },
});

<Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16} />
```

#### Animated.timing → withTiming
```typescript
// Before
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
}).start();

// After
opacity.value = withTiming(1, { duration: 300 });
```

#### Animated.spring → withSpring
```typescript
// Before
Animated.spring(scale, {
  toValue: 1,
  friction: 5,
  useNativeDriver: true,
}).start();

// After
scale.value = withSpring(1, { damping: 15, stiffness: 150 });
```

#### Animated.View styles → useAnimatedStyle
```typescript
// Before
const animatedStyle = {
  opacity: opacity,
  transform: [{ scale: scale }],
};
<Animated.View style={animatedStyle} />

// After
const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ scale: scale.value }],
}));
<Animated.View style={animatedStyle} />
```

#### Interpolation
```typescript
// Before
const headerOpacity = scrollY.interpolate({
  inputRange: [0, 100],
  outputRange: [1, 0],
  extrapolate: 'clamp',
});

// After
const animatedStyle = useAnimatedStyle(() => {
  const headerOpacity = interpolate(
    scrollY.value,
    [0, 100],
    [1, 0],
    Extrapolate.CLAMP
  );
  return { opacity: headerOpacity };
});
```

### Step 3: Files to Modify
Primary files with legacy Animated:
1. `screens/HomeScreen.tsx` - scrollY animation
2. `components/CustomHeader.tsx` - header animations
3. `components/AnimatedHeader.tsx` - if exists
4. Any other files using Animated from react-native

### Step 4: Import Updates
```typescript
// Remove
import { Animated } from 'react-native';

// Add/ensure present
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
```

## Testing
- Verify scroll animations are smooth (60fps)
- Verify header hide/show animations work
- Verify no animation jank on older devices
- Verify gesture interactions still work

## Out of Scope
- Adding new animations
- Gesture handler migrations (already using react-native-gesture-handler)

## Promise Statement
STOP WHEN: All Animated imports from 'react-native' are removed, all animations use Reanimated APIs, and the app builds and animates correctly.
