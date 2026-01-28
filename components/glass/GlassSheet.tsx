/**
 * GlassSheet
 *
 * A bottom sheet wrapper with glass effect styling.
 * Works with @gorhom/bottom-sheet for the sheet mechanics.
 */

import React, { ReactNode, forwardRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetProps,
} from '@gorhom/bottom-sheet';
import { useTheme } from '../../theme';

interface GlassSheetProps extends Partial<BottomSheetProps> {
  children: ReactNode;
  /** Snap points for the sheet (e.g., ['25%', '50%']) */
  snapPoints: (string | number)[];
  /** Whether to enable content panning */
  enablePanDownToClose?: boolean;
  /** Show/hide the handle */
  showHandle?: boolean;
  /** Custom background style */
  backgroundStyle?: ViewStyle;
}

export const GlassSheet = forwardRef<BottomSheet, GlassSheetProps>(
  function GlassSheet(
    {
      children,
      snapPoints,
      enablePanDownToClose = true,
      showHandle = true,
      backgroundStyle,
      ...props
    },
    ref
  ) {
    const { theme, isDark } = useTheme();
    const { colors, borderRadius, spacing } = theme;

    const supportsBlur = Platform.OS === 'ios';

    const renderBackdrop = useCallback(
      (backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={isDark ? 0.7 : 0.5}
          pressBehavior="close"
        />
      ),
      [isDark]
    );

    const renderHandle = useCallback(() => {
      if (!showHandle) return null;

      return (
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
      );
    }, [showHandle, isDark]);

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
                backgroundStyle,
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

        // Fallback for Android
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
              backgroundStyle,
            ]}
            {...bgProps}
          />
        );
      },
      [supportsBlur, isDark, colors.glass, borderRadius.xl, backgroundStyle]
    );

    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={memoizedSnapPoints}
        enablePanDownToClose={enablePanDownToClose}
        enableContentPanningGesture
        backdropComponent={renderBackdrop}
        handleComponent={renderHandle}
        backgroundComponent={renderBackground}
        style={styles.sheet}
        {...props}
      >
        <View
          style={[
            styles.content,
            { paddingHorizontal: spacing.lg },
          ]}
        >
          {children}
        </View>
      </BottomSheet>
    );
  }
);

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
});
