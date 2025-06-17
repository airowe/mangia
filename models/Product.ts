export interface Product {
  barcode?: string;
  category?: string;
  id: string;
  title: string;
  description?: string;
  unit?: string;
  created_at?: string;
  price?: number;
  image?: string;
  imageUrl?: string;
  asin?: string;
  brand?: string;
  EAN13?: string;
  UPCA?: string;
}

export interface PantryItem extends Product {
  quantity?: number;
  location?: string;
  expiryDate?: string;
  user_id?: string;
}