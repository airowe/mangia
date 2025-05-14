import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../lib/auth";
import { Product } from "../models/Product";

export const addProduct = async (product: Omit<Product, "id" | "user_id">) => {
  const { data: userData } = await getCurrentUser();
  if (!userData?.user) throw new Error("Not signed in");

  const fullProduct = {
    ...product,
    user_id: userData.user.id,
  };

  const { data, error } = await supabase.from("products").insert([fullProduct]);
  if (error) throw error;
  return data;
};

export const removeProduct = async (productId: string) => {
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);
  if (error) throw error;
  return data;
};


export const getProductsForCurrentUser = async () => {
  const { data: userData } = await getCurrentUser();
  if (!userData?.user) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const getProductsForUser = async (userId: string) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data;
};
export const updateProduct = async (product: Product) => {
  const { data, error } = await supabase
    .from("products")
    .update(product)
    .eq("id", product.id);

  if (error) throw error;
  return data;
};
export const deleteProduct = async (productId: string) => {
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) throw error;
  return data;
};
export const getPantry = async () => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", "Pantry");

  if (error) throw error;
  return data;
};
export const getFridge = async () => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", "Fridge");

  if (error) throw error;
  return data;
};
export const getFreezer = async () => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", "Freezer");

  if (error) throw error;
  return data;
};
export const getSpiceDrawer = async () => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", "Spice Drawer");

  if (error) throw error;
  return data;
};
export const getAllProducts = async () => {
  const { data, error } = await supabase.from("products").select("*");

  if (error) throw error;
  return data;
};
export const getProductsByCategory = async (category: string) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", category);

  if (error) throw error;
  return data;
};
export const getProductsByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data;
};
export const getProductsByUserIdAndCategory = async (
  userId: string,
  category: string
) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .eq("category", category);

  if (error) throw error;
  return data;
};
export const getProductsByUserIdAndName = async (
  userId: string,
  name: string
) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .ilike("name", `%${name}%`);

  if (error) throw error;
  return data;
};
export const getProductsByUserIdAndCategoryAndName = async (
  userId: string,
  category: string,
  name: string
) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .eq("category", category)
    .ilike("name", `%${name}%`);

  if (error) throw error;
  return data;
};
