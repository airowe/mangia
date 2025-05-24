import Tesseract from 'tesseract.js';
import { apiClient } from './api/client';
import { Alert } from 'react-native';

export const extractTextFromImage = async (uri: string) => {
  const result = await Tesseract.recognize(uri, 'eng');
  return result.data.text;
};

export interface BarcodeProduct {
  attributes: {
    product: string;
    description: string;
    asin_com?: string;
    category: string;
    category_text: string;
    category_text_long: string;
    long_desc: string;
    similar?: string;
    language?: string;
    language_text?: string;
    language_text_long?: string;
  };
  EAN13: string;
  UPCA: string;
  barcode: {
    EAN13: string;
    UPCA: string;
  };
  locked?: string;
  modified?: string;
  hasImage?: string;
  image?: string;
  error?: string;
  unit?: string;
}

export interface BarcodeLookupResponse {
  product: BarcodeProduct | null;
  error?: string;
}

export const lookupBarcode = async (barcode: string): Promise<BarcodeLookupResponse | null> => {
  try {
    const response = await apiClient.get<BarcodeLookupResponse>(`/lookup-barcode?barcode=${barcode}`);

    Alert.alert("Barcode lookup", JSON.stringify(response));
    
    if (response.error || !response.product) {
      console.error('Barcode lookup error:', response.error || 'No product found');
      return { 
        product: null, 
        error: response.error || 'No product information available' 
      };
    }

    return response;
  } catch (error) {
    console.error('Error in barcode lookup:', error);
    return { 
      product: null, 
      error: error instanceof Error ? error.message : 'Failed to lookup barcode' 
    };
  }
};