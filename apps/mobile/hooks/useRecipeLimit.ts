// hooks/useRecipeLimit.ts
// Hook to track and enforce recipe import limits for free users

import { useState, useEffect, useCallback } from "react";
import { useSubscription } from "../contexts/SubscriptionContext";
import { apiClient } from "../lib/api/client";

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

interface ImportQuotaResponse {
  used: number;
  remaining: number;
  limit: number;
  isLimitReached: boolean;
  isPremium: boolean;
}

/**
 * Hook to manage recipe import limits.
 * Fetches quota from server — all limit logic is computed server-side.
 */
export function useRecipeLimit(): UseRecipeLimitReturn {
  const { isPremium, isLoading: subscriptionLoading } = useSubscription();
  const [quota, setQuota] = useState<ImportQuotaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUsage = useCallback(async () => {
    try {
      const response = await apiClient.get<ImportQuotaResponse>(
        "/api/recipes/import-quota"
      );
      setQuota(response);
    } catch (error) {
      console.error("Failed to check import usage:", error);
      // On error, assume no limit to not block the user
      setQuota(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load usage on mount and when premium status changes
  useEffect(() => {
    if (!subscriptionLoading) {
      refreshUsage();
    }
  }, [subscriptionLoading, isPremium, refreshUsage]);

  // Check if user can import another recipe
  const canImport = useCallback((): boolean => {
    if (isPremium) return true;
    if (!quota) return true; // Fallback: don't block if quota fetch failed
    return !quota.isLimitReached;
  }, [isPremium, quota]);

  // Increment usage count after successful import (optimistic update)
  const incrementUsage = useCallback(async (): Promise<void> => {
    if (!isPremium && quota) {
      setQuota({
        ...quota,
        used: quota.used + 1,
        remaining: Math.max(0, quota.remaining - 1),
        isLimitReached: quota.used + 1 >= quota.limit,
      });
    }
  }, [isPremium, quota]);

  return {
    importsUsed: quota?.used ?? 0,
    importsRemaining: isPremium ? Infinity : (quota?.remaining ?? 0),
    monthlyLimit: quota?.limit ?? 0,
    isLimitReached: !isPremium && (quota?.isLimitReached ?? false),
    isLoading: isLoading || subscriptionLoading,
    isPremium,
    canImport,
    incrementUsage,
    refreshUsage,
  };
}
