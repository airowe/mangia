/**
 * CookingActivity
 *
 * Voltra Live Activity layouts for cooking mode timers.
 * Renders on the lock screen and Dynamic Island with a native countdown
 * that keeps ticking even when the app is backgrounded or killed.
 */

import React from 'react';
import { Voltra } from 'voltra';

// Mangia brand colors for the Live Activity
const colors = {
  deepBrown: '#2A1F18',
  terracotta: '#D97742',
  sage: '#A8BCA0',
  cream: '#FBF9F5',
  mutedCream: 'rgba(251, 249, 245, 0.5)',
};

export interface CookingActivityProps {
  recipeName: string;
  currentStep: number;
  totalSteps: number;
  stepText: string;
  timerEndAtMs: number | null;
  isPaused: boolean;
}

function TimerDisplay({ timerEndAtMs, isPaused }: Pick<CookingActivityProps, 'timerEndAtMs' | 'isPaused'>) {
  if (isPaused) {
    return (
      <Voltra.Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          fontFamily: 'Georgia',
          color: colors.mutedCream,
        }}
      >
        Paused
      </Voltra.Text>
    );
  }

  if (timerEndAtMs === null) {
    return (
      <Voltra.Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          fontFamily: 'Georgia',
          color: colors.cream,
        }}
      >
        No timer
      </Voltra.Text>
    );
  }

  if (timerEndAtMs <= Date.now()) {
    return (
      <Voltra.Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          fontFamily: 'Georgia',
          color: colors.terracotta,
        }}
      >
        Timer done!
      </Voltra.Text>
    );
  }

  return (
    <Voltra.Timer
      endAtMs={timerEndAtMs}
      direction="down"
      style={{
        fontSize: 28,
        fontWeight: '700',
        fontFamily: 'Georgia',
        color: colors.cream,
      }}
    />
  );
}

function CompactTimerDisplay({ timerEndAtMs, isPaused }: Pick<CookingActivityProps, 'timerEndAtMs' | 'isPaused'>) {
  if (isPaused) {
    return (
      <Voltra.Text style={{ fontSize: 14, fontWeight: '600', color: colors.mutedCream }}>
        Paused
      </Voltra.Text>
    );
  }

  if (timerEndAtMs === null || timerEndAtMs <= Date.now()) {
    return (
      <Voltra.Text style={{ fontSize: 14, fontWeight: '600', color: colors.terracotta }}>
        {timerEndAtMs === null ? '--:--' : 'Done!'}
      </Voltra.Text>
    );
  }

  return (
    <Voltra.Timer
      endAtMs={timerEndAtMs}
      direction="down"
      style={{ fontSize: 14, fontWeight: '600', color: colors.cream }}
    />
  );
}

function StepBadge({ currentStep, totalSteps }: Pick<CookingActivityProps, 'currentStep' | 'totalSteps'>) {
  return (
    <Voltra.Text
      style={{
        fontSize: 13,
        fontWeight: '700',
        color: colors.cream,
        backgroundColor: colors.terracotta,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      {`Step ${currentStep + 1} of ${totalSteps}`}
    </Voltra.Text>
  );
}

export function CookingActivityLockScreen({
  currentStep,
  totalSteps,
  stepText,
  timerEndAtMs,
  isPaused,
}: CookingActivityProps) {
  const truncatedStep = stepText.length > 200 ? stepText.slice(0, 197) + '...' : stepText;

  return (
    <Voltra.VStack spacing={12} alignment="leading" style={{ padding: 16 }}>
      {/* Header row */}
      <Voltra.HStack spacing={8} alignment="center">
        <Voltra.Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.mutedCream,
            letterSpacing: 0.5,
          }}
        >
          Mangia
        </Voltra.Text>
        <Voltra.Spacer />
        <StepBadge currentStep={currentStep} totalSteps={totalSteps} />
      </Voltra.HStack>

      {/* Step instruction */}
      <Voltra.Text
        numberOfLines={3}
        style={{
          fontSize: 15,
          fontFamily: 'Georgia',
          color: colors.cream,
        }}
      >
        {truncatedStep}
      </Voltra.Text>

      {/* Timer */}
      <Voltra.HStack alignment="center" style={{ marginTop: 4 }}>
        <Voltra.Spacer />
        <TimerDisplay timerEndAtMs={timerEndAtMs} isPaused={isPaused} />
        <Voltra.Spacer />
      </Voltra.HStack>

      {/* Step position indicator */}
      <Voltra.HStack alignment="center" style={{ marginTop: 4 }}>
        <Voltra.Spacer />
        <Voltra.Text
          style={{
            fontSize: 12,
            fontWeight: '500',
            color: colors.mutedCream,
          }}
        >
          {currentStep > 0 && currentStep < totalSteps - 1
            ? `◀ Step ${currentStep + 1} ▶`
            : currentStep === 0
              ? `Step ${currentStep + 1} ▶`
              : `◀ Step ${currentStep + 1}`}
        </Voltra.Text>
        <Voltra.Spacer />
      </Voltra.HStack>
    </Voltra.VStack>
  );
}

export function CookingActivityIsland({
  recipeName,
  currentStep,
  totalSteps,
  stepText,
  timerEndAtMs,
  isPaused,
}: CookingActivityProps) {
  const truncatedStep = stepText.length > 120 ? stepText.slice(0, 117) + '...' : stepText;

  return {
    compact: {
      leading: (
        <Voltra.Text style={{ fontSize: 14, fontWeight: '600', color: colors.cream }}>
          {`Step ${currentStep + 1}`}
        </Voltra.Text>
      ),
      trailing: (
        <CompactTimerDisplay timerEndAtMs={timerEndAtMs} isPaused={isPaused} />
      ),
    },
    expanded: {
      center: (
        <Voltra.VStack spacing={8} alignment="leading" style={{ padding: 4 }}>
          {/* Header */}
          <Voltra.HStack spacing={8} alignment="center">
            <Voltra.Text
              numberOfLines={1}
              style={{
                fontSize: 14,
                fontWeight: '600',
                fontFamily: 'Georgia',
                color: colors.cream,
              }}
            >
              {recipeName}
            </Voltra.Text>
            <Voltra.Spacer />
            <StepBadge currentStep={currentStep} totalSteps={totalSteps} />
          </Voltra.HStack>

          {/* Step text */}
          <Voltra.Text
            numberOfLines={2}
            style={{
              fontSize: 13,
              color: colors.mutedCream,
            }}
          >
            {truncatedStep}
          </Voltra.Text>

          {/* Timer */}
          <Voltra.HStack alignment="center">
            <Voltra.Spacer />
            <TimerDisplay timerEndAtMs={timerEndAtMs} isPaused={isPaused} />
            <Voltra.Spacer />
          </Voltra.HStack>
        </Voltra.VStack>
      ),
    },
    minimal: (
      <CompactTimerDisplay timerEndAtMs={timerEndAtMs} isPaused={isPaused} />
    ),
  };
}
