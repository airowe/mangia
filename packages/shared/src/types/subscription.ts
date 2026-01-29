// Subscription shared types

export interface UserSubscription {
  userId: string;
  isPremium: boolean;
  planType?: 'monthly' | 'yearly';
  expiresAt?: string;
  revenuecatCustomerId?: string;
  updatedAt: string;
}

export const ENTITLEMENTS = {
  PREMIUM: 'premium',
} as const;

export const PRODUCTS = {
  MONTHLY: 'mangia_premium_monthly',
  YEARLY: 'mangia_premium_yearly',
} as const;

export const FREE_TIER_LIMITS = {
  RECIPES_PER_MONTH: 3,
} as const;
