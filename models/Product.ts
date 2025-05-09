import { StorageCategory } from './constants';

export type Product = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: StorageCategory;
};
