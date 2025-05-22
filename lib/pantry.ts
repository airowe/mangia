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
export const updatePantryItemQuantity = async (productId: string, quantity: number) => {
  try {
    console.log('Updating quantity via API:', { productId, quantity });
    
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;
    
    if (!accessToken) {
      throw new Error('User not authenticated');
    }

    // Log the full request details
    const requestUrl = `${apiURL}/pantry/update-quantity`;
    const requestBody = JSON.stringify({ productId, quantity });
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };
    
    console.log('Making request to:', requestUrl);
    console.log('Request method: POST');
    console.log('Request headers:', JSON.stringify(requestHeaders, null, 2));
    console.log('Request body:', requestBody);
    
    // Make the request with POST method
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: requestBody
    });

    console.log('API response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = `Failed to update quantity (Status: ${response.status} ${response.statusText})`;
      console.error('Response headers:');
      
      // Log all response headers
      response.headers.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });
      
      // Try to get response text
      try {
        const responseText = await response.text();
        console.error('Response text:', responseText);
        
        // Try to parse as JSON if possible
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            console.error('Error response:', errorData);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            // If not JSON, use the raw text
            errorMessage = responseText || errorMessage;
          }
        }
      } catch (e) {
        console.error('Failed to read response text:', e);
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Successfully updated quantity:', result);
    return { data: result, error: null };
    
  } catch (error) {
    console.error('Error in updatePantryItemQuantity:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error updating quantity') 
    };
  }
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