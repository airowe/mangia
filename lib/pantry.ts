import { Product } from '../models/Product';
import { apiClient } from './api/client';
import { supabase } from './supabase';

// Define response types
interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface AxiosError extends Error {
  response?: {
    status: number;
    data: any;
  };
}

export interface PantryItem {
  id: string;
  product_id: string;
  name: string;
  barcode: string;
  image_url?: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  category?: string;
  location?: string;
}

// Map PantryItem to Product
export const mapToProduct = (item: PantryItem): Product => ({
  id: item.id,
  title: item.name,
  barcode: item.barcode,
  imageUrl: item.image_url,
  quantity: item.quantity,
  category: item.category || 'Uncategorized',
  location: item.location || 'Pantry',
  unit: 'pcs', // Default unit, adjust as needed
});

// Fetch all products (consider pagination if you have many products)
// export const fetchAllProducts = async (): Promise<Product[]> => {
//   try {
//     const response = await apiClient.get<ApiResponse<Product[]>>('/products');
//     if (response.error) {
//       throw new Error(response.error);
//     }
//     return response.data || [];
//   } catch (error) {
//     console.error('Error fetching products:', error);
//     throw new Error(error instanceof Error ? error.message : 'Failed to fetch products');
//   }
// };

// Add a product to the user's pantry
export const saveToPantry = async (product: Product): Promise<{ data: Product | null; error: Error | null }> => {
  try {
    const response = await apiClient.post<ApiResponse<PantryItem>>('/pantry/add-item', {
      product_id: product.id,
      title: product.title,
      barcode: product.barcode,
      image_url: product.imageUrl,
      quantity: product.quantity || 1
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (!response.data) {
      throw new Error('No data returned from server');
    }
    
    const mappedProduct = mapToProduct(response.data);
    return { data: mappedProduct, error: null };
  } catch (error) {
    console.error('Error saving to pantry:', error);
    const errorMessage = error instanceof Error ? error : new Error('Failed to save to pantry');
    return { data: null, error: errorMessage };
  }
};

// Fetch user's pantry items
export const fetchPantryItems = async (): Promise<Product[]> => {
  try {
    const response = await apiClient.get<ApiResponse<PantryItem[]>>('/pantry/fetch-pantry');
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (!response.data) {
      return [];
    }
    
    return response.data.map(mapToProduct);
  } catch (error) {
    const axiosError = error as AxiosError;
    
    if (axiosError.response?.status === 401) {
      try {
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !data.session) {
          throw new Error('Session expired. Please log in again.');
        }
        
        const retryResponse = await apiClient.get<ApiResponse<PantryItem[]>>('/pantry/fetch-pantry');
        
        if (retryResponse.error) {
          throw new Error(retryResponse.error);
        }
        
        return (retryResponse.data || []).map(mapToProduct);
      } catch (retryError) {
        throw new Error('Failed to load pantry after session refresh. Please try again.');
      }
    }
    
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch pantry items. Please check your connection and try again.'
    );
  }
};

// Update pantry item quantity
export const updatePantryItemQuantity = async (
  productId: string, 
  quantity: number
): Promise<{ data: Product | null; error: Error | null }> => {
  try {
    console.log('Updating quantity via API:', { productId, quantity });
    const response = await apiClient.post<ApiResponse<PantryItem>>(
      '/pantry/update-quantity', 
      { productId, quantity }
    );
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    const product = response.data ? mapToProduct(response.data) : null;
    console.log('Successfully updated quantity:', product);
    return { data: product, error: null };
  } catch (error) {
    console.error('Error in updatePantryItemQuantity:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error updating quantity') 
    };
  }
};

// Remove item from pantry
export const removeFromPantry = async (itemId: string): Promise<boolean> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(
      '/pantry/remove-item', 
      { data: { itemId } }
    );
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return true;
  } catch (error) {
    console.error('Error removing item from pantry:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to remove item');
  }
};