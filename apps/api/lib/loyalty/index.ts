// lib/loyalty/index.ts
// Loyalty account sync orchestrator

import { fetchKrogerPurchases } from "./kroger";
import type { LoyaltySyncResult } from "./types";

/**
 * Sync purchases from a loyalty provider.
 */
export async function syncLoyaltyPurchases(
  provider: string,
  accessToken: string,
  lookbackDays: number,
): Promise<LoyaltySyncResult> {
  switch (provider) {
    case "kroger": {
      const orders = await fetchKrogerPurchases(accessToken, lookbackDays);
      const totalItems = orders.reduce((sum, o) => sum + o.items.length, 0);
      return { provider, orders, totalItems };
    }
    default:
      throw new Error(`Provider "${provider}" is not supported yet`);
  }
}

export { LOYALTY_PROVIDERS, getProvider } from "./providers";
export type { LoyaltyProvider, LoyaltySyncResult, LoyaltyOrder, LoyaltyPurchaseItem } from "./types";
