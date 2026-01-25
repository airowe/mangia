// lib/revenuecat.ts
// RevenueCat SDK integration for subscription management

import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  PurchasesOffering,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";

// Environment configuration - should be in env vars in production
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || "";
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || "";

// Entitlement identifier from RevenueCat dashboard
export const PREMIUM_ENTITLEMENT = "premium";

// Product identifiers
export const PRODUCT_IDS = {
  MONTHLY: "mangia_premium_monthly",
  YEARLY: "mangia_premium_yearly",
};

/**
 * Initialize RevenueCat SDK
 * Should be called once when app starts
 */
export async function initializeRevenueCat(userId?: string): Promise<void> {
  try {
    // Set log level for debugging
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Configure with platform-specific API key
    const apiKey = Platform.OS === "ios"
      ? REVENUECAT_API_KEY_IOS
      : REVENUECAT_API_KEY_ANDROID;

    if (!apiKey) {
      console.warn("RevenueCat API key not configured");
      return;
    }

    await Purchases.configure({
      apiKey,
      appUserID: userId,
    });

    console.log("RevenueCat initialized successfully");
  } catch (error) {
    console.error("Failed to initialize RevenueCat:", error);
  }
}

/**
 * Login user to RevenueCat with their user ID
 * Links subscription status to user account
 */
export async function loginUser(userId: string): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    return customerInfo;
  } catch (error) {
    console.error("Failed to login to RevenueCat:", error);
    return null;
  }
}

/**
 * Logout user from RevenueCat
 */
export async function logoutUser(): Promise<void> {
  try {
    await Purchases.logOut();
  } catch (error) {
    console.error("Failed to logout from RevenueCat:", error);
  }
}

/**
 * Get current customer info including entitlements
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error("Failed to get customer info:", error);
    return null;
  }
}

/**
 * Check if user has active premium subscription
 */
export async function isPremiumUser(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
  } catch (error) {
    console.error("Failed to check premium status:", error);
    return false;
  }
}

/**
 * Check premium status from CustomerInfo object (for real-time checks)
 */
export function hasPremiumEntitlement(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
}

/**
 * Get available offerings (products for purchase)
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error("Failed to get offerings:", error);
    return null;
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ success: boolean; customerInfo: CustomerInfo | null }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo };
  } catch (error: any) {
    // Check if user cancelled
    if (error.userCancelled) {
      return { success: false, customerInfo: null };
    }

    console.error("Purchase failed:", error);
    throw error;
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.restorePurchases();
  } catch (error) {
    console.error("Failed to restore purchases:", error);
    throw error;
  }
}

/**
 * Get subscription expiration date if applicable
 */
export function getExpirationDate(customerInfo: CustomerInfo): Date | null {
  const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];
  if (entitlement?.expirationDate) {
    return new Date(entitlement.expirationDate);
  }
  return null;
}

/**
 * Check if subscription is in trial period
 */
export function isInTrialPeriod(customerInfo: CustomerInfo): boolean {
  const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];
  if (entitlement?.periodType) {
    return entitlement.periodType === "TRIAL";
  }
  return false;
}

/**
 * Format price for display
 */
export function formatPrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString;
}

/**
 * Get subscription period text
 */
export function getSubscriptionPeriod(pkg: PurchasesPackage): string {
  const period = pkg.product.subscriptionPeriod;
  if (!period) return "";

  if (period.includes("P1M")) return "month";
  if (period.includes("P1Y")) return "year";
  if (period.includes("P1W")) return "week";

  return period;
}
