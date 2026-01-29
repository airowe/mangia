import { IngredientCategory } from '../models/Recipe';

const CATEGORY_KEYWORDS: Record<IngredientCategory, string[]> = {
  produce: [
    'lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'carrot', 'celery',
    'potato', 'broccoli', 'spinach', 'kale', 'mushroom', 'zucchini',
    'cucumber', 'avocado', 'lemon', 'lime', 'apple', 'banana', 'berry',
    'orange', 'ginger', 'cilantro', 'parsley', 'basil', 'mint', 'scallion',
    'green onion', 'cabbage', 'corn', 'squash', 'eggplant', 'asparagus',
    'bell pepper', 'jalapeño', 'jalapeno', 'shallot', 'leek', 'radish',
    'beet', 'turnip', 'sweet potato', 'yam', 'artichoke', 'fennel',
    'arugula', 'romaine', 'chard', 'bok choy', 'watercress', 'endive',
    'grape', 'strawberry', 'blueberry', 'raspberry', 'blackberry',
    'mango', 'pineapple', 'papaya', 'kiwi', 'peach', 'plum', 'pear',
    'cherry', 'watermelon', 'cantaloupe', 'honeydew', 'fig', 'date',
    'pomegranate', 'passion fruit', 'dragon fruit', 'lychee'
  ],
  meat_seafood: [
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'turkey',
    'bacon', 'sausage', 'steak', 'ground', 'lamb', 'ham', 'tuna',
    'crab', 'lobster', 'tilapia', 'cod', 'meatball', 'prosciutto',
    'pancetta', 'duck', 'veal', 'bison', 'venison', 'rabbit',
    'scallop', 'mussel', 'clam', 'oyster', 'squid', 'calamari',
    'octopus', 'anchovy', 'sardine', 'halibut', 'trout', 'bass',
    'snapper', 'mahi', 'swordfish', 'crawfish', 'crayfish'
  ],
  dairy_eggs: [
    'milk', 'cheese', 'butter', 'yogurt', 'cream', 'egg', 'sour cream',
    'cottage cheese', 'cream cheese', 'parmesan', 'mozzarella', 'cheddar',
    'feta', 'ricotta', 'half and half', 'whipping cream', 'mascarpone',
    'brie', 'gouda', 'gruyere', 'swiss', 'provolone', 'blue cheese',
    'goat cheese', 'queso', 'paneer', 'ghee', 'buttermilk', 'kefir',
    'heavy cream', 'light cream', 'evaporated milk', 'condensed milk',
    'crème fraîche', 'creme fraiche', 'custard'
  ],
  bakery: [
    'bread', 'rolls', 'bagel', 'tortilla', 'pita', 'bun', 'croissant',
    'english muffin', 'naan', 'flatbread', 'ciabatta', 'baguette',
    'sourdough', 'brioche', 'focaccia', 'pretzel', 'crouton',
    'breadcrumb', 'panko', 'pizza dough', 'pie crust', 'puff pastry',
    'phyllo', 'filo', 'cornbread', 'biscuit', 'scone', 'muffin',
    'donut', 'doughnut', 'danish', 'pastry', 'cake', 'cupcake'
  ],
  frozen: [
    'frozen', 'ice cream', 'popsicle', 'gelato', 'sorbet', 'sherbet',
    'frozen yogurt', 'frozen pizza', 'frozen dinner', 'frozen vegetable',
    'frozen fruit', 'frozen berry', 'frozen pea', 'frozen corn'
  ],
  canned: [
    'canned', 'beans', 'tomato sauce', 'broth', 'stock', 'coconut milk',
    'diced tomatoes', 'crushed tomatoes', 'tomato paste', 'chickpeas',
    'black beans', 'kidney beans', 'pinto beans', 'cannellini',
    'garbanzo', 'lentils', 'peas', 'corn', 'artichoke hearts',
    'olives', 'capers', 'anchovies', 'tuna', 'salmon', 'sardines',
    'soup', 'chili', 'enchilada sauce', 'salsa', 'marinara',
    'alfredo', 'pesto', 'curry paste', 'chipotle'
  ],
  pantry: [
    'flour', 'sugar', 'oil', 'salt', 'pepper', 'spice', 'rice', 'pasta',
    'sauce', 'vinegar', 'soy sauce', 'honey', 'maple', 'olive oil',
    'vegetable oil', 'sesame oil', 'baking', 'vanilla', 'cinnamon',
    'cumin', 'paprika', 'oregano', 'thyme', 'bay leaf', 'nutmeg',
    'cornstarch', 'baking powder', 'baking soda', 'yeast', 'oats',
    'quinoa', 'couscous', 'lentils', 'peanut butter', 'jam', 'jelly',
    'mustard', 'ketchup', 'mayonnaise', 'hot sauce', 'sriracha',
    'worcestershire', 'fish sauce', 'oyster sauce', 'hoisin',
    'teriyaki', 'bbq sauce', 'tahini', 'miso', 'gochujang',
    'curry powder', 'garam masala', 'turmeric', 'cayenne', 'chili powder',
    'garlic powder', 'onion powder', 'dried herbs', 'rosemary',
    'sage', 'dill', 'tarragon', 'marjoram', 'allspice', 'cardamom',
    'coriander', 'fennel seed', 'caraway', 'poppy seed', 'sesame seed',
    'sunflower seed', 'pumpkin seed', 'chia seed', 'flax seed',
    'almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut',
    'macadamia', 'pine nut', 'coconut', 'raisin', 'dried cranberry',
    'dried apricot', 'prune', 'chocolate', 'cocoa', 'coffee', 'tea',
    'noodle', 'spaghetti', 'penne', 'fusilli', 'macaroni', 'lasagna',
    'ramen', 'udon', 'soba', 'rice noodle', 'vermicelli',
    'breadcrumbs', 'cracker', 'tortilla chip', 'corn chip',
    'brown sugar', 'powdered sugar', 'confectioners sugar',
    'molasses', 'agave', 'corn syrup', 'extract', 'food coloring'
  ],
  other: []
};

/**
 * Categorizes an ingredient name into a store section category
 */
export function categorizeIngredient(name: string): IngredientCategory {
  const lowerName = name.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'other') continue;
    if (keywords.some(kw => lowerName.includes(kw))) {
      return category as IngredientCategory;
    }
  }

  return 'other';
}

/**
 * Returns the display order for a category (for sorting grocery list by store section)
 */
export function getCategoryOrder(category: IngredientCategory): number {
  const ORDER: Record<IngredientCategory, number> = {
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

/**
 * Returns the display name for a category
 */
export function getCategoryDisplayName(category: IngredientCategory): string {
  const NAMES: Record<IngredientCategory, string> = {
    produce: 'Produce',
    meat_seafood: 'Meat & Seafood',
    dairy_eggs: 'Dairy & Eggs',
    bakery: 'Bread & Bakery',
    frozen: 'Frozen',
    canned: 'Canned Goods',
    pantry: 'Pantry',
    other: 'Other',
  };
  return NAMES[category] ?? 'Other';
}
