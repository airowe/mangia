import { Product } from "../models/Product";
import { apiClient, PaginatedResponse, PaginationParams } from "./api";
import { Alert } from "react-native";

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
    ...(product.userId && { userId: product.userId }),
  };

  return cleanProduct;
};

/**
 * Create a new product
 * @param productData The product data to create
 * @returns The created product
 */
export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
  try {
    const response = await apiClient.post<Product>('/api/products', productData);
    const product = validateAndCleanProduct(response);
    if (!product) {
      throw new Error('Failed to create product: Invalid response from server');
    }
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Update an existing product
 * @param id The ID of the product to update
 * @param updates The fields to update
 * @returns The updated product
 */
export const updateProduct = async (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product> => {
  try {
    const response = await apiClient.put<Product>(`/api/products/${id}`, updates);
    const product = validateAndCleanProduct(response);
    if (!product) {
      throw new Error('Failed to update product: Invalid response from server');
    }
    return product;
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
};

/**
 * Get a product by ID
 * @param id The ID of the product to fetch
 * @returns The product if found, null otherwise
 */
export const getProduct = async (id: string): Promise<Product | null> => {
  try {
    const response = await apiClient.get<Product>(`/api/products/${id}`);
    return validateAndCleanProduct(response);
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

/**
 * Search for products by barcode
 * @param barcode The barcode to search for
 * @returns The product if found, null otherwise
 */
export const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
  try {
    const response = await apiClient.get<Product>(`/api/products/barcode/${barcode}`);
    return validateAndCleanProduct(response);
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    console.error(`Error fetching product with barcode ${barcode}:`, error);
    throw error;
  }
};

/**
 * Fetch all products with pagination
 * @param pagination Pagination parameters
 * @returns Paginated response of products
 */
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

export interface FetchProductsParams extends PaginationParams {
  q?: string;
  category?: string;
  barcode?: string;
  off_id?: string;
}

export const fetchProductsByQuery = async ({
  q,
  category,
  barcode,
  off_id,
  page = 1,
  limit = 5,
}: FetchProductsParams = {}): Promise<PaginatedResponse<Partial<Product>>> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (category) params.append('category', category);
    if (barcode) params.append('barcode', barcode);
    if (off_id) params.append('off_id', off_id);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await apiClient.get<PaginatedResponse<Partial<Product>>>(`/products?${params.toString()}`);
    
    return {
      data: response.data || [],
      total: response.total || 0,
      page: response.page || page,
      limit: response.limit || limit,
      totalPages: response.totalPages || 1,
    };
  } catch (error) {
    console.error("Error in fetchProductsByQuery:", error);
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 5,
      totalPages: 1,
    };
  }
};
