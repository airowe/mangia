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
      imageUrl: 'https://loremflickr.com/320/240',
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
      imageUrl: 'https://loremflickr.com/320/240',
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
      imageUrl: 'https://loremflickr.com/320/240',
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
      imageUrl: 'https://loremflickr.com/320/240',
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
      imageUrl: 'https://loremflickr.com/320/240',
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
      imageUrl: 'https://loremflickr.com/320/240',
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
      imageUrl: 'https://loremflickr.com/320/240',
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
      imageUrl: 'https://loremflickr.com/320/240',
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
      imageUrl: 'https://loremflickr.com/320/240',
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
      imageUrl: 'https://loremflickr.com/320/240',
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
      imageUrl: 'https://loremflickr.com/320/240',
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
      imageUrl: 'https://loremflickr.com/320/240',
      barcode: undefined
    },
  ],
};
