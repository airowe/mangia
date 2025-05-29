import { Alert } from "react-native";
import { Product } from "../models/Product";
import { apiClient } from "./api/client";
import { supabase } from "./supabase";

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface AxiosError extends Error {
  response?: {
    status: number;
    data: any;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const fetchAllProducts = async ({
  page = 1,
  limit = 20,
}: PaginationParams = {}): Promise<PaginatedResponse<Product>> => {
  try {
    const response = await apiClient.get<any>("/products", {
      params: {
        page: String(page),
        limit: String(limit),
      },
    });

    if (response.error) {
      console.error("API Error:", response.error);
      throw new Error(response.error);
    }

    // Handle case where the response is an array directly
    if (Array.isArray(response)) {
      return {
        data: response as Product[],
        total: response.length,
        page,
        limit,
        totalPages: Math.ceil(response.length / limit),
      };
    }

    // Handle case where response has a data array and pagination info
    if (response.data && Array.isArray(response.data)) {
      return {
        data: response.data as Product[],
        total: response.totalItems || response.data.length,
        page: response.page || page,
        limit: response.pageSize || limit,
        totalPages:
          response.totalPages ||
          Math.ceil(
            (response.totalItems || 0) / (response.pageSize || limit)
          ) ||
          1,
      };
    }

    // Handle case where response.data is an object with a data array
    if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      const data = response.data;
      return {
        data: data.data as Product[],
        total: data.totalItems || data.total || data.data.length,
        page: data.page || page,
        limit: data.pageSize || data.limit || limit,
        totalPages:
          data.totalPages ||
          Math.ceil(
            (data.totalItems || data.total || 0) /
              (data.pageSize || data.limit || limit)
          ) ||
          1,
      };
    }

    // Fallback for unexpected response format
    console.warn("Unexpected response format:", response);
    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch products"
    );
  }
};

export const addToPantry = async (
  product: Product
): Promise<{ data: Product | null; error: Error | null }> => {
  try {
    const response = await apiClient.post<ApiResponse<Product>>(
      "/pantry/add-item",
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
export const fetchPantryItems = async (): Promise<Product[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Product[]>>(
      "/pantry/fetch-pantry"
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

        const retryResponse = await apiClient.get<ApiResponse<Product[]>>(
          "/pantry/fetch-pantry"
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
): Promise<{ data: Product | null; error: Error | null }> => {
  try {
    console.log("Updating quantity via API:", { productId, quantity });
    const response = await apiClient.post<ApiResponse<Product>>(
      "/pantry/update-quantity",
      { productId, quantity }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    console.log("Successfully updated quantity:", response.data);
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
      "/pantry/remove-item",
      { data: { itemId } }
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
