import { Product } from "../models/Product";
import { apiClient, PaginatedResponse, PaginationParams } from "./api";

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
    if (Array.isArray(response.data)) {
      return {
        data: response.data as Product[],
        total: response.data.length,
        page,
        limit,
        totalPages: Math.ceil(response.data.length / limit),
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