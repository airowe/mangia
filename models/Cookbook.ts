export interface Cookbook {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  cover_image_url?: string;
  isbn?: string;
  created_at: string;
}
