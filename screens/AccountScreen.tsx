import React, { useMemo } from 'react';
import { View, Alert, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { useClerk, useUser } from '@clerk/clerk-expo';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Screen } from '../components/Screen';
import { useTheme } from '../theme';

export const AccountScreen = ({ navigation }: any) => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;

  const handleLogout = async () => {
    try {
      await signOut();
      // Navigation is handled by SignedIn/SignedOut components in App.tsx
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      Alert.alert('Error', errorMessage);
    }
  };

  const styles = useMemo(
    () => ({
      container: {
        flex: 1,
        justifyContent: 'center' as const,
        padding: spacing.xl,
      },
      userInfo: {
        marginBottom: spacing.xxxl,
        alignItems: 'center' as const,
      },
      email: {
        ...typography.styles.body,
        color: colors.text,
        marginBottom: spacing.xs,
      },
      name: {
        ...typography.styles.caption1,
        color: colors.textSecondary,
      },
      logoutButton: {
        backgroundColor: colors.error,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
      },
      logoutButtonText: {
        color: colors.textOnPrimary,
        ...typography.styles.body,
        fontWeight: '600' as const,
      },
    }),
    [colors, spacing, typography, borderRadius]
  );

  return (
    <Screen>
      <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
        {user && (
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.userInfo}>
            <Text style={styles.email}>{user.emailAddresses[0]?.emailAddress}</Text>
            {user.fullName && <Text style={styles.name}>{user.fullName}</Text>}
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            labelStyle={styles.logoutButtonText}
          >
            Logout
          </Button>
        </Animated.View>
      </Animated.View>
    </Screen>
  );
};

export default AccountScreen;
