import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// These should be stored in your environment variables
const VERYFI_CLIENT_ID = process.env.EXPO_PUBLIC_VERYFI_CLIENT_ID || '';
const VERYFI_AUTH_USERNAME = process.env.EXPO_PUBLIC_VERYFI_AUTH_USERNAME || '';
const VERYFI_AUTH_APIKEY = process.env.EXPO_PUBLIC_VERYFI_AUTH_APIKEY || '';

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
  tax: number;
  subtotal: number;
  vendor: {
    name: string;
    address: string;
  };
  line_items: ReceiptItem[];
  raw_text: string;
}

const VERYFI_API_URL = 'https://api.veryfi.com/api/v8/partner/documents';

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
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Receipt scanning error:', error);
      throw new Error('Failed to process receipt');
    }

    const data = await response.json();
    return {
      id: data.id,
      date: data.date,
      total: data.total,
      tax: data.tax,
      subtotal: data.subtotal,
      vendor: {
        name: data.vendor.name || 'Unknown',
        address: data.vendor.address || '',
      },
      line_items: data.line_items.map((item: any) => ({
        name: item.description || 'Unknown Item',
        quantity: item.quantity || 1,
        price: item.price || 0,
        total: item.total || 0,
      })),
      raw_text: data.ocr_text,
    };
  } catch (error) {
    console.error('Error in scanReceipt:', error);
    throw error;
  }
};

export const mockScanReceipt = async (): Promise<ReceiptData> => {
  // Mock response for testing
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 'mock_' + Date.now(),
        date: new Date().toISOString(),
        total: 24.99,
        tax: 2.00,
        subtotal: 22.99,
        vendor: {
          name: 'Mock Grocery Store',
          address: '123 Main St, Anytown, USA',
        },
        line_items: [
          { name: 'Organic Apples', quantity: 2, price: 1.50, total: 3.00 },
          { name: 'Whole Grain Bread', quantity: 1, price: 3.99, total: 3.99 },
          { name: 'Almond Milk', quantity: 1, price: 3.50, total: 3.50 },
          { name: 'Free Range Eggs', quantity: 1, price: 4.99, total: 4.99 },
          { name: 'Bananas', quantity: 1, price: 0.59, total: 0.59 },
          { name: 'Spinach', quantity: 1, price: 2.99, total: 2.99 },
          { name: 'Greek Yogurt', quantity: 2, price: 1.49, total: 2.98 },
        ],
        raw_text: 'Mock receipt text...',
      });
    }, 1500);
  });
};
