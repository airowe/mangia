# RevenueCat Integration

## Overview

RevenueCat is **required** for the Shipyard competition. We'll use it to manage subscriptions and gate premium features.

---

## Subscription Tiers

### Free Tier
- Import up to **3 recipes per month**
- Basic grocery list generation
- Manual pantry tracking
- Recipe queue ("Want to Cook")

### Premium Tier
- **$4.99/month** or **$29.99/year** (save 50%)
- Unlimited recipe imports
- Smart pantry deduction from grocery list
- "What Can I Make?" feature
- Cookbook collection tracking
- Grocery list export/share
- Recipe serving scaling

---

## RevenueCat Setup

### 1. Create RevenueCat Account
- Sign up at https://app.revenuecat.com
- Create new project: "Mangia" (or your app name)

### 2. Configure Products

**In App Store Connect:**
1. Create subscription group: "Mangia Premium"
2. Create products:
   - `mangia_premium_monthly` — $4.99/month
   - `mangia_premium_yearly` — $29.99/year

**In RevenueCat Dashboard:**
1. Add App Store app
2. Import products
3. Create Entitlement: `premium`
4. Create Offering: `default`
   - Add both packages to offering

### 3. Install SDK

```bash
npx expo install react-native-purchases
```

### 4. Configure Expo

```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "react-native-purchases",
        {
          "iosApiKey": "your_revenuecat_ios_api_key"
        }
      ]
    ]
  }
}
```

---

## Implementation

### RevenueCat Service (`lib/revenuecat.ts`)

```typescript
// lib/revenuecat.ts
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!;

export async function initializeRevenueCat(userId?: string): Promangia<void> {
  Purchases.configure({ apiKey: API_KEY });
  
  if (userId) {
    await Purchases.logIn(userId);
  }
  
  if (__DEV__) {
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  }
}

export async function checkPremiumStatus(): Promangia<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

export async function getOfferings(): Promangia<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Error getting offerings:', error);
    return null;
  }
}

export async function purchasePackage(
  pkg: PurchasesPackage
): Promangia<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    await syncSubscriptionToSupabase(customerInfo);
    
    return {
      success: customerInfo.entitlements.active['premium'] !== undefined,
      customerInfo,
    };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false, error: 'Purchase cancelled' };
    }
    return { success: false, error: error.message };
  }
}

export async function restorePurchases(): Promangia<{
  success: boolean;
  isPremium: boolean;
}> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
    
    if (isPremium) {
      await syncSubscriptionToSupabase(customerInfo);
    }
    
    return { success: true, isPremium };
  } catch (error) {
    return { success: false, isPremium: false };
  }
}

async function syncSubscriptionToSupabase(customerInfo: CustomerInfo): Promangia<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  const premiumEntitlement = customerInfo.entitlements.active['premium'];
  
  await supabase.from('user_subscriptions').upsert({
    user_id: user.id,
    is_premium: !!premiumEntitlement,
    plan_type: premiumEntitlement?.productIdentifier.includes('yearly') ? 'yearly' : 'monthly',
    expires_at: premiumEntitlement?.expirationDate,
    revenuecat_customer_id: customerInfo.originalAppUserId,
    updated_at: new Date().toISOString(),
  });
}
```

---

### Subscription Context

```typescript
// contexts/SubscriptionContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeRevenueCat, checkPremiumStatus, getOfferings } from '../lib/revenuecat';
import { useAuth } from './AuthContext';

interface SubscriptionContextValue {
  isPremium: boolean;
  isLoading: boolean;
  offerings: any;
  refreshStatus: () => Promangia<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState(null);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await initializeRevenueCat(user?.id);
      
      const [premium, currentOfferings] = await Promangia.all([
        checkPremiumStatus(),
        getOfferings(),
      ]);
      
      setIsPremium(premium);
      setOfferings(currentOfferings);
      setIsLoading(false);
    }
    
    init();
  }, [user?.id]);

  const refreshStatus = async () => {
    const premium = await checkPremiumStatus();
    setIsPremium(premium);
  };

  return (
    <SubscriptionContext.Provider value={{ isPremium, isLoading, offerings, refreshStatus }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within SubscriptionProvider');
  return context;
};
```

---

### Premium Feature Gate Hook

```typescript
// hooks/usePremiumFeature.ts
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';

export function usePremiumFeature() {
  const { isPremium } = useSubscription();
  const navigation = useNavigation();

  const requirePremium = (featureName: string, callback: () => void) => {
    if (isPremium) {
      callback();
    } else {
      Alert.alert(
        'Premium Feature',
        `${featureName} is a premium feature. Upgrade to unlock!`,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Subscription' as never) },
        ]
      );
    }
  };

  return { isPremium, requirePremium };
}
```

---

### Recipe Import Limit Hook

```typescript
// hooks/useRecipeLimit.ts
import { useState, useEffect } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const FREE_LIMIT = 3;

export function useRecipeLimit() {
  const { isPremium } = useSubscription();
  const { user } = useAuth();
  const [recipesThisMonth, setRecipesThisMonth] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      if (!user) return;
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('recipes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      setRecipesThisMonth(count || 0);
    }

    fetchCount();
  }, [user]);

  return {
    canImport: isPremium || recipesThisMonth < FREE_LIMIT,
    remainingImports: isPremium ? Infinity : Math.max(0, FREE_LIMIT - recipesThisMonth),
    freeLimit: FREE_LIMIT,
  };
}
```

---

## Paywall Trigger Points

| Location | Trigger | Message |
|----------|---------|---------|
| Import Recipe | 4th recipe in month | "You've used your 3 free imports" |
| What Can I Make | Tap button | Premium feature gate |
| Cookbook Collection | Access screen | Premium feature gate |
| Export Grocery List | Tap share | Premium feature gate |

---

## Testing

1. Create App Store Connect sandbox tester
2. Sign out of App Store on device
3. Sign in with sandbox account during purchase
4. Purchases are free in sandbox mode

---

## App Store Requirements

- [ ] Terms of Service link in app
- [ ] Privacy Policy link in app
- [ ] Restore Purchases button accessible
- [ ] Subscription terms clearly displayed
- [ ] Auto-renewal disclosure on paywall
