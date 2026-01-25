// Recipe Collection model for organizing recipes into folders

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

// Collection with recipe count for list display
export interface CollectionWithCount extends RecipeCollection {
  recipe_count: number;
}

// Collection with full recipe details for collection view
export interface CollectionWithRecipes extends RecipeCollection {
  recipes: {
    id: string;
    title: string;
    image_url?: string;
    cook_time?: number;
    prep_time?: number;
  }[];
}

// Preset icons for collection customization
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

// Preset colors for collection customization
export const COLLECTION_COLORS = [
  '#CC5500', // brand orange
  '#E57373', // red
  '#F06292', // pink
  '#BA68C8', // purple
  '#64B5F6', // blue
  '#4DB6AC', // teal
  '#81C784', // green
  '#FFD54F', // yellow
  '#FF8A65', // deep orange
  '#A1887F', // brown
] as const;

export type CollectionColor = typeof COLLECTION_COLORS[number];
