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
import { supabase } from "../lib/supabase";

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
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);

  // Initialize RevenueCat and check subscription status
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        // Initialize RevenueCat
        await initializeRevenueCat(user?.id);

        // If user is logged in, link their account
        if (user?.id) {
          await loginUser(user.id);
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
      } catch (error) {
        console.error("Failed to initialize subscriptions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await loginUser(session.user.id);
          const info = await getCustomerInfo();
          if (info) {
            setCustomerInfo(info);
            setIsPremium(hasPremiumEntitlement(info));
          }
        } else if (event === "SIGNED_OUT") {
          await logoutUser();
          setCustomerInfo(null);
          setIsPremium(false);
        }
      }
    );

    // Listen for customer info updates from RevenueCat
    Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
      setIsPremium(hasPremiumEntitlement(info));
    });

    return () => {
      subscription.unsubscribe();
      // Note: RevenueCat listener persists until app restart
    };
  }, []);

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
