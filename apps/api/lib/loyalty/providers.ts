// lib/loyalty/providers.ts
// Available loyalty provider metadata

import type { LoyaltyProvider } from "./types";

export const LOYALTY_PROVIDERS: LoyaltyProvider[] = [
  {
    id: "kroger",
    name: "Kroger",
    logo: "https://www.kroger.com/favicon.ico",
    status: "active",
  },
  {
    id: "walmart",
    name: "Walmart",
    logo: "https://www.walmart.com/favicon.ico",
    status: "coming_soon",
  },
  {
    id: "instacart",
    name: "Instacart",
    logo: "https://www.instacart.com/favicon.ico",
    status: "coming_soon",
  },
  {
    id: "target",
    name: "Target",
    logo: "https://www.target.com/favicon.ico",
    status: "coming_soon",
  },
];

export function getProvider(id: string): LoyaltyProvider | undefined {
  return LOYALTY_PROVIDERS.find((p) => p.id === id);
}
