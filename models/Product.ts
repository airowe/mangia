import { StorageCategory } from './constants';

export interface Product {
  id: string;
  user_id?: string;
  name: string;
  quantity: number;
  unit: string;
  category: StorageCategory;
  created_at?: string;
}
