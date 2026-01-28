import { IngredientCategory } from './Recipe';

// Legacy Product interface - kept for backward compatibility with existing code
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

// Pantry item for tracking what ingredients user has at home
export interface PantryItem {
  id: string;
  user_id?: string;            // Optional for backward compatibility
  title: string;               // "Chicken breast", "Eggs"
  quantity?: number;
  unit?: string;
  category?: IngredientCategory | string;  // Allow string for backward compatibility
  expiry_date?: string;        // ISO date string
  location?: string;           // "fridge", "freezer", "pantry"
  imageUrl?: string;
  image?: string;              // Alias for imageUrl (backward compat)
  price?: number;              // Optional, for backward compatibility
  description?: string;        // Optional, for backward compatibility
  brand?: string;              // Optional, for backward compatibility
  created_at?: string;         // Optional for backward compatibility
  updated_at?: string;
}
