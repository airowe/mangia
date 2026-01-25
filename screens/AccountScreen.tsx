import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { useClerk, useUser } from '@clerk/clerk-expo';
import { Screen } from '../components/Screen';
import { colors } from '../theme/colors';
import { Text } from 'react-native';

export const AccountScreen = ({ navigation }: any) => {
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleLogout = async () => {
    try {
      await signOut();
      // Navigation is handled by SignedIn/SignedOut components in App.tsx
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.email}>{user.emailAddresses[0]?.emailAddress}</Text>
            {user.fullName && <Text style={styles.name}>{user.fullName}</Text>}
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          labelStyle={styles.logoutButtonText}
        >
          Logout
        </Button>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  userInfo: {
    marginBottom: 40,
    alignItems: 'center',
  },
  email: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logoutButton: {
    backgroundColor: colors.error,
    paddingVertical: 8,
    borderRadius: 4,
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AccountScreen;
