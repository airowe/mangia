/**
 * useCookingActivity
 *
 * Hook wrapping Voltra's Live Activity API for cooking mode timers.
 * Manages the lifecycle of a Live Activity that shows a native countdown
 * on the lock screen and Dynamic Island.
 */

import React, { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { useLiveActivity } from 'voltra/client';
import {
  CookingActivityLockScreen,
  CookingActivityIsland,
  type CookingActivityProps,
} from './CookingActivity';

export interface CookingActivityState {
  recipeName: string;
  recipeId: string;
  currentStep: number;
  totalSteps: number;
  stepText: string;
  timerEndAtMs: number | null;
  isPaused: boolean;
}

function buildVariants(state: CookingActivityState) {
  const props: CookingActivityProps = {
    recipeName: state.recipeName,
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
    stepText: state.stepText,
    timerEndAtMs: state.timerEndAtMs,
    isPaused: state.isPaused,
  };

  const island = CookingActivityIsland(props);

  return {
    lockScreen: {
      content: React.createElement(CookingActivityLockScreen, props),
      activityBackgroundTint: '#2A1F18',
    },
    island: {
      keylineTint: '#D97742',
      ...island,
    },
  };
}

export function useCookingActivity(state: CookingActivityState) {
  const isIOS = Platform.OS === 'ios';
  const activityStartedRef = useRef(false);

  const variants = isIOS ? buildVariants(state) : { lockScreen: undefined, island: undefined };

  const { start, update, end, isActive } = useLiveActivity(variants, {
    activityName: `cooking-${state.recipeId}`,
    autoUpdate: true,
    deepLinkUrl: `mangia://cooking/${state.recipeId}`,
  });

  const startActivity = useCallback(async () => {
    if (!isIOS || activityStartedRef.current) return;
    try {
      await start();
      activityStartedRef.current = true;
    } catch (error) {
      console.warn('Failed to start cooking Live Activity:', error);
    }
  }, [isIOS, start]);

  const updateActivity = useCallback(async () => {
    if (!isIOS || !activityStartedRef.current) return;
    try {
      await update();
    } catch (error) {
      console.warn('Failed to update cooking Live Activity:', error);
    }
  }, [isIOS, update]);

  const endActivity = useCallback(async () => {
    if (!isIOS || !activityStartedRef.current) return;
    try {
      await end({ dismissalPolicy: { after: 5000 } });
      activityStartedRef.current = false;
    } catch (error) {
      console.warn('Failed to end cooking Live Activity:', error);
    }
  }, [isIOS, end]);

  return {
    startActivity,
    updateActivity,
    endActivity,
    isActive: isIOS && isActive,
  };
}
