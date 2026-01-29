// Cookbook shared types

export interface Cookbook {
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
