import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product } from "../models/Product";

const STORAGE_KEY = "PANTRY_ITEMS";

export const getPantry = async (): Promise<Product[]> => {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : [];
};

export const clearPantry = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};

export const deleteProduct = async (id: string) => {
  const pantry = await getPantry();
  const newPantry = pantry.filter((item) => item.id !== id);
  await savePantry(newPantry);
};

export const updateProduct = async (product: Product) => {
  const pantry = await getPantry();
  const index = pantry.findIndex((item) => item.id === product.id);
  if (index !== -1) {
    pantry[index] = product;
    await savePantry(pantry);
  }
};
export const getProduct = async (id: string): Promise<Product | null> => {
  const pantry = await getPantry();
  const product = pantry.find((item) => item.id === id);
  return product ? product : null;
};

export const getProductByName = async (
  name: string
): Promise<Product | null> => {
  const pantry = await getPantry();
  const product = pantry.find((item) => item.name === name);
  return product ? product : null;
};

export const getProductsByCategory = async (
  category: string
): Promise<Product[]> => {
  const pantry = await getPantry();
  return pantry.filter((item) => item.category === category);
};

export const savePantry = async (items: Product[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const savePantryItem = async (item: Product) => {
  const pantry = await getPantry();
  const index = pantry.findIndex((i) => i.id === item.id);
  if (index !== -1) {
    pantry[index] = item;
  } else {
    pantry.push(item);
  }
  await savePantry(pantry);
};

export const addProduct = async (product: Product) => {
  console.log("adding product" + JSON.stringify(product));
  const pantry = await getPantry();
  console.log(JSON.stringify(pantry));
  pantry.push(product);
  console.log(JSON.stringify(product));
  await savePantry(pantry);
};
