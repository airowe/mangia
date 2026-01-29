/**
 * Mock Data for Dev Bypass Mode
 *
 * Provides realistic mock data for testing the app without a backend.
 */

import { RecipeWithIngredients } from '../recipeService';
import { SAMPLE_RECIPES } from '../sampleRecipes';
import { DEV_USER_ID } from '../devConfig';

// Convert sample recipes to full RecipeWithIngredients format
let mockRecipeIdCounter = 1;

export const MOCK_RECIPES: RecipeWithIngredients[] = SAMPLE_RECIPES.map((sample, index) => ({
  id: `mock-recipe-${mockRecipeIdCounter++}`,
  userId: DEV_USER_ID,
  title: sample.title,
  description: sample.description,
  imageUrl: sample.imageUrl,
  prepTime: sample.prepTime,
  cookTime: sample.cookTime,
  servings: sample.servings,
  instructions: sample.instructions,
  sourceType: sample.sourceType,
  sourceUrl: undefined,
  status: 'want_to_cook' as const,
  createdAt: new Date(Date.now() - (index * 86400000)).toISOString(), // Stagger dates
  updatedAt: new Date(Date.now() - (index * 86400000)).toISOString(),
  ingredients: sample.ingredients.map((ing, i) => ({
    id: `mock-ing-${index}-${i}`,
    recipeId: `mock-recipe-${index + 1}`,
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
    category: ing.category,
  })),
}));

// Add a few more diverse recipes for testing
MOCK_RECIPES.push(
  {
    id: `mock-recipe-${mockRecipeIdCounter++}`,
    userId: DEV_USER_ID,
    title: 'Classic Margherita Pizza',
    description: 'Traditional Neapolitan pizza with San Marzano tomatoes, fresh mozzarella, and basil.',
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
    prepTime: 120,
    cookTime: 15,
    servings: 4,
    instructions: [
      'Make the dough: combine flour, water, yeast, and salt. Knead for 10 minutes.',
      'Let dough rise for 1-2 hours until doubled.',
      'Preheat oven to highest setting (500°F+) with pizza stone.',
      'Stretch dough into 12-inch circle.',
      'Top with crushed tomatoes, torn mozzarella, and drizzle of olive oil.',
      'Bake for 10-15 minutes until crust is charred and cheese is bubbly.',
      'Top with fresh basil leaves before serving.',
    ],
    sourceType: 'manual',
    sourceUrl: undefined,
    status: 'want_to_cook',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    ingredients: [
      { id: 'mock-ing-4-0', recipeId: 'mock-recipe-4', name: '00 flour', quantity: 500, unit: 'g', category: 'pantry' },
      { id: 'mock-ing-4-1', recipeId: 'mock-recipe-4', name: 'Water', quantity: 325, unit: 'ml', category: 'other' },
      { id: 'mock-ing-4-2', recipeId: 'mock-recipe-4', name: 'Active dry yeast', quantity: 1, unit: 'tsp', category: 'pantry' },
      { id: 'mock-ing-4-3', recipeId: 'mock-recipe-4', name: 'San Marzano tomatoes', quantity: 1, unit: 'can', category: 'pantry' },
      { id: 'mock-ing-4-4', recipeId: 'mock-recipe-4', name: 'Fresh mozzarella', quantity: 8, unit: 'oz', category: 'dairy_eggs' },
      { id: 'mock-ing-4-5', recipeId: 'mock-recipe-4', name: 'Fresh basil', quantity: 10, unit: 'leaves', category: 'produce' },
      { id: 'mock-ing-4-6', recipeId: 'mock-recipe-4', name: 'Extra virgin olive oil', quantity: 2, unit: 'tbsp', category: 'pantry' },
    ],
  },
  {
    id: `mock-recipe-${mockRecipeIdCounter++}`,
    userId: DEV_USER_ID,
    title: 'Thai Green Curry',
    description: 'Aromatic coconut curry with vegetables and your choice of protein. Ready in 30 minutes.',
    imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    instructions: [
      'Heat oil in a wok or large pan over medium-high heat.',
      'Add green curry paste and cook for 1 minute until fragrant.',
      'Add coconut milk and bring to a simmer.',
      'Add protein of choice and cook until done.',
      'Add vegetables and simmer until tender-crisp.',
      'Season with fish sauce, palm sugar, and lime juice.',
      'Garnish with Thai basil and serve over jasmine rice.',
    ],
    sourceType: 'manual',
    sourceUrl: undefined,
    status: 'cooked',
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    ingredients: [
      { id: 'mock-ing-5-0', recipeId: 'mock-recipe-5', name: 'Green curry paste', quantity: 3, unit: 'tbsp', category: 'pantry' },
      { id: 'mock-ing-5-1', recipeId: 'mock-recipe-5', name: 'Coconut milk', quantity: 2, unit: 'cans', category: 'pantry' },
      { id: 'mock-ing-5-2', recipeId: 'mock-recipe-5', name: 'Chicken breast', quantity: 1, unit: 'lb', category: 'meat_seafood' },
      { id: 'mock-ing-5-3', recipeId: 'mock-recipe-5', name: 'Thai eggplant', quantity: 1, unit: 'cup', category: 'produce' },
      { id: 'mock-ing-5-4', recipeId: 'mock-recipe-5', name: 'Bamboo shoots', quantity: 0.5, unit: 'cup', category: 'pantry' },
      { id: 'mock-ing-5-5', recipeId: 'mock-recipe-5', name: 'Fish sauce', quantity: 2, unit: 'tbsp', category: 'pantry' },
      { id: 'mock-ing-5-6', recipeId: 'mock-recipe-5', name: 'Thai basil', quantity: 0.5, unit: 'cup', category: 'produce' },
    ],
  }
);

