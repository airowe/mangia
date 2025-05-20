import { Product } from "../models/Product";
import { getCurrentUser } from "./auth";
import { supabase } from "./supabase";

const apiURL = process.env.EXPO_PUBLIC_API_URL;
if (!apiURL) {
  throw new Error("API URL is not defined");
}

// Fetch all products (consider pagination if you have many products)
export const fetchAllProducts = async () => {
  const response = await fetch(`${apiURL}/products`);
  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.error || "Failed to fetch products");
  }
  return await response.json();
};

// Add a product to the user's pantry
export const saveToPantry = async (product: Product) => {
  const userResponse = await getCurrentUser();
  if (!userResponse?.data?.user?.id) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${apiURL}/pantry/add-pantry-item`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify({
      product_id: product.id,
      name: product.title,
      barcode: product.barcode,
      image_url: product.imageUrl,
      quantity: product.quantity || 1
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to save to pantry");
  }

  return await response.json();
};

// Fetch user's pantry items
export const fetchPantryItems = async () => {
  const userResponse = await getCurrentUser();
  if (!userResponse?.data?.user?.id) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(
    `${apiURL}/pantry/fetch-pantry?user_id=${userResponse.data.user.id}`,
    {
      headers: {
        "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    }
  );

  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.error || "Failed to fetch pantry items");
  }

  return await response.json();
};

// Update pantry item quantity
export const updatePantryItemQuantity = async (itemId: string, quantity: number) => {
  const response = await fetch(`${apiURL}/pantry/update-quantity`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify({ itemId, quantity }),
  });

  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.error || "Failed to update quantity");
  }

  return await response.json();
};

// Remove item from pantry
export const removeFromPantry = async (itemId: string) => {
  const response = await fetch(`${apiURL}/pantry/remove-item`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify({ itemId }),
  });

  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.error || "Failed to remove item");
  }

  return true;
};