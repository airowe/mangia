// lib/expiry-defaults.ts
// Smart expiry date defaults based on USDA FoodKeeper guidelines

interface ExpiryRule {
  keywords: string[];
  /** Days until expiry when stored in fridge (null = not applicable) */
  fridgeDays: number | null;
  /** Days until expiry when stored in pantry (null = not applicable) */
  pantryDays: number | null;
}

/**
 * Expiry rules organized by ingredient category and sub-category.
 * Values sourced from USDA FoodKeeper App guidelines.
 */
const EXPIRY_RULES: Record<string, ExpiryRule[]> = {
  produce: [
    { keywords: ["lettuce", "spinach", "kale", "arugula", "chard", "watercress", "endive", "bok choy"], fridgeDays: 5, pantryDays: null },
    { keywords: ["strawberry", "blueberry", "raspberry", "blackberry", "berry"], fridgeDays: 5, pantryDays: null },
    { keywords: ["basil", "cilantro", "parsley", "mint", "dill", "tarragon", "chive"], fridgeDays: 7, pantryDays: null },
    { keywords: ["tomato", "avocado", "banana", "peach", "plum", "pear", "mango", "kiwi", "papaya"], fridgeDays: 5, pantryDays: 3 },
    { keywords: ["mushroom"], fridgeDays: 7, pantryDays: null },
    { keywords: ["broccoli", "cauliflower", "asparagus", "green bean"], fridgeDays: 5, pantryDays: null },
    { keywords: ["bell pepper", "pepper", "zucchini", "cucumber", "eggplant", "squash", "celery"], fridgeDays: 7, pantryDays: null },
    { keywords: ["apple", "orange", "lemon", "lime", "grapefruit", "clementine"], fridgeDays: 21, pantryDays: 7 },
    { keywords: ["potato", "sweet potato", "yam"], fridgeDays: null, pantryDays: 30 },
    { keywords: ["onion", "shallot", "garlic", "ginger"], fridgeDays: null, pantryDays: 30 },
    { keywords: ["carrot", "beet", "turnip", "radish", "parsnip"], fridgeDays: 21, pantryDays: null },
    { keywords: ["cabbage"], fridgeDays: 14, pantryDays: null },
    { keywords: ["corn"], fridgeDays: 3, pantryDays: null },
    { keywords: ["watermelon", "cantaloupe", "honeydew", "melon"], fridgeDays: 5, pantryDays: 2 },
    { keywords: ["grape", "cherry"], fridgeDays: 7, pantryDays: null },
    { keywords: ["pineapple"], fridgeDays: 5, pantryDays: 2 },
  ],
  meat_seafood: [
    { keywords: ["chicken", "turkey", "duck", "poultry"], fridgeDays: 2, pantryDays: null },
    { keywords: ["ground beef", "ground turkey", "ground pork", "ground meat", "ground"], fridgeDays: 2, pantryDays: null },
    { keywords: ["salmon", "tuna", "cod", "tilapia", "halibut", "trout", "bass", "snapper", "mahi", "swordfish", "fish"], fridgeDays: 2, pantryDays: null },
    { keywords: ["shrimp", "scallop", "mussel", "clam", "oyster", "lobster", "crab", "crawfish", "squid", "calamari", "octopus"], fridgeDays: 2, pantryDays: null },
    { keywords: ["steak", "beef", "pork", "lamb", "veal", "bison", "venison"], fridgeDays: 4, pantryDays: null },
    { keywords: ["bacon"], fridgeDays: 7, pantryDays: null },
    { keywords: ["sausage"], fridgeDays: 3, pantryDays: null },
    { keywords: ["ham", "prosciutto", "pancetta", "deli", "lunch meat"], fridgeDays: 5, pantryDays: null },
  ],
  dairy_eggs: [
    { keywords: ["milk", "half and half", "buttermilk", "cream"], fridgeDays: 7, pantryDays: null },
    { keywords: ["egg", "eggs"], fridgeDays: 28, pantryDays: null },
    { keywords: ["yogurt", "kefir"], fridgeDays: 14, pantryDays: null },
    { keywords: ["butter", "ghee"], fridgeDays: 30, pantryDays: null },
    { keywords: ["parmesan", "cheddar", "gouda", "gruyere", "swiss", "provolone"], fridgeDays: 42, pantryDays: null },
    { keywords: ["mozzarella", "brie", "ricotta", "cream cheese", "feta", "goat cheese", "mascarpone", "queso", "paneer"], fridgeDays: 7, pantryDays: null },
    { keywords: ["sour cream", "crème fraîche", "creme fraiche"], fridgeDays: 14, pantryDays: null },
    { keywords: ["cottage cheese"], fridgeDays: 7, pantryDays: null },
  ],
  bakery: [
    { keywords: ["bread", "baguette", "ciabatta", "sourdough", "brioche", "focaccia"], fridgeDays: 14, pantryDays: 5 },
    { keywords: ["tortilla", "pita", "naan", "flatbread", "wrap"], fridgeDays: 14, pantryDays: 7 },
    { keywords: ["bagel", "english muffin", "roll", "bun", "croissant"], fridgeDays: 7, pantryDays: 3 },
    { keywords: ["cake", "cupcake", "muffin", "danish", "pastry", "donut", "doughnut", "scone"], fridgeDays: 5, pantryDays: 2 },
  ],
  frozen: [
    { keywords: ["frozen"], fridgeDays: null, pantryDays: null },
    // Frozen items get a long default — they're already frozen
    { keywords: ["ice cream", "gelato", "sorbet", "sherbet"], fridgeDays: null, pantryDays: null },
  ],
  canned: [
    { keywords: ["canned", "can of", "beans", "chickpeas", "lentils"], fridgeDays: null, pantryDays: 730 },
    { keywords: ["tomato sauce", "tomato paste", "diced tomatoes", "crushed tomatoes", "marinara", "salsa"], fridgeDays: null, pantryDays: 730 },
    { keywords: ["broth", "stock"], fridgeDays: null, pantryDays: 730 },
    { keywords: ["coconut milk"], fridgeDays: null, pantryDays: 730 },
    { keywords: ["olives", "capers", "artichoke hearts"], fridgeDays: null, pantryDays: 730 },
  ],
  pantry: [
    { keywords: ["flour", "sugar", "brown sugar", "powdered sugar", "cornstarch", "baking powder", "baking soda"], fridgeDays: null, pantryDays: 365 },
    { keywords: ["rice", "quinoa", "couscous", "oats", "cereal", "granola"], fridgeDays: null, pantryDays: 365 },
    { keywords: ["pasta", "spaghetti", "penne", "fusilli", "macaroni", "lasagna", "noodle", "ramen", "udon", "soba"], fridgeDays: null, pantryDays: 730 },
    { keywords: ["olive oil", "vegetable oil", "coconut oil", "sesame oil", "oil"], fridgeDays: null, pantryDays: 180 },
    { keywords: ["vinegar", "soy sauce", "fish sauce", "worcestershire", "hot sauce", "sriracha"], fridgeDays: null, pantryDays: 730 },
    { keywords: ["honey", "maple syrup", "molasses", "agave", "corn syrup"], fridgeDays: null, pantryDays: 730 },
    { keywords: ["peanut butter", "almond butter", "tahini"], fridgeDays: null, pantryDays: 180 },
    { keywords: ["jam", "jelly", "preserves"], fridgeDays: 180, pantryDays: 365 },
    { keywords: ["mustard", "ketchup", "mayonnaise", "bbq sauce", "hoisin", "teriyaki"], fridgeDays: 180, pantryDays: null },
    { keywords: ["salt", "pepper", "cinnamon", "cumin", "paprika", "oregano", "thyme", "turmeric", "cayenne", "chili powder", "garlic powder", "onion powder", "garam masala", "curry powder", "spice"], fridgeDays: null, pantryDays: 730 },
    { keywords: ["vanilla", "extract"], fridgeDays: null, pantryDays: 730 },
    { keywords: ["chocolate", "cocoa", "chocolate chip"], fridgeDays: null, pantryDays: 365 },
    { keywords: ["coffee", "tea"], fridgeDays: null, pantryDays: 365 },
    { keywords: ["almond", "walnut", "pecan", "cashew", "pistachio", "hazelnut", "pine nut", "nut"], fridgeDays: null, pantryDays: 180 },
    { keywords: ["raisin", "dried cranberry", "dried apricot", "prune", "dried fruit"], fridgeDays: null, pantryDays: 180 },
    { keywords: ["cracker", "chip", "tortilla chip", "breadcrumb", "panko"], fridgeDays: null, pantryDays: 90 },
    { keywords: ["yeast"], fridgeDays: 120, pantryDays: null },
  ],
};

