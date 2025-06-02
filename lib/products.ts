import { Product } from "../models/Product";
import { apiClient, PaginatedResponse, PaginationParams } from "./api";

// Helper function to validate and clean product data
const validateAndCleanProduct = (product: any): Product | null => {
  if (!product || typeof product !== "object") return null;

  // Ensure the product has a valid ID
  if (!product.id) {
    console.warn("Product is missing an ID:", product);
    return null;
  }

  // Create a clean product object with only the fields we expect
  const cleanProduct: Product = {
    id: String(product.id), // Ensure ID is a string
    title: product.title || "Untitled Product",
    category: product.category || "Uncategorized",
    unit: product.unit || "unit",
    // Optional fields with defaults
    ...(product.description && { description: product.description }),
    ...(product.quantity && { quantity: Number(product.quantity) }),
    ...(product.location && { location: product.location }),
    ...(product.price && { price: Number(product.price) }),
    ...(product.image && { image: product.image }),
    ...(product.imageUrl && { imageUrl: product.imageUrl }),
    ...(product.barcode && { barcode: product.barcode }),
    ...(product.brand && { brand: product.brand }),
    ...(product.EAN13 && { EAN13: product.EAN13 }),
    ...(product.UPCA && { UPCA: product.UPCA }),
    ...(product.expiryDate && { expiryDate: product.expiryDate }),
    ...(product.user_id && { user_id: product.user_id }),
  };

  return cleanProduct;
};

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

    let products: Product[] = [];
    let total = 0;
    let totalPages = 1;

    // Handle different response formats and extract products array
    if (Array.isArray(response.data)) {
      products = response.data;
      total = response.data.length;
      totalPages = Math.ceil(total / limit);
    } else if (response.data && Array.isArray(response.data)) {
      products = response.data;
      total = response.totalItems || response.data.length;
      totalPages = response.totalPages || Math.ceil(total / limit) || 1;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      products = response.data.data;
      total = response.data.total || response.data.data.length;
      totalPages = response.data.totalPages || Math.ceil(total / limit) || 1;
    }

    // Validate and clean all products, filtering out any invalid ones
    const validProducts = products
      .map(validateAndCleanProduct)
      .filter((p): p is Product => p !== null);

    // Log a warning if any products were filtered out
    if (validProducts.length < products.length) {
      console.warn(
        `Filtered out ${
          products.length - validProducts.length
        } invalid products`
      );
    }

    return {
      data: validProducts,
      total: validProducts.length, // Update total to reflect filtered count
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    console.error("Error in fetchAllProducts:", error);
    // Return empty result on error
    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
    };
  }
};
