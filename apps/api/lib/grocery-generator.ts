// lib/grocery-generator.ts
// Server-side grocery list generation — consolidation + pantry deduction
// Ported from apps/mobile/lib/groceryList.ts + apps/mobile/utils/categorizeIngredient.ts

import type { IngredientCategory } from "@mangia/shared";

// ──────────────────────────── Ingredient Categorization ──────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  produce: [
    "lettuce", "tomato", "onion", "garlic", "pepper", "carrot", "celery",
    "potato", "broccoli", "spinach", "kale", "mushroom", "zucchini",
    "cucumber", "avocado", "lemon", "lime", "apple", "banana", "berry",
    "orange", "ginger", "cilantro", "parsley", "basil", "mint", "scallion",
    "green onion", "cabbage", "corn", "squash", "eggplant", "asparagus",
    "bell pepper", "jalapeño", "jalapeno", "shallot", "leek", "radish",
    "beet", "turnip", "sweet potato", "yam", "artichoke", "fennel",
    "arugula", "romaine", "chard", "bok choy", "watercress", "endive",
    "grape", "strawberry", "blueberry", "raspberry", "blackberry",
    "mango", "pineapple", "papaya", "kiwi", "peach", "plum", "pear",
    "cherry", "watermelon", "cantaloupe", "honeydew", "fig", "date",
    "pomegranate", "passion fruit", "dragon fruit", "lychee",
  ],
  meat_seafood: [
    "chicken", "beef", "pork", "fish", "salmon", "shrimp", "turkey",
    "bacon", "sausage", "steak", "ground", "lamb", "ham", "tuna",
    "crab", "lobster", "tilapia", "cod", "meatball", "prosciutto",
    "pancetta", "duck", "veal", "bison", "venison", "rabbit",
    "scallop", "mussel", "clam", "oyster", "squid", "calamari",
    "octopus", "anchovy", "sardine", "halibut", "trout", "bass",
    "snapper", "mahi", "swordfish", "crawfish", "crayfish",
  ],
  dairy_eggs: [
    "milk", "cheese", "butter", "yogurt", "cream", "egg", "sour cream",
    "cottage cheese", "cream cheese", "parmesan", "mozzarella", "cheddar",
    "feta", "ricotta", "half and half", "whipping cream", "mascarpone",
    "brie", "gouda", "gruyere", "swiss", "provolone", "blue cheese",
    "goat cheese", "queso", "paneer", "ghee", "buttermilk", "kefir",
    "heavy cream", "light cream", "evaporated milk", "condensed milk",
    "crème fraîche", "creme fraiche", "custard",
  ],
  bakery: [
    "bread", "rolls", "bagel", "tortilla", "pita", "bun", "croissant",
    "english muffin", "naan", "flatbread", "ciabatta", "baguette",
    "sourdough", "brioche", "focaccia", "pretzel", "crouton",
    "breadcrumb", "panko", "pizza dough", "pie crust", "puff pastry",
    "phyllo", "filo", "cornbread", "biscuit", "scone", "muffin",
    "donut", "doughnut", "danish", "pastry", "cake", "cupcake",
  ],
  frozen: [
    "frozen", "ice cream", "popsicle", "gelato", "sorbet", "sherbet",
    "frozen yogurt", "frozen pizza", "frozen dinner", "frozen vegetable",
    "frozen fruit", "frozen berry", "frozen pea", "frozen corn",
  ],
  canned: [
    "canned", "beans", "tomato sauce", "broth", "stock", "coconut milk",
    "diced tomatoes", "crushed tomatoes", "tomato paste", "chickpeas",
    "black beans", "kidney beans", "pinto beans", "cannellini",
    "garbanzo", "lentils", "peas", "corn", "artichoke hearts",
    "olives", "capers", "anchovies", "tuna", "salmon", "sardines",
    "soup", "chili", "enchilada sauce", "salsa", "marinara",
    "alfredo", "pesto", "curry paste", "chipotle",
  ],
  pantry: [
    "flour", "sugar", "oil", "salt", "pepper", "spice", "rice", "pasta",
    "sauce", "vinegar", "soy sauce", "honey", "maple", "olive oil",
    "vegetable oil", "sesame oil", "baking", "vanilla", "cinnamon",
    "cumin", "paprika", "oregano", "thyme", "bay leaf", "nutmeg",
    "cornstarch", "baking powder", "baking soda", "yeast", "oats",
    "quinoa", "couscous", "lentils", "peanut butter", "jam", "jelly",
    "mustard", "ketchup", "mayonnaise", "hot sauce", "sriracha",
    "worcestershire", "fish sauce", "oyster sauce", "hoisin",
    "teriyaki", "bbq sauce", "tahini", "miso", "gochujang",
    "curry powder", "garam masala", "turmeric", "cayenne", "chili powder",
    "garlic powder", "onion powder", "dried herbs", "rosemary",
    "sage", "dill", "tarragon", "marjoram", "allspice", "cardamom",
    "coriander", "fennel seed", "caraway", "poppy seed", "sesame seed",
    "sunflower seed", "pumpkin seed", "chia seed", "flax seed",
    "almond", "walnut", "pecan", "cashew", "pistachio", "hazelnut",
    "macadamia", "pine nut", "coconut", "raisin", "dried cranberry",
    "dried apricot", "prune", "chocolate", "cocoa", "coffee", "tea",
    "noodle", "spaghetti", "penne", "fusilli", "macaroni", "lasagna",
    "ramen", "udon", "soba", "rice noodle", "vermicelli",
    "breadcrumbs", "cracker", "tortilla chip", "corn chip",
    "brown sugar", "powdered sugar", "confectioners sugar",
    "molasses", "agave", "corn syrup", "extract", "food coloring",
  ],
};

