import React from 'react';
import { Animated, View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface AnimatedHeaderProps {
  scrollY: Animated.Value;
  children: React.ReactNode;
  headerMaxHeight?: number;
  headerMinHeight?: number;
  style?: ViewStyle;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  scrollY,
  children,
  headerMaxHeight = 60,
  headerMinHeight = 44,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const headerHeight = scrollY.interpolate({
    inputRange: [0, headerMaxHeight - headerMinHeight],
    outputRange: [headerMaxHeight, headerMinHeight],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, headerMaxHeight],
    outputRange: [0, -headerMaxHeight],
    extrapolate: 'clamp',
  });

  // Add a subtle shadow/opacity effect when scrolling
  const opacity = scrollY.interpolate({
    inputRange: [0, headerMaxHeight * 0.5, headerMaxHeight],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.header,
        {
          height: headerHeight,
          transform: [{ translateY: headerTranslateY }],
          paddingTop: insets.top,
          ...style,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.headerContent,
          {
            opacity,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
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
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
