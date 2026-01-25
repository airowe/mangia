// contexts/SubscriptionContext.tsx
// App-wide subscription state management

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import Purchases, { CustomerInfo, PurchasesPackage } from "react-native-purchases";
import { useAuth, useUser } from "@clerk/clerk-expo";
import {
  initializeRevenueCat,
  loginUser,
  logoutUser,
  getCustomerInfo,
  hasPremiumEntitlement,
  getOfferings,
  purchasePackage,
  restorePurchases,
  PREMIUM_ENTITLEMENT,
} from "../lib/revenuecat";

interface SubscriptionContextValue {
  // State
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  packages: PurchasesPackage[];

  // Actions
  checkSubscription: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refreshOfferings: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize RevenueCat and check subscription status
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get user ID from Clerk
        const userId = user?.id;

        // Initialize RevenueCat
        await initializeRevenueCat(userId);

        // If user is logged in, link their account
        if (userId) {
          await loginUser(userId);
        }

        // Check subscription status
        const info = await getCustomerInfo();
        if (info) {
          setCustomerInfo(info);
          setIsPremium(hasPremiumEntitlement(info));
        }

        // Load available packages
        const offering = await getOfferings();
        if (offering?.availablePackages) {
          setPackages(offering.availablePackages);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize subscriptions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Listen for customer info updates from RevenueCat
    Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
      setIsPremium(hasPremiumEntitlement(info));
    });

    // Note: RevenueCat listener persists until app restart
    return () => {
      // No cleanup needed for RevenueCat listener
    };
  }, []);

  // Handle auth state changes from Clerk
  useEffect(() => {
    if (!isInitialized) return;

    const handleAuthChange = async () => {
      if (isSignedIn && user?.id) {
        await loginUser(user.id);
        const info = await getCustomerInfo();
        if (info) {
          setCustomerInfo(info);
          setIsPremium(hasPremiumEntitlement(info));
        }
      } else if (!isSignedIn) {
        await logoutUser();
        setCustomerInfo(null);
        setIsPremium(false);
      }
    };

    handleAuthChange();
  }, [isSignedIn, user?.id, isInitialized]);

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    setIsLoading(true);
    try {
      const info = await getCustomerInfo();
      if (info) {
        setCustomerInfo(info);
        setIsPremium(hasPremiumEntitlement(info));
      }
    } catch (error) {
      console.error("Failed to check subscription:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Purchase a package
  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const { success, customerInfo: newInfo } = await purchasePackage(pkg);
      if (success && newInfo) {
        setCustomerInfo(newInfo);
        setIsPremium(hasPremiumEntitlement(newInfo));
      }
      return success;
    } catch (error) {
      console.error("Purchase failed:", error);
      throw error;
    }
  }, []);

  // Restore purchases
  const restore = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const info = await restorePurchases();
      if (info) {
        setCustomerInfo(info);
        const hasPremium = hasPremiumEntitlement(info);
        setIsPremium(hasPremium);
        return hasPremium;
      }
      return false;
    } catch (error) {
      console.error("Restore failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh available offerings
  const refreshOfferings = useCallback(async () => {
    try {
      const offering = await getOfferings();
      if (offering?.availablePackages) {
        setPackages(offering.availablePackages);
      }
    } catch (error) {
      console.error("Failed to refresh offerings:", error);
    }
  }, []);

  const value: SubscriptionContextValue = {
    isPremium,
    isLoading,
    customerInfo,
    packages,
    checkSubscription,
    purchase,
    restore,
    refreshOfferings,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to access subscription context
 */
export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
