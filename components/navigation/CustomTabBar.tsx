/**
 * CustomTabBar
 *
 * A modern tab bar with glass effect and separated primary action button.
 * Replaces the default React Navigation bottom tab bar.
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
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme';
import { TabBarActionButton } from './TabBarActionButton';
import { QuickAddMenu, QuickAddOption } from './QuickAddMenu';
import { useNavigation, CommonActions } from '@react-navigation/native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Tab icons mapping
const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Pantry: 'basket',
  MealPlanner: 'restaurant',
  Recipes: 'book',
};

const TAB_ICONS_OUTLINE: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Pantry: 'basket-outline',
  MealPlanner: 'restaurant-outline',
  Recipes: 'book-outline',
};

interface CustomTabBarProps extends BottomTabBarProps {}

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: CustomTabBarProps) {
  const { theme, isDark } = useTheme();
  const { colors, spacing, borderRadius, dimensions } = theme;
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
        // Navigate to import recipe screen
        navRef.dispatch(
          CommonActions.navigate({
            name: 'Home',
            params: {
              screen: 'ImportRecipeScreen',
            },
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
        // Navigate to manual entry screen
        navRef.dispatch(
          CommonActions.navigate({
            name: 'Home',
            params: {
              screen: 'ManualEntryScreen',
            },
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
        // Navigate to Home and trigger pantry sheet
        navRef.dispatch(
          CommonActions.navigate({
            name: 'Home',
          })
        );
        // Note: The HomeScreen handles opening the pantry sheet
      },
    },
    {
      id: 'scan-receipt',
      icon: 'scan',
      title: 'Scan Receipt',
      subtitle: 'Coming soon',
      onPress: () => {
        // TODO: Implement scan receipt
      },
    },
  ];

  const tabBarHeight = dimensions.tabBar.height + insets.bottom;

  return (
    <>
      <View style={[styles.container, { height: tabBarHeight }]}>
        {/* Glass background */}
        {supportsBlur ? (
          <>
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.tabBarBackground },
              ]}
            />
          </>
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? 'rgba(30, 30, 30, 0.98)'
                  : 'rgba(255, 255, 255, 0.98)',
              },
            ]}
          />
        )}

        {/* Top border */}
        <View
          style={[
            styles.topBorder,
            { backgroundColor: colors.tabBarBorder },
          ]}
        />

        {/* Tab bar content */}
        <View
          style={[
            styles.content,
            {
              paddingBottom: insets.bottom,
              paddingHorizontal: spacing.sm,
            },
          ]}
        >
          {/* Navigation tabs */}
          <View style={styles.tabsContainer}>
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
                <TabBarItem
                  key={route.key}
                  label={label as string}
                  icon={
                    isFocused
                      ? TAB_ICONS[route.name]
                      : TAB_ICONS_OUTLINE[route.name]
                  }
                  isFocused={isFocused}
                  onPress={onPress}
                />
              );
            })}
          </View>

          {/* Separator */}
          <View
            style={[
              styles.separator,
              { backgroundColor: colors.border, marginHorizontal: spacing.sm },
            ]}
          />

          {/* Primary action button */}
          <View style={styles.actionButtonContainer}>
            <TabBarActionButton onPress={handleQuickAddPress} />
          </View>
        </View>
      </View>

      {/* Quick Add Menu */}
      <QuickAddMenu ref={quickAddRef} options={quickAddOptions} />
    </>
  );
}

interface TabBarItemProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isFocused: boolean;
  onPress: () => void;
}

function TabBarItem({ label, icon, isFocused, onPress }: TabBarItemProps) {
  const { theme, isDark } = useTheme();
  const { colors, dimensions, animation } = theme;

  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, animation.spring.press);
  }, [pressed, animation.spring.press]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, animation.spring.press);
  }, [pressed, animation.spring.press]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.92]);

    return {
      transform: [{ scale }],
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(pressed.value, [0, 1], [0, -2]);

    return {
      transform: [{ translateY }],
    };
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
      <Animated.View style={iconAnimatedStyle}>
        <Ionicons
          name={icon}
          size={dimensions.tabBar.iconSize}
          color={isFocused ? colors.tabBarActive : colors.tabBarInactive}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? colors.tabBarActive : colors.tabBarInactive,
            fontWeight: isFocused ? '600' : '500',
          },
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
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  topBorder: {
    height: StyleSheet.hairlineWidth,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 64,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  separator: {
    width: 1,
    height: 32,
    opacity: 0.3,
  },
  actionButtonContainer: {
    paddingHorizontal: 8,
  },
});
