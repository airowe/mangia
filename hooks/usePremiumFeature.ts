// hooks/usePremiumFeature.ts
// Hook to check if a premium feature is available

import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSubscription } from "../contexts/SubscriptionContext";

// Features that require premium
export type PremiumFeature =
  | "unlimited_imports"
  | "what_can_i_make"
  | "cookbook_collection"
  | "grocery_export"
  | "meal_planning"
  | "advanced_search";

// Feature descriptions for paywall
export const PREMIUM_FEATURES: Record<
  PremiumFeature,
  { title: string; description: string; icon: string }
> = {
  unlimited_imports: {
    title: "Unlimited Recipe Imports",
    description: "Import as many recipes as you want from any source",
    icon: "download-multiple",
  },
  what_can_i_make: {
    title: "What Can I Make?",
    description: "Find recipes based on ingredients you have",
    icon: "chef-hat",
  },
  cookbook_collection: {
    title: "Cookbook Collection",
    description: "Organize recipes into custom collections",
    icon: "bookshelf",
  },
  grocery_export: {
    title: "Export Grocery Lists",
    description: "Share grocery lists to other apps",
    icon: "export",
  },
  meal_planning: {
    title: "Meal Planning",
    description: "Plan your weekly meals in advance",
    icon: "calendar-week",
  },
  advanced_search: {
    title: "Advanced Search",
    description: "Filter by dietary restrictions, time, and more",
    icon: "filter-variant",
  },
};

type RootStackParamList = {
  SubscriptionScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface UsePremiumFeatureReturn {
  isPremium: boolean;
  isLoading: boolean;
  checkFeature: (feature: PremiumFeature) => boolean;
  requirePremium: (feature: PremiumFeature) => boolean;
  showPaywall: (feature?: PremiumFeature) => void;
}

/**
 * Hook to check premium feature availability
 * Returns functions to check features and show paywall
 */
export function usePremiumFeature(): UsePremiumFeatureReturn {
  const { isPremium, isLoading } = useSubscription();
  const navigation = useNavigation<NavigationProp>();

  // Check if feature is available (returns true if premium or feature is free)
  const checkFeature = useCallback(
    (feature: PremiumFeature): boolean => {
      return isPremium;
    },
    [isPremium]
  );

  // Check feature and navigate to paywall if not available
  // Returns true if feature is available, false if showing paywall
  const requirePremium = useCallback(
    (feature: PremiumFeature): boolean => {
      if (isPremium) {
        return true;
      }

      // Navigate to subscription screen
      navigation.navigate("SubscriptionScreen");
      return false;
    },
    [isPremium, navigation]
  );

  // Show paywall directly
  const showPaywall = useCallback(
    (feature?: PremiumFeature) => {
      navigation.navigate("SubscriptionScreen");
    },
    [navigation]
  );

  return {
    isPremium,
    isLoading,
    checkFeature,
    requirePremium,
    showPaywall,
  };
}
