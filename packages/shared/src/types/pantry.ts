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
  createdAt?: string;
}

export type StockStatus = "critical" | "low" | "medium" | "full";

export interface PantryItem {
  id: string;
  userId?: string;
  name?: string;
  title: string;
  quantity?: number;
  unit?: string;
  category?: IngredientCategory | string;
  expiryDate?: string;
  notes?: string;
  location?: string;
  imageUrl?: string;
  image?: string;
  price?: number;
  description?: string;
  brand?: string;
  createdAt?: string;
  updatedAt?: string;
  stockStatus?: StockStatus;
  stockLabel?: string;
}