/** Default frozen storage: 180 days */
const FROZEN_DEFAULT_DAYS = 180;

/**
 * Get a default expiry date for a food item based on its name and category.
 * Returns null if no matching rule is found (unknown items don't get guessed expiry dates).
 */
export function getExpiryDefault(
  name: string,
  category: string,
): Date | null {
  const lowerName = name.toLowerCase().trim();

  // Frozen items always get the frozen default
  if (category === "frozen" || lowerName.includes("frozen")) {
    const date = new Date();
    date.setDate(date.getDate() + FROZEN_DEFAULT_DAYS);
    return date;
  }

  // Check rules for the specific category first, then fall back to all categories
  const categoryRules = EXPIRY_RULES[category] ?? [];
  const allRules = Object.values(EXPIRY_RULES).flat();
  const ruleSets = [categoryRules, allRules];

  for (const rules of ruleSets) {
    for (const rule of rules) {
      if (rule.keywords.some((kw) => lowerName.includes(kw))) {
        // Prefer fridge days (most perishable items are refrigerated), fall back to pantry
        const days = rule.fridgeDays ?? rule.pantryDays;
        if (days !== null) {
          const date = new Date();
          date.setDate(date.getDate() + days);
          return date;
        }
        return null;
      }
    }
  }

  return null;
}
