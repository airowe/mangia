/**
 * QuickAddMenu
 *
 * A glass bottom sheet that appears when the primary action button is pressed.
 * Provides quick access to common add actions.
 */

import React, { forwardRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface QuickAddOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

interface QuickAddMenuProps {
  options: QuickAddOption[];
  onClose?: () => void;
}

export const QuickAddMenu = forwardRef<BottomSheet, QuickAddMenuProps>(
  function QuickAddMenu({ options, onClose }, ref) {
    const { theme, isDark } = useTheme();
    const { colors, spacing, borderRadius } = theme;

    const supportsBlur = Platform.OS === 'ios';
    const snapPoints = ['40%'];

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={isDark ? 0.7 : 0.5}
          pressBehavior="close"
        />
      ),
      [isDark]
    );

    const renderHandle = useCallback(
      () => (
        <View style={styles.handleContainer}>
          <View
            style={[
              styles.handle,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.3)'
                  : 'rgba(0, 0, 0, 0.2)',
              },
            ]}
          />
        </View>
      ),
      [isDark]
    );

    const renderBackground = useCallback(
      (bgProps: any) => {
        if (supportsBlur) {
          return (
            <View
              style={[
                styles.backgroundContainer,
                {
                  borderTopLeftRadius: borderRadius.xl,
                  borderTopRightRadius: borderRadius.xl,
                },
              ]}
              {...bgProps}
            >
              <BlurView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: colors.glass },
                ]}
              />
            </View>
          );
        }

        return (
          <View
            style={[
              styles.backgroundContainer,
              {
                backgroundColor: isDark
                  ? 'rgba(30, 30, 30, 0.98)'
                  : 'rgba(255, 255, 255, 0.98)',
                borderTopLeftRadius: borderRadius.xl,
                borderTopRightRadius: borderRadius.xl,
              },
            ]}
            {...bgProps}
          />
        );
      },
      [supportsBlur, isDark, colors.glass, borderRadius.xl]
    );

    const handleOptionPress = useCallback(
      (option: QuickAddOption) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        option.onPress();
        if (ref && 'current' in ref && ref.current) {
          ref.current.close();
        }
      },
      [ref]
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableContentPanningGesture
        backdropComponent={renderBackdrop}
        handleComponent={renderHandle}
        backgroundComponent={renderBackground}
        onClose={onClose}
        style={styles.sheet}
      >
        <View style={[styles.content, { paddingHorizontal: spacing.lg }]}>
          <Text
            style={[
              styles.title,
              { color: colors.text, marginBottom: spacing.lg },
            ]}
          >
            Quick Add
          </Text>

          <View style={styles.optionsGrid}>
            {options.map((option, index) => (
              <QuickAddOptionItem
                key={option.id}
                option={option}
                onPress={() => handleOptionPress(option)}
                index={index}
              />
            ))}
          </View>
        </View>
      </BottomSheet>
    );
  }
);

interface QuickAddOptionItemProps {
  option: QuickAddOption;
  onPress: () => void;
  index: number;
}

function QuickAddOptionItem({ option, onPress, index }: QuickAddOptionItemProps) {
  const { theme, isDark } = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, { damping: 20, stiffness: 400 });
  }, [pressed]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, { damping: 20, stiffness: 400 });
  }, [pressed]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.97]);
    const backgroundColor = isDark
      ? `rgba(255, 255, 255, ${interpolate(pressed.value, [0, 1], [0.05, 0.1])})`
      : `rgba(0, 0, 0, ${interpolate(pressed.value, [0, 1], [0.02, 0.06])})`;

    return {
      transform: [{ scale }],
      backgroundColor,
    };
  });

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(200)}
      style={styles.optionWrapper}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.optionItem,
          {
            borderRadius: borderRadius.md,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.borderLight,
          },
          animatedStyle,
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.primaryLight,
              borderRadius: borderRadius.sm,
              width: 44,
              height: 44,
            },
          ]}
        >
          <Ionicons name={option.icon} size={24} color={colors.primary} />
        </View>
        <Text
          style={[
            styles.optionTitle,
            { color: colors.text, marginTop: spacing.md },
          ]}
        >
          {option.title}
        </Text>
        {option.subtitle && (
          <Text
            style={[
              styles.optionSubtitle,
              { color: colors.textSecondary, marginTop: spacing.xs },
            ]}
          >
            {option.subtitle}
          </Text>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionWrapper: {
    width: '48%',
  },
  optionItem: {
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
});
