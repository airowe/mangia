export interface UserSubscription {
  user_id: string;
  is_premium: boolean;
  plan_type?: 'monthly' | 'yearly';
  expires_at?: string;
  revenuecat_customer_id?: string;
  updated_at: string;
}

// RevenueCat entitlements
export const ENTITLEMENTS = {
  PREMIUM: 'premium',
} as const;

// Product identifiers (must match RevenueCat dashboard)
export const PRODUCTS = {
  MONTHLY: 'mangia_premium_monthly',
  YEARLY: 'mangia_premium_yearly',
} as const;

// Free tier limits
export const FREE_TIER_LIMITS = {
  RECIPES_PER_MONTH: 3,
} as const;
