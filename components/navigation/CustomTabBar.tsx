/**
 * CustomTabBar
 *
 * Editorial glass tab bar with floating center FAB.
 * Matches the design from /ui-redesign/screens/home_screen.html (#tab-bar_110)
 *
 * Design specs:
 * - Floating pill shape with glass blur
 * - Position: absolute bottom-8 left-6 right-6
 * - Height: 72px
 * - Background: white/80 with backdrop-blur-xl
 * - Border: 1px solid white/50
 * - Shadow: 0 8px 30px rgba(0,0,0,0.12)
 * - Center FAB floats above bar (-translate-y-6)
 */

import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Tab icons mapping using Feather (Lucide-compatible)
const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Home: 'home',
  Pantry: 'box',
  Shopping: 'shopping-cart',
  Recipes: 'book-open',
};

interface CustomTabBarProps extends BottomTabBarProps {}

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: CustomTabBarProps) {
  const { theme, isDark } = useTheme();
  const { colors, spacing, borderRadius } = theme;
  const insets = useSafeAreaInsets();
  const quickAddRef = useRef<BottomSheet>(null);
  const navRef = useNavigation();

  const supportsBlur = Platform.OS === 'ios';

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

  // Get the index where we insert the FAB (middle of tabs)
  const fabInsertIndex = Math.floor(state.routes.length / 2);

  return (
    <>
      {/* Floating pill-shaped tab bar */}
      <View
        style={[
          styles.container,
          {
            bottom: Math.max(insets.bottom, 8) + 24, // bottom-8 equivalent plus safe area
            marginHorizontal: 24, // left-6 right-6 equivalent
          },
        ]}
      >
        {/* Glass background */}
        {supportsBlur ? (
          <>
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.full }]}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? 'rgba(44, 44, 46, 0.8)'
                    : 'rgba(255, 255, 255, 0.8)',
                  borderRadius: borderRadius.full,
                },
              ]}
            />
          </>
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? 'rgba(44, 44, 46, 0.98)'
                  : 'rgba(255, 255, 255, 0.98)',
                borderRadius: borderRadius.full,
              },
            ]}
          />
        )}

        {/* Border overlay */}
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.borderOverlay,
            {
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.5)',
              borderRadius: borderRadius.full,
            },
          ]}
        />

        {/* Tab bar content */}
        <View style={styles.content}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

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
              <React.Fragment key={route.key}>
                {/* Insert FAB in the middle */}
                {index === fabInsertIndex && (
                  <FABButton onPress={handleQuickAddPress} />
                )}
                <TabBarItem
                  label={label as string}
                  icon={TAB_ICONS[route.name] || 'circle'}
                  isFocused={isFocused}
                  onPress={onPress}
                />
              </React.Fragment>
            );
          })}
        </View>
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
  const { theme } = useTheme();

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [pressed]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, { damping: 15, stiffness: 400 });
  }, [pressed]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.95]);
    return { transform: [{ scale }] };
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.fabContainer, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel="Quick add"
    >
      <View style={styles.fab}>
        <Feather name="plus" size={28} color={mangiaColors.white} />
      </View>
    </AnimatedPressable>
  );
}

interface TabBarItemProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  isFocused: boolean;
  onPress: () => void;
}

function TabBarItem({ label, icon, isFocused, onPress }: TabBarItemProps) {
  const { theme } = useTheme();
  const { colors, animation } = theme;

  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, animation.spring.press);
  }, [pressed, animation.spring.press]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, animation.spring.press);
  }, [pressed, animation.spring.press]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.92]);
    return { transform: [{ scale }] };
  });

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
      {/* Active background highlight */}
      {isFocused && (
        <View
          style={[
            styles.activeBackground,
            { backgroundColor: `${mangiaColors.terracotta}15` },
          ]}
        />
      )}
      <Feather
        name={icon}
        size={22}
        color={isFocused ? mangiaColors.terracotta : mangiaColors.brown}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 72,
    overflow: 'visible',
    // Shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 12,
  },
  borderOverlay: {
    borderWidth: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeBackground: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  fabContainer: {
    width: 56,
    height: 56,
    marginTop: -24, // -translate-y-6 equivalent (floats above bar)
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: mangiaColors.terracotta,
    borderWidth: 4,
    borderColor: mangiaColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: mangiaColors.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