/**
 * Categorize an ingredient name into a store section.
 */
export function categorizeIngredient(name: string): IngredientCategory {
  const lowerName = name.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lowerName.includes(kw))) {
      return category as IngredientCategory;
    }
  }

  return "other";
}

/**
 * Sort order for store-layout display.
 */
export function getCategoryOrder(category: IngredientCategory): number {
  const ORDER: Record<string, number> = {
    produce: 1,
    meat_seafood: 2,
    dairy_eggs: 3,
    bakery: 4,
    frozen: 5,
    canned: 6,
    pantry: 7,
    other: 8,
  };
  return ORDER[category] ?? 8;
}

// ──────────────────────────── Grocery List Generation ──────────────────────────────

interface RecipeForGrocery {
  id: string;
  title: string;
  ingredients: {
    name: string;
    quantity?: number | null;
    unit?: string | null;
    category?: string | null;
  }[];
}

interface PantryItemForGrocery {
  name: string;
  quantity?: number | null;
  unit?: string | null;
}

export interface ConsolidatedGroceryItem {
  name: string;
  totalQuantity: number;
  unit: string;
  category: IngredientCategory;
  fromRecipes: { recipeId: string; recipeTitle: string; quantity: number }[];
  inPantry: boolean;
  pantryQuantity: number;
  needToBuy: number;
}

/**
 * Normalize ingredient names for comparison.
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(
      /\b(fresh|dried|chopped|minced|diced|sliced|whole|large|small|medium|optional)\b/g,
      "",
    )
    .trim();
}

/**
 * Consolidate ingredients from multiple recipes, combine duplicates,
 * subtract pantry quantities, and sort by store section.
 */
export function generateGroceryItems(
  recipes: RecipeForGrocery[],
  pantryItems: PantryItemForGrocery[],
): ConsolidatedGroceryItem[] {
  // Build pantry lookup
  const pantryMap = new Map<string, PantryItemForGrocery>();
  for (const item of pantryItems) {
    pantryMap.set(normalizeIngredientName(item.name), item);
  }

  // Consolidate ingredients across recipes
  const ingredientMap = new Map<string, ConsolidatedGroceryItem>();

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const key = normalizeIngredientName(ingredient.name);

      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!;
        existing.totalQuantity += ingredient.quantity || 0;
        existing.fromRecipes.push({
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          quantity: ingredient.quantity || 0,
        });
      } else {
        const category =
          (ingredient.category as IngredientCategory) ||
          categorizeIngredient(ingredient.name);

        ingredientMap.set(key, {
          name: ingredient.name,
          totalQuantity: ingredient.quantity || 0,
          unit: ingredient.unit || "",
          category,
          fromRecipes: [
            {
              recipeId: recipe.id,
              recipeTitle: recipe.title,
              quantity: ingredient.quantity || 0,
            },
          ],
          inPantry: false,
          pantryQuantity: 0,
          needToBuy: 0,
        });
      }
    }
  }

  // Check against pantry
  const items = Array.from(ingredientMap.values()).map((item) => {
    const pantryKey = normalizeIngredientName(item.name);
    const pantryItem = pantryMap.get(pantryKey);

    const inPantry = !!pantryItem;
    const pantryQuantity = pantryItem?.quantity || 0;
    const needToBuy = Math.max(0, item.totalQuantity - pantryQuantity);

    return { ...item, inPantry, pantryQuantity, needToBuy };
  });

  // Sort by store section
  return items.sort(
    (a, b) => getCategoryOrder(a.category) - getCategoryOrder(b.category),
  );
}
