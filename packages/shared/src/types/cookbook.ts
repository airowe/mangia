// Cookbook shared types

export interface Cookbook {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  cover_image_url?: string;
  isbn?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}
