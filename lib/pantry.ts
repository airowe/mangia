import { PantryItem, Product } from "../models/Product";
import { apiClient } from "./api/client";
import { supabase } from "./supabase";
import { ApiResponse } from "./api/client";
import { AxiosError } from "axios";

export const addToPantry = async (
  product: PantryItem
): Promise<{ data: PantryItem | null; error: Error | null }> => {
  try {
    const response = await apiClient.post<ApiResponse<PantryItem>>(
      "/pantry/items",
      {
        ...product,
        quantity: product.quantity || 1,
      }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error("No data returned from server");
    }

    return { data: response.data, error: null };
  } catch (error) {
    console.error("Error saving to pantry:", error);
    const errorMessage =
      error instanceof Error ? error : new Error("Failed to save to pantry");
    return { data: null, error: errorMessage };
  }
};

// Fetch user's pantry items
export const fetchPantryItems = async (): Promise<PantryItem[]> => {
  try {
    const response = await apiClient.get<ApiResponse<PantryItem[]>>(
      "/pantry/items"
    );

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      return [];
    }

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response?.status === 401) {
      try {
        const { data, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError || !data.session) {
          throw new Error("Session expired. Please log in again.");
        }

        const retryResponse = await apiClient.get<ApiResponse<PantryItem[]>>(
          "/pantry/items"
        );

        if (retryResponse.error) {
          throw new Error(retryResponse.error);
        }

        return retryResponse.data || [];
      } catch (retryError) {
        throw new Error(
          "Failed to load pantry after session refresh. Please try again."
        );
      }
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch pantry items. Please check your connection and try again."
    );
  }
};

// Update pantry item quantity
export const updatePantryItemQuantity = async (
  productId: string,
  quantity: number
): Promise<{ data: PantryItem | null; error: Error | null }> => {
  try {
    const response = await apiClient.put<ApiResponse<PantryItem>>(
      `/pantry/items/${productId}`,
      { quantity }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return { data: response.data || null, error: null };
  } catch (error) {
    console.error("Error in updatePantryItemQuantity:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Unknown error updating quantity"),
    };
  }
};

// Remove item from pantry
export const removeFromPantry = async (itemId: string): Promise<boolean> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(
      `/pantry/items/${itemId}`
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return true;
  } catch (error) {
    console.error("Error removing item from pantry:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to remove item"
    );
  }
};
