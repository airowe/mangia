// Collection-related shared types

export interface RecipeCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeCollectionItem {
  id: string;
  collectionId: string;
  recipeId: string;
  addedAt: string;
}

export interface CollectionWithCount extends RecipeCollection {
  recipeCount: number;
}

export interface CollectionWithRecipes extends RecipeCollection {
  recipes: {
    id: string;
    title: string;
    imageUrl?: string;
    cookTime?: number;
    prepTime?: number;
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
