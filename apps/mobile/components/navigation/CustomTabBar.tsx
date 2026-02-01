/**
 * CustomTabBar
 *
 * Modern liquid glass tab bar with floating FAB on the right.
 * Inspired by Apple News+ iOS 18 design.
 *
 * Design specs:
 * - Main pill: 4 tabs in frosted glass container
 * - FAB: Separate floating button on the right
 * - Position: absolute bottom with safe area
 * - Glass effect: blur + semi-transparent bg
 */

import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import {
  LiquidGlassView,
  isLiquidGlassSupported,
} from '@callstack/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme';
import { QuickAddMenu, QuickAddOption } from './QuickAddMenu';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { mangiaColors } from '../../theme/tokens/colors';
import { useSetTabBarLayout } from '../../contexts/TabBarLayoutContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tab icons mapping using Feather (Lucide-compatible)
const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Home: 'home',
  Pantry: 'box',
  Shopping: 'shopping-cart',
  Recipes: 'book-open',
};

// Tab labels
const TAB_LABELS: Record<string, string> = {
  Home: 'Home',
  Pantry: 'Pantry',
  Shopping: 'Shop',
  Recipes: 'Recipes',
};

interface CustomTabBarProps extends BottomTabBarProps {}

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: CustomTabBarProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const quickAddRef = useRef<BottomSheet>(null);
  const navRef = useNavigation();
  const setTabBarLayout = useSetTabBarLayout();

  // LiquidGlassView is iOS only, fallback to solid bg on Android

  const handleQuickAddPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    quickAddRef.current?.expand();
  }, []);

  const quickAddOptions: QuickAddOption[] = [
    {
      id: 'import-recipe',
      icon: 'link',
      title: 'Import Recipe',
      subtitle: 'From URL',
      onPress: () => {
        navRef.dispatch(
          CommonActions.navigate({
            name: 'Home',
            params: { screen: 'ImportRecipeScreen' },
          })
        );
      },
    },
    {
      id: 'manual-entry',
      icon: 'create',
      title: 'Manual Entry',
      subtitle: 'Create recipe',
      onPress: () => {
        navRef.dispatch(
          CommonActions.navigate({
            name: 'Home',
            params: { screen: 'ManualEntryScreen' },
          })
        );
      },
    },
    {
      id: 'add-pantry',
      icon: 'basket',
      title: 'Add to Pantry',
      subtitle: 'Quick add item',
      onPress: () => {
        navRef.dispatch(CommonActions.navigate({ name: 'Pantry' }));
      },
    },
    {
      id: 'add-shopping',
      icon: 'cart',
      title: 'Add to List',
      subtitle: 'Shopping item',
      onPress: () => {
        navRef.dispatch(CommonActions.navigate({ name: 'Shopping' }));
      },
    },
  ];

  const bottomOffset = Math.max(insets.bottom, 16);

  return (
    <>
      {/* Tab bar container */}
      <View
        style={[styles.container, { bottom: bottomOffset }]}
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          setTabBarLayout(bottomOffset + height);
        }}
      >
        {/* Main tab pill - liquid glass */}
        <LiquidGlassView
          style={[
            styles.tabPill,
            // Fallback for unsupported devices
            !isLiquidGlassSupported && {
              backgroundColor: isDark
                ? 'rgba(40, 40, 45, 0.92)'
                : 'rgba(255, 255, 255, 0.92)',
            },
          ]}
          effect="regular"
          colorScheme={isDark ? 'dark' : 'light'}
        >
          {/* Tab items */}
          <View style={styles.tabContent}>
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate(route.name);
                }
              };

              return (
                <TabBarItem
                  key={route.key}
                  label={TAB_LABELS[route.name] || route.name}
                  icon={TAB_ICONS[route.name] || 'circle'}
                  isFocused={isFocused}
                  onPress={onPress}
                  isDark={isDark}
                />
              );
            })}
          </View>
        </LiquidGlassView>

        {/* FAB button - separate on the right */}
        <FABButton onPress={handleQuickAddPress} />
      </View>

      {/* Quick Add Menu */}
      <QuickAddMenu ref={quickAddRef} options={quickAddOptions} />
    </>
  );
}

interface FABButtonProps {
  onPress: () => void;
}

function FABButton({ onPress }: FABButtonProps) {
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [pressed]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, { damping: 15, stiffness: 400 });
  }, [pressed]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.92]);
    return { transform: [{ scale }] };
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.fabButton, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel="Quick add"
    >
      {/* Inner gradient/glow effect */}
      <View style={styles.fabInner}>
        <Feather name="plus" size={26} color={mangiaColors.white} />
      </View>
    </AnimatedPressable>
  );
}

interface TabBarItemProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  isFocused: boolean;
  onPress: () => void;
  isDark: boolean;
}

function TabBarItem({ label, icon, isFocused, onPress, isDark }: TabBarItemProps) {
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, [pressed]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, { damping: 20, stiffness: 300 });
  }, [pressed]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.9]);
    return { transform: [{ scale }] };
  });

  const activeColor = mangiaColors.terracotta;
  // Use a medium gray that's visible on both light and dark glass backgrounds
  const inactiveColor = '#6B6B6B';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tabItem, animatedStyle]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      {/* Active pill background */}
      {isFocused && (
        <View
          style={[
            styles.activeIndicator,
            { backgroundColor: `${mangiaColors.terracotta}18` },
          ]}
        />
      )}
      <Feather
        name={icon}
        size={22}
        color={isFocused ? activeColor : inactiveColor}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? activeColor : inactiveColor },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tabPill: {
    flex: 1,
    height: 64,
    borderRadius: 32,
    // Shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  tabContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    right: 4,
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    // Shadow with terracotta glow
    shadowColor: mangiaColors.terracotta,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  fabInner: {
    flex: 1,
    backgroundColor: mangiaColors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    // Subtle inner border for depth
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
