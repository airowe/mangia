/**
 * CookingTimer Component
 *
 * Embedded timer card with circular progress indicator.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { mangiaColors } from '../../theme/tokens/colors';

interface CookingTimerProps {
  initialSeconds?: number;
  onTimerComplete?: () => void;
  onTimerStart?: (endAtMs: number) => void;
  onTimerPause?: () => void;
}

export const CookingTimer = React.memo<CookingTimerProps>(function CookingTimer({
  initialSeconds = 120,
  onTimerComplete,
  onTimerStart,
  onTimerPause,
}) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const rotation = useSharedValue(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onTimerComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds, onTimerComplete]);

  // Animate rotation when running
  useEffect(() => {
    if (isRunning) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [isRunning, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    const willRun = !isRunning;
    setIsRunning(willRun);
    if (willRun) {
      onTimerStart?.(Date.now() + seconds * 1000);
    } else {
      onTimerPause?.();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {/* Circular Progress Indicator */}
        <Animated.View style={[styles.progressCircle, animatedStyle]}>
          <Feather name="clock" size={20} color={mangiaColors.sage} />
        </Animated.View>

        {/* Time Display */}
        <View style={styles.timeDisplay}>
          <Text style={styles.timeText}>{formatTime(seconds)}</Text>
          <Text style={styles.timerLabel}>Timer</Text>
        </View>
      </View>

      {/* Start/Pause Button */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={handleToggle}
        activeOpacity={0.9}
      >
        <Text style={styles.startButtonText}>
          {isRunning ? 'Pause' : 'Start'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

CookingTimer.displayName = 'CookingTimer';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#3E342F',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: mangiaColors.sage,
    borderTopColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDisplay: {
    // Container for time and label
  },
  timeText: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '700',
    color: mangiaColors.cream,
  },
  timerLabel: {
    fontFamily: 'System',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  startButton: {
    backgroundColor: mangiaColors.sage,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: mangiaColors.deepBrown,
  },
});
