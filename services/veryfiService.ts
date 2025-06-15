import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// These should be stored in your environment variables
const VERYFI_CLIENT_ID = process.env.EXPO_PUBLIC_VERYFI_CLIENT_ID || '';
const VERYFI_AUTH_USERNAME = process.env.EXPO_PUBLIC_VERYFI_AUTH_USERNAME || '';
const VERYFI_AUTH_APIKEY = process.env.EXPO_PUBLIC_VERYFI_AUTH_APIKEY || '';
const VERYFI_API_URL = 'https://api.veryfi.com/api/v8/partner/documents';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReceiptData {
  id: string;
  date: string;
  total: number;
  subtotal: number;
  tax: number;
  vendor: {
    name: string;
    address: string;
  };
  items: ReceiptItem[];
  raw_text: string;
}

export const scanReceipt = async (imageUri: string): Promise<ReceiptData> => {
  try {
    // Convert the image to base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await fetch(VERYFI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': VERYFI_CLIENT_ID,
        'Authorization': `apikey ${VERYFI_AUTH_USERNAME}:${VERYFI_AUTH_APIKEY}`,
      },
      body: JSON.stringify({
        file_name: `receipt_${Date.now()}.jpg`,
        file_data: base64Image,
        categories: ['Grocery', 'Food'],
        auto_delete: true, // Delete from Veryfi servers after processing
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to process receipt');
    }

    const data = await response.json();

    // Transform Veryfi response to our ReceiptData format
    return {
      id: data.id,
      date: data.date || new Date().toISOString(),
      total: data.total || 0,
      subtotal: data.subtotal || 0,
      tax: data.tax || 0,
      vendor: {
        name: data.vendor?.name || 'Unknown',
        address: data.vendor?.address || '',
      },
      items: (data.line_items || []).map((item: any) => ({
        name: item.description || 'Unknown Item',
        quantity: item.quantity || 1,
        price: item.price || 0,
        total: item.total || 0,
      })),
      raw_text: data.ocr_text || '',
    };
  } catch (error) {
    console.error('Error in scanReceipt:', error);
    throw new Error('Failed to process receipt. Please try again.');
  }
};

// Helper function to merge receipt items with pantry items
export const mergeWithPantry = (
  receiptItems: ReceiptItem[], 
  pantryItems: { name: string; id: string }[]
) => {
  return receiptItems.map(item => {
    // Find matching pantry item by name (case insensitive)
    const matchingPantryItem = pantryItems.find(pantryItem => 
      pantryItem.name.toLowerCase() === item.name.toLowerCase()
    );
    
    return {
      ...item,
      id: matchingPantryItem?.id, // Add pantry item ID if found
    };
  });
};
