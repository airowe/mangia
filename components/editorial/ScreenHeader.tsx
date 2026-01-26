/**
 * ScreenHeader
 *
 * Editorial header with greeting pattern.
 * Matches /ui-redesign/screens/home_screen.html (#header_100)
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { useTheme } from '../../theme';
import { mangiaColors } from '../../theme/tokens/colors';
import { editorialTextStyles, fontFamily } from '../../theme/tokens/typography';

interface ScreenHeaderProps {
  onAvatarPress?: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function ScreenHeader({ onAvatarPress }: ScreenHeaderProps) {
  const { theme } = useTheme();
  const { spacing } = theme;
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const firstName = user?.firstName || 'Chef';
  const initials = user?.firstName?.[0]?.toUpperCase() || 'M';
  const avatarUrl = user?.imageUrl;
  const greeting = getGreeting();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.lg,
          backgroundColor: mangiaColors.cream,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        leftContent: {
          flexDirection: 'column',
        },
        brandLabel: {
          fontFamily: fontFamily.bold,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: mangiaColors.terracotta,
          marginBottom: 4,
        },
        greeting: {
          fontFamily: fontFamily.serif,
          fontSize: 24,
          fontWeight: '400',
          lineHeight: 28,
          color: mangiaColors.dark,
        },
        avatar: {
          width: 40,
          height: 40,
          borderRadius: 20,
          borderWidth: 2,
          borderColor: mangiaColors.dark,
          overflow: 'hidden',
        },
        avatarImage: {
          width: '100%',
          height: '100%',
        },
        avatarFallback: {
          width: '100%',
          height: '100%',
          backgroundColor: mangiaColors.sage,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarInitials: {
          fontFamily: fontFamily.bold,
          fontSize: 16,
          fontWeight: '700',
          color: mangiaColors.dark,
        },
      }),
    [insets.top, spacing]
  );

  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <Text style={styles.brandLabel}>Bon Appétit</Text>
        <Text style={styles.greeting}>
          {greeting}, {firstName}
        </Text>
      </View>

      <Pressable onPress={onAvatarPress} style={styles.avatar}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}