// In-memory store for mock data mutations
let mockRecipesStore = [...MOCK_RECIPES];

export const mockApi = {
  // Reset store to initial state
  reset: () => {
    mockRecipesStore = [...MOCK_RECIPES];
  },

  // Get all recipes
  getRecipes: (status?: string): RecipeWithIngredients[] => {
    if (status) {
      return mockRecipesStore.filter(r => r.status === status);
    }
    return mockRecipesStore;
  },

  // Get recipe by ID
  getRecipeById: (id: string): RecipeWithIngredients | null => {
    return mockRecipesStore.find(r => r.id === id) || null;
  },

  // Create recipe
  createRecipe: (recipe: Partial<RecipeWithIngredients>): RecipeWithIngredients => {
    const newRecipe: RecipeWithIngredients = {
      id: `mock-recipe-${mockRecipeIdCounter++}`,
      userId: DEV_USER_ID,
      title: recipe.title || 'Untitled Recipe',
      description: recipe.description,
      imageUrl: recipe.imageUrl,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      instructions: recipe.instructions || [],
      sourceType: recipe.sourceType || 'manual',
      sourceUrl: recipe.sourceUrl,
      status: recipe.status || 'want_to_cook',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ingredients: recipe.ingredients || [],
    };
    mockRecipesStore.unshift(newRecipe);
    return newRecipe;
  },

  // Update recipe
  updateRecipe: (id: string, updates: Partial<RecipeWithIngredients>): RecipeWithIngredients | null => {
    const index = mockRecipesStore.findIndex(r => r.id === id);
    if (index === -1) return null;

    mockRecipesStore[index] = {
      ...mockRecipesStore[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return mockRecipesStore[index];
  },

  // Delete recipe
  deleteRecipe: (id: string): boolean => {
    const index = mockRecipesStore.findIndex(r => r.id === id);
    if (index === -1) return false;
    mockRecipesStore.splice(index, 1);
    return true;
  },

  // Search recipes
  searchRecipes: (query: string): RecipeWithIngredients[] => {
    const lowerQuery = query.toLowerCase();
    return mockRecipesStore.filter(r =>
      r.title.toLowerCase().includes(lowerQuery) ||
      r.description?.toLowerCase().includes(lowerQuery)
    );
  },
};
