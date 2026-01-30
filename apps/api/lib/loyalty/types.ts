// lib/loyalty/types.ts
// Shared types for loyalty account integrations

import type { IngredientCategory } from "@mangia/shared";

export interface LoyaltyProvider {
  id: string;
  name: string;
  logo: string;
  status: "active" | "coming_soon";
}

export interface LoyaltyPurchaseItem {
  name: string;
  brand: string | null;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  upc: string | null;
  price: number | null;
}

export interface LoyaltyOrder {
  date: string;
  store: string | null;
  items: LoyaltyPurchaseItem[];
}

export interface LoyaltySyncResult {
  provider: string;
  orders: LoyaltyOrder[];
  totalItems: number;
}
