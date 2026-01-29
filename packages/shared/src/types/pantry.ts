// Pantry-related shared types

import { IngredientCategory } from './recipe';

export interface Product {
  id: string;
  title: string;
  description?: string;
  category?: string;
  unit?: string;
  quantity?: number;
  price?: number;
  imageUrl?: string;
  location?: string;
  brand?: string;
  created_at?: string;
}

export interface PantryItem {
  id: string;
  user_id?: string;
  title: string;
  quantity?: number;
  unit?: string;
  category?: IngredientCategory | string;
  expiry_date?: string;
  location?: string;
  imageUrl?: string;
  image?: string;
  price?: number;
  description?: string;
  brand?: string;
  created_at?: string;
  updated_at?: string;
}
