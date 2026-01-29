// lib/cookbookService.ts
// Service for managing cookbook collection (premium feature)
// Migrated to Clerk + API architecture

import { apiClient } from "./api/client";
import { Cookbook } from "../models/Cookbook";

// API response types (camelCase from Drizzle)
interface ApiCookbook {
  id: string;
  userId: string;
  title: string;
  author?: string;
  coverImageUrl?: string;
  isbn?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface CookbooksResponse {
  cookbooks: ApiCookbook[];
}

interface CookbookResponse {
  cookbook: ApiCookbook;
}

/**
 * Transform API response (camelCase) to model format (snake_case)
 */
function transformCookbook(api: ApiCookbook): Cookbook {
  return {
    id: api.id,
    user_id: api.userId,
    title: api.title,
    author: api.author,
    cover_image_url: api.coverImageUrl,
    isbn: api.isbn,
    notes: api.notes,
    created_at: api.createdAt,
    updated_at: api.updatedAt,
  };
}

/**
 * Fetch all cookbooks for the current user
 */
export async function fetchCookbooks(): Promise<Cookbook[]> {
  try {
    const response = await apiClient.get<CookbooksResponse>("/api/cookbooks");
    return (response.cookbooks || []).map(transformCookbook);
  } catch (error) {
    console.error("Error fetching cookbooks:", error);
    throw error;
  }
}

/**
 * Search cookbooks by title or author
 */
export async function searchCookbooks(query: string): Promise<Cookbook[]> {
  try {
    const response = await apiClient.get<CookbooksResponse>(
      `/api/cookbooks?search=${encodeURIComponent(query)}`
    );
    return (response.cookbooks || []).map(transformCookbook);
  } catch (error) {
    console.error("Error searching cookbooks:", error);
    throw error;
  }
}

/**
 * Create a new cookbook
 */
export async function createCookbook(
  cookbook: Omit<Cookbook, "id" | "user_id" | "created_at">
): Promise<Cookbook> {
  try {
    const response = await apiClient.post<CookbookResponse>("/api/cookbooks", {
      title: cookbook.title,
      author: cookbook.author || null,
      coverImageUrl: cookbook.cover_image_url || null,
      isbn: cookbook.isbn || null,
      notes: cookbook.notes || null,
    });
    return transformCookbook(response.cookbook);
  } catch (error) {
    console.error("Error creating cookbook:", error);
    throw error;
  }
}

/**
 * Update an existing cookbook
 */
export async function updateCookbook(
  cookbookId: string,
  updates: Partial<Omit<Cookbook, "id" | "user_id" | "created_at">>
): Promise<Cookbook> {
  try {
    const response = await apiClient.patch<CookbookResponse>(
      `/api/cookbooks/${cookbookId}`,
      {
        title: updates.title,
        author: updates.author,
        coverImageUrl: updates.cover_image_url,
        isbn: updates.isbn,
        notes: updates.notes,
      }
    );
    return transformCookbook(response.cookbook);
  } catch (error) {
    console.error("Error updating cookbook:", error);
    throw error;
  }
}

/**
 * Delete a cookbook
 */
export async function deleteCookbook(cookbookId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/cookbooks/${cookbookId}`);
  } catch (error) {
    console.error("Error deleting cookbook:", error);
    throw error;
  }
}

/**
 * Get cookbook by ID
 */
export async function getCookbookById(
  cookbookId: string
): Promise<Cookbook | null> {
  try {
    const response = await apiClient.get<CookbookResponse>(
      `/api/cookbooks/${cookbookId}`
    );
    return response.cookbook ? transformCookbook(response.cookbook) : null;
  } catch (error: any) {
    // Handle 404 as null return
    if (error.status === 404) {
      return null;
    }
    console.error("Error fetching cookbook:", error);
    throw error;
  }
}
