// import { StorageCategory } from './constants';

export interface Product {
  category: string;
  id: string;
  user_id?: string;
  title: string;
  quantity: number;
  unit: string;
  location: string;
  created_at?: string;
}
