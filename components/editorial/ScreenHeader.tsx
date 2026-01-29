/**
 * ScreenHeader
 *
 * Editorial header with greeting pattern.
 * Matches /ui-redesign/screens/home_screen.html (#header_100)
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { mangiaColors } from '../../theme/tokens/colors';
import { fontFamily } from '../../theme/tokens/typography';
import { resetOnboarding } from '../../screens/OnboardingScreen';
import { useUser } from '../../hooks/useUser';

interface ScreenHeaderProps {
  onAvatarPress?: () => void;
  showDevTools?: boolean;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function ScreenHeader({ onAvatarPress, showDevTools = __DEV__ }: ScreenHeaderProps) {
  const { theme } = useTheme();
  const { spacing } = theme;
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  // Extract name from user metadata (compatible with our useUser hook format)
  const fullName = user?.user_metadata?.full_name || '';
  const firstName = fullName.split(' ')[0] || 'Chef';
  const initials = firstName[0]?.toUpperCase() || 'M';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const greeting = getGreeting();

  const handleResetOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding',
      'This will reset the onboarding flow. You will see it again after signing out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetOnboarding();
            Alert.alert('Done', 'Onboarding has been reset. Sign out to see it again.');
          },
        },
      ]
    );
  };

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
        rightContent: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        devButton: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: mangiaColors.creamDark,
          alignItems: 'center',
          justifyContent: 'center',
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
        <Text style={styles.brandLabel}>Mangia</Text>
        <Text style={styles.greeting}>
          {greeting}, {firstName}
        </Text>
      </View>

      <View style={styles.rightContent}>
        {/* Dev Tools - Reset Onboarding */}
        {showDevTools && (
          <Pressable onPress={handleResetOnboarding} style={styles.devButton}>
            <Feather name="rotate-ccw" size={16} color={mangiaColors.brown} />
          </Pressable>
        )}

        <Pressable onPress={onAvatarPress} style={styles.avatar}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
