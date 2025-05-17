import { Product } from "../models/Product";
import { getCurrentUser } from "./auth";

const apiURL = process.env.EXPO_PUBLIC_API_URL;
if (!apiURL) {
  throw new Error("API URL is not defined");
}

export const fetchAllProducts = async () => {
  const response = await fetch(`${apiURL}/products`);
  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.error || "Failed to fetch products");
  }
  return await response.json();
};

export const saveToPantry = async (userId: string, pantryItem: Product) => {
  const response = await fetch(`${apiURL}/pantry/add-pantry-item`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, pantryItem }),
  });

  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.error || "Failed to save to pantry");
  }

  return await response.json();
};
export const fetchPantryItems = async () => {
  const userResponse = await getCurrentUser();
  console.log("Fetching pantry items",userResponse);
  if (!userResponse || !userResponse.data || !userResponse.data.user) {
    throw new Error("User not authenticated");
  }
  const response = await fetch(
    `${apiURL}/pantry/fetch-pantry?user_id=${userResponse.data.user.id}`
  );
  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.error || "Failed to fetch pantry items");
  }

  console.log("Fetched pantry items:", response);
  return await response.json();
};

export const fetchPantryItemsByCategory = async (category: string) => {
  const userResponse = await getCurrentUser();
  if (!userResponse || !userResponse.data || !userResponse.data.user) {
    throw new Error("User not authenticated");
  }
  const userId = userResponse.data.user.id;
  const response = await fetch(
    `${apiURL}/pantry?userId=${userId}&category=${category}`
  );
  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.error || "Failed to fetch pantry item by category");
  }
  return await response.json();
};
export const fetchPantryItemByBrand = async (userId: string, brand: string) => {
  const response = await fetch(
    `${apiURL}/pantry?userId=${userId}&brand=${brand}`
  );
  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.error || "Failed to fetch pantry item by brand");
  }
  return await response.json();
};
export const fetchPantryItemByExpirationDate = async (
  userId: string,
  expirationDate: string
) => {
  const response = await fetch(
    `${apiURL}/pantry?userId=${userId}&expirationDate=${expirationDate}`
  );
  if (!response.ok) {
    const json = await response.json();
    throw new Error(
      json.error || "Failed to fetch pantry item by expiration date"
    );
  }
  return await response.json();
};
export const fetchPantryItemByQuantity = async (
  userId: string,
  quantity: number
) => {
  const response = await fetch(
    `${apiURL}/pantry?userId=${userId}&quantity=${quantity}`
  );
  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.error || "Failed to fetch pantry item by quantity");
  }
  return await response.json();
};
export const fetchPantryItemByImage = async (userId: string, image: string) => {
  const response = await fetch(
    `${apiURL}/pantry?userId=${userId}&image=${image}`
  );
  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.error || "Failed to fetch pantry item by image");
  }
  return await response.json();
};
export const fetchPantryItemByLocation = async (
  userId: string,
  location: string
) => {
  const response = await fetch(
    `${apiURL}/pantry?userId=${userId}&location=${location}`
  );
  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.error || "Failed to fetch pantry item by location");
  }
  return await response.json();
};
export const fetchPantryItemByNotes = async (userId: string, notes: string) => {
  const response = await fetch(
    `${apiURL}/pantry?userId=${userId}&notes=${notes}`
  );
  if (!response.ok) {
    const json = await response.json();
    throw new Error(json.error || "Failed to fetch pantry item by notes");
  }
  return await response.json();
};
export const fetchPantryItemByPurchaseDate = async (
  userId: string,
  purchaseDate: string
) => {
  const response = await fetch(
    `${apiURL}/pantry?userId=${userId}&purchaseDate=${purchaseDate}`
  );
  if (!response.ok) {
    const json = await response.json();
    throw new Error(
      json.error || "Failed to fetch pantry item by purchase date"
    );
  }
  return await response.json();
};
export const fetchPantryItemByStorageLocation = async (
  userId: string,
  storageLocation: string
) => {
  const response = await fetch(
    `${apiURL}/pantry?userId=${userId}&storageLocation=${storageLocation}`
  );
  if (!response.ok) {
    const json = await response.json();
    throw new Error(
      json.error || "Failed to fetch pantry item by storage location"
    );
  }
  return await response.json();
};
