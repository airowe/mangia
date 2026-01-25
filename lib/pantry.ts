import { PantryItem } from "../models/Product";
import { apiClient } from "./api/client";
import { ApiResponse } from "./api/client";

export const addToPantry = async (
  product: PantryItem
): Promise<{ data: PantryItem | null; error: Error | null }> => {
  try {
    const response = await apiClient.post<ApiResponse<PantryItem>>(
      "/api/pantry",
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
    const response = await apiClient.get<PantryItem[]>("/api/pantry");
    return response || [];
  } catch (error) {
    console.error("Error fetching pantry items:", error);
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
    const response = await apiClient.patch<PantryItem>(
      `/api/pantry/${productId}`,
      { quantity }
    );

    return { data: response || null, error: null };
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
    await apiClient.delete(`/api/pantry/${itemId}`);
    return true;
  } catch (error) {
    console.error("Error removing item from pantry:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to remove item"
    );
  }
};
