import { PantryItem } from "../models/Product";
import { IngredientCategory } from "../models/Recipe";
import { apiClient } from "./api/client";
import { ApiResponse } from "./api/client";
import { DEV_BYPASS_AUTH } from "./devConfig";
import { RequestOptions } from "../hooks/useAbortableEffect";

export interface ScannedPantryItem {
  name: string;
  category: IngredientCategory;
  confidence: number;
  quantity: number;
  unit: string;
  expiryDate: string | null;
}

// Mock pantry data for dev bypass mode
const MOCK_PANTRY_ITEMS: PantryItem[] = [
  {
    id: 'pantry-1',
    title: 'Eggs',
    quantity: 12,
    unit: 'large',
    location: 'fridge',
    category: 'dairy_eggs',
  },
  {
    id: 'pantry-2',
    title: 'Butter',
    quantity: 2,
    unit: 'sticks',
    location: 'fridge',
    category: 'dairy_eggs',
  },
  {
    id: 'pantry-3',
    title: 'All-purpose flour',
    quantity: 5,
    unit: 'lbs',
    location: 'pantry',
    category: 'pantry',
  },
  {
    id: 'pantry-4',
    title: 'Olive oil',
    quantity: 1,
    unit: 'bottle',
    location: 'pantry',
    category: 'pantry',
  },
  {
    id: 'pantry-5',
    title: 'Parmesan cheese',
    quantity: 8,
    unit: 'oz',
    location: 'fridge',
    category: 'dairy_eggs',
  },
  {
    id: 'pantry-6',
    title: 'Chicken breast',
    quantity: 2,
    unit: 'lbs',
    location: 'freezer',
    category: 'meat_seafood',
  },
  {
    id: 'pantry-7',
    title: 'Garlic',
    quantity: 1,
    unit: 'head',
    location: 'pantry',
    category: 'produce',
  },
  {
    id: 'pantry-8',
    title: 'Onions',
    quantity: 3,
    unit: 'medium',
    location: 'pantry',
    category: 'produce',
  },
  {
    id: 'pantry-9',
    title: 'Canned tomatoes',
    quantity: 4,
    unit: 'cans',
    location: 'pantry',
    category: 'pantry',
  },
  {
    id: 'pantry-10',
    title: 'Pasta (spaghetti)',
    quantity: 2,
    unit: 'lbs',
    location: 'pantry',
    category: 'pantry',
  },
];

// In-memory store for mock pantry mutations
let mockPantryStore = [...MOCK_PANTRY_ITEMS];
let mockPantryIdCounter = 11;

function simulateDelay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const addToPantry = async (
  product: PantryItem
): Promise<{ data: PantryItem | null; error: Error | null }> => {
  // Use mock data in dev bypass mode
  if (DEV_BYPASS_AUTH) {
    await simulateDelay();
    const newItem: PantryItem = {
      ...product,
      id: `pantry-${mockPantryIdCounter++}`,
      quantity: product.quantity || 1,
    };
    mockPantryStore.unshift(newItem);
    return { data: newItem, error: null };
  }

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
export const fetchPantryItems = async (
  options?: RequestOptions,
): Promise<PantryItem[]> => {
  // Use mock data in dev bypass mode
  console.log('[Pantry] DEV_BYPASS_AUTH:', DEV_BYPASS_AUTH);
  if (DEV_BYPASS_AUTH) {
    console.log('[Pantry] Using mock data');
    await simulateDelay();
    return mockPantryStore;
  }

  console.log('[Pantry] Fetching from API...');
  try {
    const response = await apiClient.get<PantryItem[]>(
      "/api/pantry",
      { signal: options?.signal }
    );
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
  // Use mock data in dev bypass mode
  if (DEV_BYPASS_AUTH) {
    await simulateDelay();
    const index = mockPantryStore.findIndex(item => item.id === productId);
    if (index === -1) {
      return { data: null, error: new Error('Item not found') };
    }
    mockPantryStore[index] = { ...mockPantryStore[index], quantity };
    return { data: mockPantryStore[index], error: null };
  }

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

// Scan pantry image using AI vision
export const scanPantryImage = async (
  imageBase64: string,
  extractExpiry: boolean = true,
): Promise<ScannedPantryItem[]> => {
  try {
    const response = await apiClient.post<{ items: ScannedPantryItem[] }>(
      "/api/pantry/scan",
      { imageBase64, extractExpiry },
    );
    return response.items || [];
  } catch (error) {
    console.error("Error scanning pantry image:", error);
    throw error;
  }
};

// Remove item from pantry
export const removeFromPantry = async (itemId: string): Promise<boolean> => {
  // Use mock data in dev bypass mode
  if (DEV_BYPASS_AUTH) {
    await simulateDelay();
    const index = mockPantryStore.findIndex(item => item.id === itemId);
    if (index !== -1) {
      mockPantryStore.splice(index, 1);
    }
    return true;
  }

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
