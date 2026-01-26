// screens/SubscriptionScreen.tsx
// Premium subscription paywall

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text, Button, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { PurchasesPackage } from "react-native-purchases";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { Screen } from "../components/Screen";
import { useTheme } from "../theme";
import { useSubscription } from "../contexts/SubscriptionContext";
import {
  PREMIUM_FEATURES,
  PremiumFeature,
} from "../hooks/usePremiumFeature";
import { formatPrice, getSubscriptionPeriod } from "../lib/revenuecat";

// Features to display on paywall
const PAYWALL_FEATURES: PremiumFeature[] = [
  "unlimited_imports",
  "what_can_i_make",
  "cookbook_collection",
  "grocery_export",
  "meal_planning",
];

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const { isPremium, isLoading, packages, purchase, restore } = useSubscription();
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

  const handlePurchase = useCallback(async () => {
    if (!selectedPackage) {
      Alert.alert("Select a Plan", "Please select a subscription plan");
      return;
    }

    setIsPurchasing(true);
    try {
      const success = await purchase(selectedPackage);
      if (success) {
        Alert.alert(
          "Welcome to Premium!",
          "You now have access to all premium features.",
          [{ text: "Let's Go!", onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Purchase Failed",
        error.message || "There was an error processing your purchase."
      );
    } finally {
      setIsPurchasing(false);
    }
  }, [selectedPackage, purchase, navigation]);

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    try {
      const restored = await restore();
      if (restored) {
        Alert.alert(
          "Purchases Restored",
          "Your premium subscription has been restored.",
          [{ text: "Great!", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any previous purchases to restore."
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Restore Failed",
        error.message || "There was an error restoring your purchases."
      );
    } finally {
      setIsRestoring(false);
    }
  }, [restore, navigation]);

  const styles = useMemo(
    () => ({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      scrollView: {
        flex: 1,
      },
      content: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
      },
      closeButton: {
        position: "absolute" as const,
        top: 0,
        right: 0,
        zIndex: 1,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
      },
      loadingText: {
        marginTop: spacing.md,
        color: colors.textSecondary,
        ...typography.styles.body,
      },
      successContainer: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        padding: spacing.xxl,
      },
      successTitle: {
        ...typography.styles.largeTitle,
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
      },
      successText: {
        ...typography.styles.body,
        color: colors.textSecondary,
        textAlign: "center" as const,
        marginBottom: spacing.xl,
      },
      doneButton: {
        paddingHorizontal: spacing.xxl,
      },
      header: {
        alignItems: "center" as const,
        marginTop: spacing.xxxl,
        marginBottom: spacing.xxl,
      },
      title: {
        ...typography.styles.largeTitle,
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
      },
      subtitle: {
        ...typography.styles.body,
        color: colors.textSecondary,
        textAlign: "center" as const,
      },
      featuresSection: {
        marginBottom: spacing.xxl,
      },
      featureItem: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      featureIcon: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.full,
        backgroundColor: `${colors.primary}15`,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        marginRight: spacing.md,
      },
      featureText: {
        flex: 1,
      },
      featureTitle: {
        ...typography.styles.body,
        fontWeight: "600" as const,
        color: colors.text,
        marginBottom: spacing.xs,
      },
      featureDescription: {
        ...typography.styles.caption1,
        color: colors.textSecondary,
      },
      plansSection: {
        marginBottom: spacing.xl,
      },
      plansTitle: {
        ...typography.styles.headline,
        color: colors.text,
        marginBottom: spacing.md,
        textAlign: "center" as const,
      },
      noPackagesText: {
        ...typography.styles.body,
        color: colors.textSecondary,
        textAlign: "center" as const,
      },
      planButton: {
        marginBottom: spacing.md,
        borderRadius: borderRadius.md,
      },
      planButtonSelected: {
        borderColor: colors.primary,
        borderWidth: 2,
      },
      planButtonContent: {
        height: 72,
        justifyContent: "center" as const,
      },
      planInfo: {
        alignItems: "center" as const,
      },
      planTitle: {
        ...typography.styles.body,
        fontWeight: "600" as const,
        color: colors.text,
      },
      planTitleSelected: {
        color: colors.textOnPrimary,
      },
      planPrice: {
        ...typography.styles.caption1,
        color: colors.textSecondary,
        marginTop: spacing.xs,
      },
      planPriceSelected: {
        color: "rgba(255,255,255,0.8)",
      },
      planSavings: {
        ...typography.styles.caption1,
        color: colors.success,
        fontWeight: "600" as const,
        marginTop: spacing.xs,
      },
      purchaseButton: {
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
      },
      purchaseButtonContent: {
        height: 52,
      },
      restoreButton: {
        marginBottom: spacing.xl,
      },
      termsText: {
        ...typography.styles.caption2,
        color: colors.textTertiary,
        textAlign: "center" as const,
        lineHeight: 18,
      },
    }),
    [colors, spacing, borderRadius, typography]
  );

  // Already premium - show success state
  if (isPremium) {
    return (
      <Screen style={styles.container}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.successContainer}>
          <MaterialCommunityIcons
            name="crown"
            size={80}
            color={colors.primary}
          />
          <Text style={styles.successTitle}>You're Premium!</Text>
          <Text style={styles.successText}>
            You have access to all premium features.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.doneButton}
          >
            Done
          </Button>
        </Animated.View>
      </Screen>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container} noPadding>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Close button */}
        <IconButton
          icon="close"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        />

        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <MaterialCommunityIcons
            name="crown"
            size={60}
            color={colors.primary}
          />
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Unlock all features and cook without limits
          </Text>
        </Animated.View>

        {/* Features list */}
        <View style={styles.featuresSection}>
          {PAYWALL_FEATURES.map((featureKey, index) => {
            const feature = PREMIUM_FEATURES[featureKey];
            return (
              <Animated.View
                key={featureKey}
                entering={FadeInDown.delay(index * 50).duration(300)}
                style={styles.featureItem}
              >
                <View style={styles.featureIcon}>
                  <MaterialCommunityIcons
                    name={feature.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color={colors.success}
                />
              </Animated.View>
            );
          })}
        </View>

        {/* Subscription options */}
        <View style={styles.plansSection}>
          <Text style={styles.plansTitle}>Choose Your Plan</Text>

          {packages.length === 0 ? (
            <Text style={styles.noPackagesText}>
              No subscription plans available
            </Text>
          ) : (
            packages.map((pkg) => {
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const isYearly = pkg.identifier.includes("yearly");

              return (
                <Button
                  key={pkg.identifier}
                  mode={isSelected ? "contained" : "outlined"}
                  onPress={() => setSelectedPackage(pkg)}
                  style={[
                    styles.planButton,
                    isSelected && styles.planButtonSelected,
                  ]}
                  contentStyle={styles.planButtonContent}
                >
                  <View style={styles.planInfo}>
                    <Text
                      style={[
                        styles.planTitle,
                        isSelected && styles.planTitleSelected,
                      ]}
                    >
                      {isYearly ? "Yearly" : "Monthly"}
                    </Text>
                    <Text
                      style={[
                        styles.planPrice,
                        isSelected && styles.planPriceSelected,
                      ]}
                    >
                      {formatPrice(pkg)}/{getSubscriptionPeriod(pkg)}
                    </Text>
                    {isYearly && (
                      <Text style={styles.planSavings}>Save 40%</Text>
                    )}
                  </View>
                </Button>
              );
            })
          )}
        </View>

        {/* Purchase button */}
        <Button
          mode="contained"
          onPress={handlePurchase}
          loading={isPurchasing}
          disabled={isPurchasing || isRestoring || !selectedPackage}
          style={styles.purchaseButton}
          contentStyle={styles.purchaseButtonContent}
        >
          {isPurchasing ? "Processing..." : "Subscribe Now"}
        </Button>

        {/* Restore purchases */}
        <Button
          mode="text"
          onPress={handleRestore}
          loading={isRestoring}
          disabled={isPurchasing || isRestoring}
          style={styles.restoreButton}
        >
          Restore Purchases
        </Button>

        {/* Terms */}
        <Text style={styles.termsText}>
          Subscriptions automatically renew unless cancelled at least 24 hours
          before the end of the current period. Your account will be charged for
          renewal within 24 hours prior to the end of the current period.
        </Text>
      </ScrollView>
    </Screen>
  );
}
