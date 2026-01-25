// components/UpgradePrompt.tsx
// Reusable upgrade prompt for premium features

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { colors } from "../theme/colors";
import {
  PremiumFeature,
  PREMIUM_FEATURES,
} from "../hooks/usePremiumFeature";

type RootStackParamList = {
  SubscriptionScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface UpgradePromptProps {
  feature?: PremiumFeature;
  title?: string;
  description?: string;
  compact?: boolean;
  onClose?: () => void;
}

/**
 * Reusable component to prompt users to upgrade to premium
 * Can show a specific feature or generic upgrade message
 */
export function UpgradePrompt({
  feature,
  title,
  description,
  compact = false,
  onClose,
}: UpgradePromptProps) {
  const navigation = useNavigation<NavigationProp>();

  // Get feature info if provided
  const featureInfo = feature ? PREMIUM_FEATURES[feature] : null;
  const displayTitle = title || featureInfo?.title || "Premium Feature";
  const displayDescription =
    description ||
    featureInfo?.description ||
    "Upgrade to Premium to unlock this feature";
  const iconName = featureInfo?.icon || "crown";

  const handleUpgrade = () => {
    navigation.navigate("SubscriptionScreen");
    onClose?.();
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={handleUpgrade}>
        <MaterialCommunityIcons
          name="crown"
          size={16}
          color={colors.primary}
        />
        <Text style={styles.compactText}>{displayTitle}</Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={16}
          color={colors.primary}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialCommunityIcons
            name="close"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}

      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
          size={48}
          color={colors.primary}
        />
      </View>

      <Text style={styles.title}>{displayTitle}</Text>
      <Text style={styles.description}>{displayDescription}</Text>

      <View style={styles.premiumBadge}>
        <MaterialCommunityIcons name="crown" size={14} color={colors.primary} />
        <Text style={styles.premiumText}>Premium Feature</Text>
      </View>

      <Button
        mode="contained"
        onPress={handleUpgrade}
        style={styles.upgradeButton}
        icon="crown"
      >
        Upgrade to Premium
      </Button>

      <Button
        mode="text"
        onPress={onClose || (() => navigation.goBack())}
        style={styles.laterButton}
      >
        Maybe Later
      </Button>
    </View>
  );
}

/**
 * Inline banner for use within screens
 */
export function UpgradeBanner({
  feature,
  message,
}: {
  feature?: PremiumFeature;
  message?: string;
}) {
  const navigation = useNavigation<NavigationProp>();
  const featureInfo = feature ? PREMIUM_FEATURES[feature] : null;
  const displayMessage =
    message || `Unlock ${featureInfo?.title || "this feature"} with Premium`;

  return (
    <TouchableOpacity
      style={styles.bannerContainer}
      onPress={() => navigation.navigate("SubscriptionScreen")}
    >
      <View style={styles.bannerContent}>
        <MaterialCommunityIcons name="crown" size={20} color={colors.primary} />
        <Text style={styles.bannerText}>{displayMessage}</Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.primary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    margin: 16,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  upgradeButton: {
    width: "100%",
    marginBottom: 8,
  },
  laterButton: {
    marginTop: 4,
  },
  // Compact style
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  compactText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
    flex: 1,
  },
  // Banner style
  bannerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  bannerText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
});
