/**
 * PaginationDots Component
 *
 * Animated pagination indicator for onboarding screens.
 * Active dot is 8w, inactive dots are 2.5w per prototype specs.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { mangiaColors } from '../../theme/tokens/colors';

interface PaginationDotsProps {
  totalPages: number;
  currentPage: number;
}

export function PaginationDots({ totalPages, currentPage }: PaginationDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalPages }).map((_, index) => (
        <Dot key={index} isActive={index === currentPage} />
      ))}
    </View>
  );
}

function Dot({ isActive }: { isActive: boolean }) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withSpring(isActive ? 32 : 10, {
      damping: 15,
      stiffness: 120,
    }),
    backgroundColor: isActive ? mangiaColors.dark : mangiaColors.creamDark,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 10,
    borderRadius: 5,
  },
});
