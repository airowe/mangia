// lib/cookbookService.ts
// Service for managing cookbook collection (premium feature)

import { supabase } from "./supabase";
import { Cookbook } from "../models/Cookbook";

/**
 * Fetch all cookbooks for the current user
 */
export async function fetchCookbooks(): Promise<Cookbook[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("cookbooks")
    .select("*")
    .eq("user_id", user.id)
    .order("title", { ascending: true });

  if (error) {
    console.error("Error fetching cookbooks:", error);
    throw error;
  }

  return data || [];
}

/**
 * Search cookbooks by title or author
 */
export async function searchCookbooks(query: string): Promise<Cookbook[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("cookbooks")
    .select("*")
    .eq("user_id", user.id)
    .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
    .order("title", { ascending: true });

  if (error) {
    console.error("Error searching cookbooks:", error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new cookbook
 */
export async function createCookbook(
  cookbook: Omit<Cookbook, "id" | "user_id" | "created_at">
): Promise<Cookbook> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("cookbooks")
    .insert({
      user_id: user.id,
      title: cookbook.title,
      author: cookbook.author || null,
      cover_image_url: cookbook.cover_image_url || null,
      isbn: cookbook.isbn || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating cookbook:", error);
    throw error;
  }

  return data;
}

/**
 * Update an existing cookbook
 */
export async function updateCookbook(
  cookbookId: string,
  updates: Partial<Omit<Cookbook, "id" | "user_id" | "created_at">>
): Promise<Cookbook> {
  const { data, error } = await supabase
    .from("cookbooks")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cookbookId)
    .select()
    .single();

  if (error) {
    console.error("Error updating cookbook:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a cookbook
 */
export async function deleteCookbook(cookbookId: string): Promise<void> {
  const { error } = await supabase
    .from("cookbooks")
    .delete()
    .eq("id", cookbookId);

  if (error) {
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
  const { data, error } = await supabase
    .from("cookbooks")
    .select("*")
    .eq("id", cookbookId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Error fetching cookbook:", error);
    throw error;
  }

  return data;
}
