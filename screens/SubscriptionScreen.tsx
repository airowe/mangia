// screens/SubscriptionScreen.tsx
// Premium subscription paywall

import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text, Button, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { PurchasesPackage } from "react-native-purchases";

import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";
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
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

  // Handle purchase
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

  // Handle restore
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

  // Already premium - show success state
  if (isPremium) {
    return (
      <Screen style={styles.container}>
        <View style={styles.successContainer}>
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
        </View>
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
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="crown"
            size={60}
            color={colors.primary}
          />
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Unlock all features and cook without limits
          </Text>
        </View>

        {/* Features list */}
        <View style={styles.featuresSection}>
          {PAYWALL_FEATURES.map((featureKey) => {
            const feature = PREMIUM_FEATURES[featureKey];
            return (
              <View key={featureKey} style={styles.featureItem}>
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
              </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  closeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 16,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  doneButton: {
    paddingHorizontal: 32,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  featuresSection: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  plansSection: {
    marginBottom: 24,
  },
  plansTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  noPackagesText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  planButton: {
    marginBottom: 12,
    borderRadius: 12,
  },
  planButtonSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  planButtonContent: {
    height: 72,
    justifyContent: "center",
  },
  planInfo: {
    alignItems: "center",
  },
  planTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  planTitleSelected: {
    color: "#fff",
  },
  planPrice: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  planPriceSelected: {
    color: "rgba(255,255,255,0.8)",
  },
  planSavings: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "600",
    marginTop: 4,
  },
  purchaseButton: {
    borderRadius: 12,
    marginBottom: 12,
  },
  purchaseButtonContent: {
    height: 52,
  },
  restoreButton: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: "center",
    lineHeight: 18,
  },
});
