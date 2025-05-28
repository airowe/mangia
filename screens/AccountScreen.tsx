import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { Screen } from '../components/Screen';
import { colors } from '../theme/colors';

export const AccountScreen = ({ navigation }: any) => {
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Navigation is handled by the auth state change listener in App.tsx
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
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
