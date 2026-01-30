// hooks/usePremiumFeature.ts
// Hook to check if a premium feature is available.
// Feature definitions are fetched from GET /api/features.

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSubscription } from "../contexts/SubscriptionContext";
import { apiClient } from "../lib/api/client";

export type PremiumFeature = string;

export interface FeatureDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  requiresPremium: boolean;
}

interface FeaturesResponse {
  features: FeatureDefinition[];
  userIsPremium: boolean;
}

// Module-level lookup for synchronous access from UpgradePrompt.
// Updated each time the hook fetches fresh data.
let featureLookup: Record<string, FeatureDefinition> = {};

/**
 * Get a feature definition by key. Returns null if features haven't loaded yet.
 */
export function getFeatureInfo(key: string): FeatureDefinition | null {
  return featureLookup[key] ?? null;
}

type RootStackParamList = {
  SubscriptionScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface UsePremiumFeatureReturn {
  isPremium: boolean;
  isLoading: boolean;
  features: FeatureDefinition[];
  checkFeature: (feature: PremiumFeature) => boolean;
  requirePremium: (feature: PremiumFeature) => boolean;
  showPaywall: (feature?: PremiumFeature) => void;
}

/**
 * Hook to check premium feature availability.
 * Fetches feature definitions from server on mount.
 */
export function usePremiumFeature(): UsePremiumFeatureReturn {
  const { isPremium, isLoading: subscriptionLoading } = useSubscription();
  const navigation = useNavigation<NavigationProp>();
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const featuresRef = useRef<Record<string, FeatureDefinition>>({});

  useEffect(() => {
    if (subscriptionLoading) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await apiClient.get<FeaturesResponse>("/api/features");
        if (!cancelled) {
          const lookup: Record<string, FeatureDefinition> = {};
          for (const f of response.features) {
            lookup[f.key] = f;
          }
          featuresRef.current = lookup;
          featureLookup = lookup;
          setFeatures(response.features);
        }
      } catch (error) {
        console.error("Failed to fetch feature definitions:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [subscriptionLoading]);

  // Check if feature is available (returns true if premium or feature doesn't require it)
  const checkFeature = useCallback(
    (feature: PremiumFeature): boolean => {
      if (isPremium) return true;
      const def = featuresRef.current[feature];
      if (!def) return isPremium; // Fallback: gate on premium if unknown
      return !def.requiresPremium;
    },
    [isPremium]
  );

  // Check feature and navigate to paywall if not available
  const requirePremium = useCallback(
    (feature: PremiumFeature): boolean => {
      if (checkFeature(feature)) {
        return true;
      }
      navigation.navigate("SubscriptionScreen");
      return false;
    },
    [checkFeature, navigation]
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
    isLoading: isLoading || subscriptionLoading,
    features,
    checkFeature,
    requirePremium,
    showPaywall,
  };
}
