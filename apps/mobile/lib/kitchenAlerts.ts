// lib/kitchenAlerts.ts
// API service for kitchen alerts (pantry expiry)

import { apiClient } from "./api/client";
import { RequestOptions } from "../hooks/useAbortableEffect";

export interface AlertItem {
  id: string;
  name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  expiryDate: string;
  expiryText: string;
  daysUntilExpiry: number;
}

export interface AlertsResponse {
  expired: AlertItem[];
  expiring: AlertItem[];
  counts: {
    expired: number;
    expiring: number;
    total: number;
  };
}

export interface AlertFilterParams {
  window?: number;
  category?: string;
}

/**
 * Fetch pantry alerts (expired and expiring items) from the server.
 */
export async function fetchPantryAlerts(
  params: AlertFilterParams = {},
  options?: RequestOptions,
): Promise<AlertsResponse> {
  const searchParams = new URLSearchParams();
  if (params.window !== undefined) {
    searchParams.set("window", String(params.window));
  }
  if (params.category) {
    searchParams.set("category", params.category);
  }

  const qs = searchParams.toString();
  const url = qs ? `/api/pantry/alerts?${qs}` : "/api/pantry/alerts";

  try {
    const response = await apiClient.get<AlertsResponse>(url, {
      signal: options?.signal,
    });
    return {
      expired: response.expired || [],
      expiring: response.expiring || [],
      counts: response.counts || { expired: 0, expiring: 0, total: 0 },
    };
  } catch (error) {
    console.error("Error fetching pantry alerts:", error);
    throw error;
  }
}
