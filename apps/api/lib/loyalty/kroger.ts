// lib/loyalty/kroger.ts
// Kroger API integration for purchase history

import { categorizeIngredient } from "../grocery-generator";
import type { LoyaltyOrder, LoyaltyPurchaseItem } from "./types";

const KROGER_API = "https://api.kroger.com/v1";

interface KrogerPurchase {
  productId: string;
  description: string;
  brand?: string;
  quantity: number;
  price?: { regular: number };
  upc?: string;
  categories?: string[];
}

interface KrogerPurchaseHistoryResponse {
  data?: {
    purchases?: {
      date: string;
      locationId?: string;
      items: KrogerPurchase[];
    }[];
  };
}

/**
 * Fetch purchase history from Kroger API.
 * Requires a user access token obtained via OAuth 2.0.
 */
export async function fetchKrogerPurchases(
  accessToken: string,
  lookbackDays: number,
): Promise<LoyaltyOrder[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);
  const startStr = startDate.toISOString().split("T")[0];

  const response = await fetch(
    `${KROGER_API}/purchases?filter.start=${startStr}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Kroger API returned ${response.status}`);
  }

  const data = (await response.json()) as KrogerPurchaseHistoryResponse;
  const purchases = data.data?.purchases ?? [];

  return purchases.map((purchase) => ({
    date: purchase.date,
    store: purchase.locationId ? `Kroger #${purchase.locationId}` : null,
    items: purchase.items
      .filter(isFoodItem)
      .map(toStandardItem),
  }));
}

function isFoodItem(item: KrogerPurchase): boolean {
  // Kroger categorizes products; filter to food-related categories
  const nonFoodKeywords = ["cleaning", "paper", "laundry", "pet", "health", "beauty", "household"];
  const desc = (item.description ?? "").toLowerCase();
  const cats = (item.categories ?? []).join(" ").toLowerCase();
  return !nonFoodKeywords.some((kw) => desc.includes(kw) || cats.includes(kw));
}

function toStandardItem(item: KrogerPurchase): LoyaltyPurchaseItem {
  const name = item.brand
    ? `${item.brand} ${item.description}`
    : item.description;

  return {
    name,
    brand: item.brand ?? null,
    quantity: item.quantity || 1,
    unit: "piece",
    category: categorizeIngredient(item.description),
    upc: item.upc ?? null,
    price: item.price?.regular ?? null,
  };
}
