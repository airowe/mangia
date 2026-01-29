import React from 'react';
import { StyleSheet, Platform, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface AnimatedHeaderProps {
  scrollY: SharedValue<number>;
  children: React.ReactNode;
  headerMaxHeight?: number;
  headerMinHeight?: number;
  style?: ViewStyle;
}

export const AnimatedHeader = React.memo<AnimatedHeaderProps>(function AnimatedHeader({
  scrollY,
  children,
  headerMaxHeight = 60,
  headerMinHeight = 44,
  style,
}) {
  const insets = useSafeAreaInsets();

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const headerHeight = interpolate(
      scrollY.value,
      [0, headerMaxHeight - headerMinHeight],
      [headerMaxHeight, headerMinHeight],
      Extrapolate.CLAMP
    );

    const headerTranslateY = interpolate(
      scrollY.value,
      [0, headerMaxHeight],
      [0, -headerMaxHeight],
      Extrapolate.CLAMP
    );

    return {
      height: headerHeight,
      transform: [{ translateY: headerTranslateY }],
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, headerMaxHeight * 0.5, headerMaxHeight],
      [1, 0.5, 0],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  return (
    <Animated.View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          ...style,
        },
        animatedHeaderStyle,
      ]}
    >
      <Animated.View style={[styles.headerContent, animatedContentStyle]}>
        {children}
      </Animated.View>
    </Animated.View>
  );
});

AnimatedHeader.displayName = 'AnimatedHeader';

const styles = StyleSheet.create({
  header: {
    position: 'relative',
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    zIndex: 1000,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 44,
  },
});
