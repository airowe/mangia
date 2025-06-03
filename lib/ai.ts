import Tesseract from 'tesseract.js';
import { apiClient } from './api/client';
import { Alert } from 'react-native';
import { Product } from '../models/Product';

export const extractTextFromImage = async (uri: string) => {
  const result = await Tesseract.recognize(uri, 'eng');
  return result.data.text;
};

export interface BarcodeLookupResponse {
  data: Product | null;
  error?: string;
}

export const lookupBarcode = async (barcode: string): Promise<BarcodeLookupResponse | null> => {
  try {
    const response = await apiClient.get<BarcodeLookupResponse>(`/lookup-barcode?barcode=${barcode}`);

    Alert.alert("Barcode lookup", JSON.stringify(response));
    
    if (response.error || !response.data) {
      console.error('Barcode lookup error:', response.error || 'No product found');
      return { 
        data: null, 
        error: response.error || 'No product information available' 
      };
    }

    return response;
  } catch (error) {
    console.error('Error in barcode lookup:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to lookup barcode' 
    };
  }
};