// import { StorageCategory } from './constants';

export interface Product {
  barcode?: string;
  category: string;
  id: string;
  user_id?: string;
  title: string;
  quantity: number;
  unit: string;
  location: string;
  created_at?: string;
  price?: number;
  imageUrl?: string;
}

// Mock data for demonstration
export const MOCK_PRODUCTS: Record<string, Product[]> = {
  'Trending Now': [
    {
      id: '1',
      title: 'Organic Bananas',
      category: 'Fruits',
      quantity: 1,
      unit: 'bunch',
      location: 'pantry',
      price: 1.99,
      imageUrl: 'https://images.unsplash.com/photo-1571575173703-af9689a0ed5c?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
    {
      id: '2',
      title: 'Avocados',
      category: 'Fruits',
      quantity: 1,
      unit: 'each',
      location: 'pantry',
      price: 2.49,
      imageUrl: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
    {
      id: '3',
      title: 'Strawberries',
      category: 'Fruits',
      quantity: 1,
      unit: 'pint',
      location: 'pantry',
      price: 3.99,
      imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
    {
      id: '4',
      title: 'Blueberries',
      category: 'Fruits',
      quantity: 1,
      unit: 'pint',
      location: 'pantry',
      price: 4.49,
      imageUrl: 'https://images.unsplash.com/photo-1498557850523-fd3d8b9e4aaf?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
  ],
  'Weekly Deals': [
    {
      id: '5',
      title: 'Whole Chicken',
      category: 'Meat',
      quantity: 1,
      unit: 'lb',
      location: 'fridge',
      price: 1.29,
      imageUrl: 'https://images.unsplash.com/photo-1607623814075-4f29c8915288?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
    {
      id: '6',
      title: 'Ground Beef',
      category: 'Meat',
      quantity: 1,
      unit: 'lb',
      location: 'fridge',
      price: 5.99,
      imageUrl: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
    {
      id: '7',
      title: 'Salmon Fillet',
      category: 'Seafood',
      quantity: 1,
      unit: 'lb',
      location: 'fridge',
      price: 9.99,
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
  ],
  'Popular Items': [
    {
      id: '8',
      title: 'Organic Milk',
      category: 'Dairy',
      quantity: 1,
      unit: 'gallon',
      location: 'fridge',
      price: 4.99,
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
    {
      id: '9',
      title: 'Free Range Eggs',
      category: 'Dairy',
      quantity: 1,
      unit: 'dozen',
      location: 'fridge',
      price: 3.99,
      imageUrl: 'https://images.unsplash.com/photo-1587486913049-53fc88980dfa?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
    {
      id: '10',
      title: 'Sourdough Bread',
      category: 'Bakery',
      quantity: 1,
      unit: 'loaf',
      location: 'pantry',
      price: 4.49,
      imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
  ],
};
