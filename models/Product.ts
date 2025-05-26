export interface Product {
  barcode?: string;
  category: string;
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  quantity?: number;
  unit: string;
  location?: string;
  created_at?: string;
  price?: number;
  image?: string;
  imageUrl?: string;
  asin?: string;
  brand?: string;
  EAN13?: string;
  UPCA?: string;
  expiryDate?: string;
}

// Mock data for demonstration
export const MOCK_PRODUCTS: Record<string, Product[]> = {
  'Pantry': [
    {
      id: '1',
      title: 'Pasta',
      category: 'Grains',
      quantity: 1,
      unit: 'box',
      location: 'Pantry',
      price: 1.99,
      imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81111?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
    {
      id: '2',
      title: 'Rice',
      category: 'Grains',
      quantity: 1,
      unit: 'bag',
      location: 'Pantry',
      price: 3.49,
      imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510bf2d0f3?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
    {
      id: '3',
      title: 'Canned Beans',
      category: 'Canned Goods',
      quantity: 1,
      unit: 'can',
      location: 'Pantry',
      price: 0.99,
      imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
    {
      id: '4',
      title: 'Olive Oil',
      category: 'Cooking Oils',
      quantity: 1,
      unit: 'bottle',
      location: 'Pantry',
      price: 8.99,
      imageUrl: 'https://images.unsplash.com/photo-1601521722609-54a580a51310?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
  ],
  'Refrigerator': [
    {
      id: '5',
      title: 'Milk',
      category: 'Dairy',
      quantity: 1,
      unit: 'gallon',
      location: 'Refrigerator',
      price: 3.29,
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
    {
      id: '6',
      title: 'Eggs',
      category: 'Dairy',
      quantity: 12,
      unit: 'count',
      location: 'Refrigerator',
      price: 2.99,
      imageUrl: 'https://images.unsplash.com/photo-1587486913049-53fc88980dfa?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
    {
      id: '7',
      title: 'Cheese',
      category: 'Dairy',
      quantity: 1,
      unit: 'block',
      location: 'Refrigerator',
      price: 4.99,
      imageUrl: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
  ],
  'Spice Drawer': [
    {
      id: '8',
      title: 'Black Pepper',
      category: 'Spices',
      quantity: 1,
      unit: 'jar',
      location: 'Spice Drawer',
      price: 3.99,
      imageUrl: 'https://images.unsplash.com/photo-1600851606868-dc7ecfb01d9c?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
    {
      id: '9',
      title: 'Cumin',
      category: 'Spices',
      quantity: 1,
      unit: 'jar',
      location: 'Spice Drawer',
      price: 2.99,
      imageUrl: 'https://images.unsplash.com/photo-1580010436149-4c5f2f82068f?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
    {
      id: '10',
      title: 'Paprika',
      category: 'Spices',
      quantity: 1,
      unit: 'jar',
      location: 'Spice Drawer',
      price: 2.49,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
  ],
  'Freezer': [
    {
      id: '11',
      title: 'Frozen Vegetables',
      category: 'Frozen Foods',
      quantity: 1,
      unit: 'bag',
      location: 'Freezer',
      price: 2.99,
      imageUrl: 'https://images.unsplash.com/photo-1518843875459-f73868223802?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
    {
      id: '12',
      title: 'Ice Cream',
      category: 'Frozen Foods',
      quantity: 1,
      unit: 'pint',
      location: 'Freezer',
      price: 4.99,
      imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=60',
      barcode: undefined
    },
  ],
};
