// screens/AccountScreen.tsx
// Account settings screen with profile info and settings menu
// Design reference: user_account_settings_1/code.html, user_account_settings_2/code.html

import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ReanimatedAnimated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useClerk, useUser } from "@clerk/clerk-expo";

import { Screen } from "../components/Screen";
import { mangiaColors } from "../theme/tokens/colors";
import { fontFamily } from "../theme/tokens/typography";
import { usePremiumFeature } from "../hooks/usePremiumFeature";
import { DEV_BYPASS_AUTH } from "../lib/devConfig";
import Constants from "expo-constants";

type RootStackParamList = {
  SubscriptionScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface SettingsMenuItem {
  icon: string;
  title: string;
  subtitle?: string;
  showManageButton?: boolean;
  onPress: () => void;
}

export const AccountScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { signOut } = useClerk();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isPremium } = usePremiumFeature();

  // Handle case where user data isn't loaded yet
  if (!isUserLoaded && !DEV_BYPASS_AUTH) {
    return (
      <Screen style={styles.container} noPadding>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Screen>
    );
  }

  // Get user info (real or mock)
  const userName = DEV_BYPASS_AUTH
    ? "Isabella Rossi"
    : user?.fullName || user?.firstName || "Guest";
  const memberSince = DEV_BYPASS_AUTH
    ? "2023"
    : user?.createdAt
      ? new Date(user.createdAt).getFullYear().toString()
      : "2024";
  const avatarUrl = DEV_BYPASS_AUTH
    ? "https://lh3.googleusercontent.com/aida-public/AB6AXuC9JgFWnalY1p6riP_OnKlcA-ezJVZOoZWVLPvG7Wfe3jHEdH4Y9jQM7Ev7Lb803CofzxWMM2wFILSavFNzOTHXcT0l-im2tVO8MasXQifEfkUxgSWMSeQJ5JWvieABPv4mefupNlCBvHkkC8tqq5QPMj2qdWGraCCcRQQUSflcSs0qpaihljBHxGINmtYPUrzGAfwPm6j6xq71k4xr3NTDpLWulDA2VNdjhE0E-gkHX9iJ-kn6mmmSneV8jN-d6C3w3SOGIegqZtE"
    : user?.imageUrl;

  const handleLogout = useCallback(async () => {
    if (DEV_BYPASS_AUTH) {
      Alert.alert("Dev Mode", "Logout is disabled in dev bypass mode.");
      return;
    }

    try {
      await signOut();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to sign out";
      Alert.alert("Error", errorMessage);
    }
  }, [signOut]);

  const handleManageSubscription = useCallback(() => {
    navigation.navigate("SubscriptionScreen");
  }, [navigation]);

  const menuItems: SettingsMenuItem[] = [
    {
      icon: "account-outline",
      title: "Profile Settings",
      onPress: () => {
        // Navigate to profile settings
      },
    },
    {
      icon: "silverware-fork-knife",
      title: "Dietary Preferences",
      subtitle: "Vegetarian, Gluten-Free",
      onPress: () => {
        // Navigate to dietary preferences
      },
    },
    {
      icon: "card-account-details-outline",
      title: "Subscription",
      subtitle: isPremium ? "Pro Annual" : "Free",
      showManageButton: true,
      onPress: handleManageSubscription,
    },
    {
      icon: "help-circle-outline",
      title: "Help & Support",
      onPress: () => {
        // Navigate to help
      },
    },
  ];

  const renderMenuItem = (item: SettingsMenuItem, index: number) => (
    <ReanimatedAnimated.View
      key={item.title}
      entering={FadeInDown.delay(300 + index * 50).duration(400)}
    >
      <TouchableOpacity
        style={[
          styles.menuItem,
          index < menuItems.length - 1 && styles.menuItemBorder,
        ]}
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        {/* Icon Container */}
        <View style={styles.menuIconContainer}>
          <MaterialCommunityIcons
            name={item.icon as any}
            size={24}
            color={mangiaColors.terracotta}
          />
        </View>

        {/* Content */}
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          )}
        </View>

        {/* Action */}
        {item.showManageButton ? (
          <TouchableOpacity
            style={styles.manageButton}
            onPress={item.onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.manageButtonText}>Manage</Text>
          </TouchableOpacity>
        ) : (
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={mangiaColors.taupe}
          />
        )}
      </TouchableOpacity>
    </ReanimatedAnimated.View>
  );

  // Get app version
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  return (
    <Screen style={styles.container} noPadding>
      {/* Header */}
      <ReanimatedAnimated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <Text style={styles.headerTitle}>Account</Text>
      </ReanimatedAnimated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
      >
        {/* Profile Section */}
        <ReanimatedAnimated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.profileSection}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons
                  name="account"
                  size={48}
                  color={mangiaColors.taupe}
                />
              </View>
            )}

            {/* Pro Badge */}
            {isPremium && (
              <View style={styles.proBadge}>
                <MaterialCommunityIcons
                  name="silverware-variant"
                  size={14}
                  color="#B45309"
                />
                <Text style={styles.proBadgeText}>Mangia Pro</Text>
              </View>
            )}
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.memberSince}>Member since {memberSince}</Text>
          </View>
        </ReanimatedAnimated.View>

        {/* Settings Menu */}
        <ReanimatedAnimated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.menuSection}
        >
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => renderMenuItem(item, index))}
          </View>
        </ReanimatedAnimated.View>

        {/* Footer */}
        <ReanimatedAnimated.View
          entering={FadeInDown.delay(500).duration(400)}
          style={styles.footer}
        >
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Mangia for iOS v{appVersion}</Text>
        </ReanimatedAnimated.View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7F6",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
    backgroundColor: "rgba(248, 247, 246, 0.9)",
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: mangiaColors.dark,
    letterSpacing: -0.3,
  },

  // Scroll Content
  scrollContent: {
    paddingTop: 32,
  },

  // Profile Section
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 3,
    borderColor: mangiaColors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarPlaceholder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 3,
    borderColor: mangiaColors.white,
    backgroundColor: "#E5E0DD",
    justifyContent: "center",
    alignItems: "center",
  },
  proBadge: {
    position: "absolute",
    bottom: -8,
    left: "50%",
    transform: [{ translateX: -50 }],
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  proBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: "#B45309",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userInfo: {
    alignItems: "center",
    marginTop: 8,
  },
  userName: {
    fontFamily: fontFamily.serif,
    fontSize: 28,
    fontStyle: "italic",
    fontWeight: "500",
    color: mangiaColors.dark,
    marginBottom: 4,
  },
  memberSince: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: "#857166",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Menu Section
  menuSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  menuCard: {
    backgroundColor: mangiaColors.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F8F7F6",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 17,
    color: mangiaColors.dark,
  },
  menuSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: "#857166",
    marginTop: 2,
  },
  manageButton: {
    backgroundColor: "#F8F7F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  manageButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    color: mangiaColors.terracotta,
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  logoutButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: mangiaColors.terracotta,
    letterSpacing: 0.3,
  },
  versionText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: "#9CA3AF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: mangiaColors.brown,
  },
});

export default AccountScreen;
