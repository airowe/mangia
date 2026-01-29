/**
 * Animation Tokens
 *
 * Consistent timing, easing, and spring configurations for animations.
 * Optimized for 60fps and native driver compatibility.
 */

import { Easing } from 'react-native-reanimated';

// Duration presets (in milliseconds)
export const duration = {
  /** 100ms - Instant feedback */
  instant: 100,
  /** 150ms - Very fast transitions */
  faster: 150,
  /** 200ms - Fast transitions */
  fast: 200,
  /** 300ms - Normal transitions */
  normal: 300,
  /** 400ms - Moderate transitions */
  moderate: 400,
  /** 500ms - Slow transitions */
  slow: 500,
  /** 700ms - Very slow, dramatic transitions */
  slower: 700,
} as const;

// Standard easing curves
export const easing = {
  // Standard Material/iOS curves
  standard: Easing.bezier(0.4, 0.0, 0.2, 1.0),

  // Accelerate - for elements leaving the screen
  accelerate: Easing.bezier(0.4, 0.0, 1.0, 1.0),

  // Decelerate - for elements entering the screen
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1.0),

  // Emphasized - for significant state changes
  emphasized: Easing.bezier(0.2, 0.0, 0.0, 1.0),

  // Linear - for continuous animations
  linear: Easing.linear,

  // Ease out - quick start, slow end (most common)
  easeOut: Easing.out(Easing.cubic),

  // Ease in - slow start, quick end
  easeIn: Easing.in(Easing.cubic),

  // Ease in out - slow start and end
  easeInOut: Easing.inOut(Easing.cubic),

  // Bounce effect
  bounce: Easing.bounce,
} as const;

// Spring configurations for react-native-reanimated
export const spring = {
  // Default spring - balanced feel
  default: {
    damping: 15,
    mass: 1,
    stiffness: 150,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  // Responsive - quick response with subtle bounce
  responsive: {
    damping: 20,
    mass: 1,
    stiffness: 300,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  // Bouncy - playful, noticeable bounce
  bouncy: {
    damping: 10,
    mass: 1,
    stiffness: 180,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  // Stiff - minimal overshoot, quick settle
  stiff: {
    damping: 25,
    mass: 1,
    stiffness: 400,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  // Gentle - soft, slow movement
  gentle: {
    damping: 20,
    mass: 1.2,
    stiffness: 100,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  // Press feedback - for button presses
  press: {
    damping: 20,
    mass: 0.8,
    stiffness: 400,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  // Sheet - for bottom sheets
  sheet: {
    damping: 50,
    mass: 0.8,
    stiffness: 300,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
} as const;

// Preset animation configurations
export const animationPresets = {
  // Fade in/out
  fadeIn: {
    duration: duration.fast,
    easing: easing.decelerate,
  },

  fadeOut: {
    duration: duration.fast,
    easing: easing.accelerate,
  },

  // Scale animations
  scalePress: {
    duration: duration.instant,
    scale: 0.97,
    spring: spring.press,
  },

  scaleGrow: {
    duration: duration.fast,
    scale: 1.05,
    spring: spring.responsive,
  },

  // Slide animations
  slideUp: {
    duration: duration.normal,
    easing: easing.decelerate,
  },

  slideDown: {
    duration: duration.normal,
    easing: easing.accelerate,
  },

  // Page transitions
  pageEnter: {
    duration: duration.normal,
    easing: easing.decelerate,
  },

  pageExit: {
    duration: duration.fast,
    easing: easing.accelerate,
  },
} as const;

// Stagger delays for list animations
export const stagger = {
  fast: 30,
  normal: 50,
  slow: 100,
} as const;

export type DurationKey = keyof typeof duration;
export type SpringKey = keyof typeof spring;
