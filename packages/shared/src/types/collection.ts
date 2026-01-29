// Collection-related shared types

export interface RecipeCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface RecipeCollectionItem {
  id: string;
  collection_id: string;
  recipe_id: string;
  added_at: string;
  display_order: number;
}

export interface CollectionWithCount extends RecipeCollection {
  recipe_count: number;
}

export interface CollectionWithRecipes extends RecipeCollection {
  recipes: {
    id: string;
    title: string;
    image_url?: string;
    cook_time?: number;
    prep_time?: number;
  }[];
}

export const COLLECTION_ICONS = [
  'folder',
  'heart',
  'star',
  'bookmark',
  'food',
  'food-apple',
  'food-variant',
  'silverware-fork-knife',
  'chef-hat',
  'cake',
  'coffee',
  'beer',
  'fire',
  'leaf',
  'sprout',
  'emoticon-happy',
] as const;

export type CollectionIcon = typeof COLLECTION_ICONS[number];

export const COLLECTION_COLORS = [
  '#CC5500',
  '#E57373',
  '#F06292',
  '#BA68C8',
  '#64B5F6',
  '#4DB6AC',
  '#81C784',
  '#FFD54F',
  '#FF8A65',
  '#A1887F',
] as const;

export type CollectionColor = typeof COLLECTION_COLORS[number];
