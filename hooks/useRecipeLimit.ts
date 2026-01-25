// hooks/useRecipeLimit.ts
// Hook to track and enforce recipe import limits for free users

import { useState, useEffect, useCallback } from "react";
import { useSubscription } from "../contexts/SubscriptionContext";
import { supabase } from "../lib/supabase";

// Free tier limits
const FREE_MONTHLY_IMPORTS = 3;

interface UseRecipeLimitReturn {
  // State
  importsUsed: number;
  importsRemaining: number;
  monthlyLimit: number;
  isLimitReached: boolean;
  isLoading: boolean;
  isPremium: boolean;

  // Actions
  canImport: () => boolean;
  incrementUsage: () => Promise<void>;
  refreshUsage: () => Promise<void>;
}

/**
 * Hook to manage recipe import limits
 * Free users get 3 imports per month
 * Premium users have unlimited imports
 */
export function useRecipeLimit(): UseRecipeLimitReturn {
  const { isPremium, isLoading: subscriptionLoading } = useSubscription();
  const [importsUsed, setImportsUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate remaining imports
  const importsRemaining = isPremium
    ? Infinity
    : Math.max(0, FREE_MONTHLY_IMPORTS - importsUsed);

  const isLimitReached = !isPremium && importsUsed >= FREE_MONTHLY_IMPORTS;

  // Fetch current month's import count
  const refreshUsage = useCallback(async () => {
    if (isPremium) {
      setImportsUsed(0);
      setIsLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get start of current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Count recipes created this month via import (not manual)
      const { count, error } = await supabase
        .from("recipes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("source_type", "manual")
        .gte("created_at", startOfMonth.toISOString());

      if (error) {
        console.error("Error fetching import count:", error);
      } else {
        setImportsUsed(count || 0);
      }
    } catch (error) {
      console.error("Failed to check import usage:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isPremium]);

  // Load usage on mount and when premium status changes
  useEffect(() => {
    if (!subscriptionLoading) {
      refreshUsage();
    }
  }, [subscriptionLoading, isPremium, refreshUsage]);

  // Check if user can import another recipe
  const canImport = useCallback((): boolean => {
    if (isPremium) return true;
    return importsUsed < FREE_MONTHLY_IMPORTS;
  }, [isPremium, importsUsed]);

  // Increment usage count after successful import
  const incrementUsage = useCallback(async (): Promise<void> => {
    if (!isPremium) {
      setImportsUsed((prev) => prev + 1);
    }
  }, [isPremium]);

  return {
    importsUsed,
    importsRemaining,
    monthlyLimit: FREE_MONTHLY_IMPORTS,
    isLimitReached,
    isLoading: isLoading || subscriptionLoading,
    isPremium,
    canImport,
    incrementUsage,
    refreshUsage,
  };
}
