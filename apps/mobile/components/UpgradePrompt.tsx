// components/UpgradePrompt.tsx
// Reusable upgrade prompt for premium features

import React, { useMemo } from "react";
import { View, TouchableOpacity } from "react-native";
import { Text, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { useTheme } from "../theme";
import {
  PremiumFeature,
  getFeatureInfo,
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
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

  // Get feature info if provided
  const featureInfo = feature ? getFeatureInfo(feature) : null;
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

  const styles = useMemo(() => ({
    container: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      alignItems: "center" as const,
      margin: spacing.lg,
    },
    closeButton: {
      position: "absolute" as const,
      top: spacing.md,
      right: spacing.md,
      padding: spacing.xs,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primaryLight,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.styles.title2,
      color: colors.text,
      textAlign: "center" as const,
      marginBottom: spacing.sm,
    },
    description: {
      ...typography.styles.body,
      color: colors.textSecondary,
      textAlign: "center" as const,
      marginBottom: spacing.lg,
      lineHeight: 22,
    },
    premiumBadge: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      marginBottom: spacing.xl,
    },
    premiumText: {
      ...typography.styles.caption1,
      fontWeight: "600" as const,
      color: colors.primary,
    },
    upgradeButton: {
      width: "100%" as const,
      marginBottom: spacing.sm,
    },
    laterButton: {
      marginTop: spacing.xs,
    },
    // Compact style
    compactContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    compactText: {
      ...typography.styles.body,
      fontWeight: "500" as const,
      color: colors.primary,
      flex: 1,
    },
  }), [colors, spacing, borderRadius, typography]);

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
        buttonColor={colors.primary}
        textColor={colors.textOnPrimary}
        style={styles.upgradeButton}
        icon="crown"
      >
        Upgrade to Premium
      </Button>

      <Button
        mode="text"
        onPress={onClose || (() => navigation.goBack())}
        textColor={colors.primary}
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
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

  const featureInfo = feature ? getFeatureInfo(feature) : null;
  const displayMessage =
    message || `Unlock ${featureInfo?.title || "this feature"} with Premium`;

  const bannerStyles = useMemo(() => ({
    bannerContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      marginHorizontal: spacing.lg,
      marginVertical: spacing.sm,
    },
    bannerContent: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
      flex: 1,
    },
    bannerText: {
      ...typography.styles.body,
      color: colors.text,
      flex: 1,
    },
  }), [colors, spacing, borderRadius, typography]);

  return (
    <TouchableOpacity
      style={bannerStyles.bannerContainer}
      onPress={() => navigation.navigate("SubscriptionScreen")}
    >
      <View style={bannerStyles.bannerContent}>
        <MaterialCommunityIcons name="crown" size={20} color={colors.primary} />
        <Text style={bannerStyles.bannerText}>{displayMessage}</Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.primary}
      />
    </TouchableOpacity>
  );
}
