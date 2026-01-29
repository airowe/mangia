/**
 * Sample Recipes
 *
 * Pre-defined sample recipes for new users to explore the app.
 * These can be loaded to populate an empty state.
 */

import { Recipe, RecipeIngredient } from '../models/Recipe';

export interface SampleRecipe {
  title: string;
  description: string;
  imageUrl: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  instructions: string[];
  ingredients: Omit<RecipeIngredient, 'id' | 'recipe_id'>[];
  sourceType: 'manual';
}

export const SAMPLE_RECIPES: SampleRecipe[] = [
  {
    title: 'Heirloom Tomato Galette',
    description: 'A rustic French tart with ripe heirloom tomatoes, creamy goat cheese, and fresh basil on flaky butter pastry.',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    prepTime: 30,
    cookTime: 45,
    servings: 6,
    sourceType: 'manual',
    instructions: [
      'Make the pastry: Combine flour and salt, cut in cold butter until pea-sized pieces form. Add ice water until dough comes together.',
      'Wrap dough and refrigerate for at least 1 hour.',
      'Preheat oven to 400°F (200°C).',
      'Roll dough into a 12-inch circle on parchment paper.',
      'Spread goat cheese in center, leaving 2-inch border.',
      'Arrange tomato slices in overlapping circles. Season with salt, pepper, and thyme.',
      'Fold edges over filling, pleating as you go.',
      'Brush crust with egg wash and bake 40-45 minutes until golden.',
      'Top with fresh basil before serving.',
    ],
    ingredients: [
      { name: 'All-purpose flour', quantity: 1.5, unit: 'cups', category: 'pantry' },
      { name: 'Unsalted butter, cold', quantity: 0.5, unit: 'cup', category: 'dairy_eggs' },
      { name: 'Ice water', quantity: 4, unit: 'tbsp', category: 'other' },
      { name: 'Heirloom tomatoes', quantity: 1.5, unit: 'lbs', category: 'produce' },
      { name: 'Goat cheese', quantity: 4, unit: 'oz', category: 'dairy_eggs' },
      { name: 'Fresh thyme', quantity: 1, unit: 'tbsp', category: 'produce' },
      { name: 'Fresh basil', quantity: 0.25, unit: 'cup', category: 'produce' },
      { name: 'Egg', quantity: 1, unit: '', category: 'dairy_eggs' },
      { name: 'Salt', quantity: 0.5, unit: 'tsp', category: 'pantry' },
    ],
  },
  {
    title: 'Spring Pea Risotto',
    description: 'Creamy Arborio rice with sweet spring peas, fresh mint, and shaved Parmesan. Pure comfort.',
    imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800',
    prepTime: 15,
    cookTime: 35,
    servings: 4,
    sourceType: 'manual',
    instructions: [
      'Heat vegetable broth in a saucepan and keep warm.',
      'In a large pan, sauté shallots in butter until soft.',
      'Add Arborio rice and toast for 2 minutes.',
      'Add white wine and stir until absorbed.',
      'Add warm broth one ladle at a time, stirring frequently.',
      'Continue adding broth until rice is al dente, about 20 minutes.',
      'Stir in peas, Parmesan, and remaining butter.',
      'Season with salt and pepper. Garnish with mint.',
    ],
    ingredients: [
      { name: 'Arborio rice', quantity: 1.5, unit: 'cups', category: 'pantry' },
      { name: 'Vegetable broth', quantity: 6, unit: 'cups', category: 'pantry' },
      { name: 'Fresh peas', quantity: 1, unit: 'cup', category: 'produce' },
      { name: 'Shallots, minced', quantity: 2, unit: '', category: 'produce' },
      { name: 'Dry white wine', quantity: 0.5, unit: 'cup', category: 'pantry' },
      { name: 'Parmesan cheese', quantity: 0.75, unit: 'cup', category: 'dairy_eggs' },
      { name: 'Butter', quantity: 4, unit: 'tbsp', category: 'dairy_eggs' },
      { name: 'Fresh mint', quantity: 2, unit: 'tbsp', category: 'produce' },
    ],
  },
  {
    title: 'Lemon Herb Roasted Chicken',
    description: 'Perfectly roasted whole chicken with crispy skin, lemon, garlic, and herbs. Sunday dinner perfection.',
    imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800',
    prepTime: 20,
    cookTime: 75,
    servings: 4,
    sourceType: 'manual',
    instructions: [
      'Remove chicken from refrigerator 1 hour before cooking.',
      'Preheat oven to 425°F (220°C).',
      'Pat chicken dry and season generously inside and out with salt.',
      'Stuff cavity with lemon halves, garlic, and half the herbs.',
      'Rub butter under and over the skin.',
      'Tie legs together and tuck wings under.',
      'Roast for 1 hour 15 minutes until internal temp reaches 165°F.',
      'Rest 15 minutes before carving. Garnish with remaining herbs.',
    ],
    ingredients: [
      { name: 'Whole chicken', quantity: 4, unit: 'lbs', category: 'meat_seafood' },
      { name: 'Lemons', quantity: 2, unit: '', category: 'produce' },
      { name: 'Garlic head', quantity: 1, unit: '', category: 'produce' },
      { name: 'Fresh thyme', quantity: 6, unit: 'sprigs', category: 'produce' },
      { name: 'Fresh rosemary', quantity: 4, unit: 'sprigs', category: 'produce' },
      { name: 'Butter, softened', quantity: 4, unit: 'tbsp', category: 'dairy_eggs' },
      { name: 'Kosher salt', quantity: 1, unit: 'tbsp', category: 'pantry' },
      { name: 'Black pepper', quantity: 1, unit: 'tsp', category: 'pantry' },
    ],
  },
];

/**
 * Get a random subset of sample recipes
 */
export function getRandomSampleRecipes(count: number = 3): SampleRecipe[] {
  const shuffled = [...SAMPLE_RECIPES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, SAMPLE_RECIPES.length));
}
