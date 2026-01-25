# Services and APIs

## Service Architecture

```
lib/
├── supabase.ts          # Supabase client (from grosheries)
├── auth.ts              # Auth helpers (from grosheries)
├── recipes.ts           # Recipe CRUD (adapt from grosheries)
├── pantry.ts            # Pantry CRUD (from grosheries)
├── groceryList.ts       # NEW: Grocery list generation
├── recipeParser.ts      # NEW: URL → recipe extraction
├── videoTranscript.ts   # NEW: Video → transcript
├── ingredientParser.ts  # NEW: Claude API for ingredient extraction
├── firecrawl.ts         # Blog URL extraction (from grosheries)
├── revenuecat.ts        # NEW: Subscription management
└── api/
    └── client.ts        # API client (from grosheries)
```

---

## External APIs

| Service | Purpose | Cost |
|---------|---------|------|
| **Supabase** | Auth, Database | Free tier sufficient |
| **Firecrawl** | Blog recipe extraction | Pay per use |
| **Claude API** | Ingredient extraction from transcripts | Pay per use |
| **RevenueCat** | Subscription management | Free + % of revenue |
| **RapidAPI** | TikTok/Instagram transcript (optional) | Pay per use |

---

## Service Implementations

### 1. Recipe Parser Service (`lib/recipeParser.ts`)

Main orchestrator for URL → Recipe extraction.

```typescript
// lib/recipeParser.ts
import { extractRecipeFromUrl } from './firecrawl';
import { getVideoTranscript } from './videoTranscript';
import { extractIngredientsWithClaude } from './ingredientParser';
import { ParsedRecipe, RecipeSourceType } from '../types/api';

const FIRECRAWL_API_KEY = process.env.EXPO_PUBLIC_FIRECRAWL_API_KEY!;
const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY!;

export type UrlType = 'tiktok' | 'youtube' | 'instagram' | 'blog';

export function detectUrlType(url: string): UrlType {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('tiktok.com')) return 'tiktok';
  if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) return 'instagram';
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  
  return 'blog';
}

export async function parseRecipeFromUrl(url: string): Promangia<ParsedRecipe> {
  const urlType = detectUrlType(url);
  
  switch (urlType) {
    case 'blog':
      return await parseBlogRecipe(url);
    
    case 'tiktok':
    case 'instagram':
    case 'youtube':
      return await parseVideoRecipe(url, urlType);
    
    default:
      throw new Error('Unsupported URL type');
  }
}

async function parseBlogRecipe(url: string): Promangia<ParsedRecipe> {
  // Use existing Firecrawl implementation
  const firecrawlRecipe = await extractRecipeFromUrl(url, FIRECRAWL_API_KEY);
  
  return {
    title: firecrawlRecipe.title || 'Imported Recipe',
    ingredients: (firecrawlRecipe.ingredients || []).map(ing => ({
      name: ing,
      quantity: '',
      unit: '',
    })),
    instructions: firecrawlRecipe.instructions || [],
    prep_time: parseTime(firecrawlRecipe.prepTime),
    cook_time: parseTime(firecrawlRecipe.cookTime),
    servings: firecrawlRecipe.servings,
    image_url: firecrawlRecipe.image,
  };
}

async function parseVideoRecipe(url: string, type: UrlType): Promangia<ParsedRecipe> {
  // Step 1: Get video transcript
  const transcript = await getVideoTranscript(url, type);
  
  if (!transcript || transcript.length < 50) {
    throw new Error('Could not extract recipe content from video');
  }
  
  // Step 2: Use Claude to extract structured recipe
  const recipe = await extractIngredientsWithClaude(transcript);
  
  return recipe;
}

function parseTime(timeStr?: string): number | undefined {
  if (!timeStr) return undefined;
  
  // Handle formats like "30 minutes", "1 hour 15 minutes", "PT30M"
  const minutes = timeStr.match(/(\d+)\s*min/i);
  const hours = timeStr.match(/(\d+)\s*hour/i);
  
  let total = 0;
  if (hours) total += parseInt(hours[1]) * 60;
  if (minutes) total += parseInt(minutes[1]);
  
  return total > 0 ? total : undefined;
}
```

---

### 2. Video Transcript Service (`lib/videoTranscript.ts`)

Extract transcripts/captions from video platforms.

```typescript
// lib/videoTranscript.ts

export type VideoType = 'tiktok' | 'instagram' | 'youtube';

export async function getVideoTranscript(url: string, type: VideoType): Promangia<string> {
  switch (type) {
    case 'youtube':
      return await getYouTubeTranscript(url);
    case 'tiktok':
      return await getTikTokTranscript(url);
    case 'instagram':
      return await getInstagramTranscript(url);
    default:
      throw new Error(`Unsupported video type: ${type}`);
  }
}

async function getYouTubeTranscript(url: string): Promangia<string> {
  // Extract video ID from URL
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error('Invalid YouTube URL');
  
  // Option 1: Use YouTube Transcript API (unofficial)
  // Option 2: Use a third-party service
  // Option 3: Use RapidAPI YouTube transcription service
  
  const response = await fetch(
    `https://youtube-transcripts.p.rapidapi.com/youtube/transcript?url=${encodeURIComponent(url)}`,
    {
      headers: {
        'X-RapidAPI-Key': process.env.EXPO_PUBLIC_RAPIDAPI_KEY!,
        'X-RapidAPI-Host': 'youtube-transcripts.p.rapidapi.com',
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to get YouTube transcript');
  }
  
  const data = await response.json();
  
  // Combine transcript segments into single string
  return data.content
    .map((segment: { text: string }) => segment.text)
    .join(' ');
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
    /youtube\.com\/v\/([^&\s]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

async function getTikTokTranscript(url: string): Promangia<string> {
  // TikTok doesn't have official transcript API
  // Options:
  // 1. Use RapidAPI TikTok service
  // 2. Scrape video page for auto-captions
  // 3. Use audio transcription service (Whisper API)
  
  // For MVP, try RapidAPI first
  const response = await fetch(
    `https://tiktok-video-no-watermark2.p.rapidapi.com/?url=${encodeURIComponent(url)}`,
    {
      headers: {
        'X-RapidAPI-Key': process.env.EXPO_PUBLIC_RAPIDAPI_KEY!,
        'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com',
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to get TikTok video info');
  }
  
  const data = await response.json();
  
  // Try to get caption/description first
  if (data.data?.title) {
    return data.data.title;
  }
  
  // Fallback: would need audio transcription
  throw new Error('TikTok video has no available transcript');
}

async function getInstagramTranscript(url: string): Promangia<string> {
  // Similar approach to TikTok
  // Instagram Reels often have auto-generated captions
  
  // For MVP, use RapidAPI Instagram service
  throw new Error('Instagram transcript extraction not yet implemented');
}
```

**Note:** Video transcript extraction is the hardest part. Fallback options:
1. Ask user to paste video description
2. Manual entry screen
3. Use Whisper API for audio transcription (more complex/expensive)

---

### 3. Ingredient Parser Service (`lib/ingredientParser.ts`)

Use Claude API to extract structured recipe from transcript.

```typescript
// lib/ingredientParser.ts
import { ParsedRecipe } from '../types/api';

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY!;

export async function extractIngredientsWithClaude(content: string): Promangia<ParsedRecipe> {
  const prompt = `Extract the recipe from this video transcript or description. Return ONLY valid JSON with no additional text.

The JSON should have this exact structure:
{
  "title": "Recipe name",
  "description": "Brief description",
  "ingredients": [
    {"name": "ingredient name", "quantity": "1", "unit": "cup"}
  ],
  "instructions": ["Step 1", "Step 2"],
  "prep_time": 10,
  "cook_time": 20,
  "servings": 4
}

Rules:
- For ingredients, separate quantity, unit, and name
- If quantity is unclear, use "1" and "to taste" or "as needed" for unit
- Instructions should be clear, numbered steps
- prep_time and cook_time are in minutes (integers)
- If you can't determine a value, omit that field

Content to extract from:
${content}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Claude API error:', error);
    throw new Error('Failed to parse recipe with AI');
  }

  const data = await response.json();
  const text = data.content[0].text;
  
  // Extract JSON from response (in case there's extra text)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse recipe from AI response');
  }

  try {
    const recipe = JSON.parse(jsonMatch[0]);
    return normalizeRecipe(recipe);
  } catch (e) {
    console.error('JSON parse error:', e);
    throw new Error('Invalid recipe format from AI');
  }
}

function normalizeRecipe(raw: any): ParsedRecipe {
  return {
    title: raw.title || 'Imported Recipe',
    description: raw.description,
    ingredients: (raw.ingredients || []).map((ing: any) => ({
      name: ing.name || ing,
      quantity: String(ing.quantity || ''),
      unit: ing.unit || '',
    })),
    instructions: raw.instructions || [],
    prep_time: typeof raw.prep_time === 'number' ? raw.prep_time : undefined,
    cook_time: typeof raw.cook_time === 'number' ? raw.cook_time : undefined,
    servings: typeof raw.servings === 'number' ? raw.servings : undefined,
    image_url: raw.image_url,
  };
}
```

---

### 4. Grocery List Service (`lib/groceryList.ts`)

Generate consolidated grocery list from recipes, checking against pantry.

```typescript
// lib/groceryList.ts
import { Recipe, RecipeIngredient } from '../models/Recipe';
import { PantryItem } from '../models/PantryItem';
import { fetchPantryItems } from './pantry';
import { categorizeIngredient } from '../utils/categorizeIngredient';
import { ConsolidatedIngredient, IngredientCategory } from '../types/api';

export async function generateGroceryList(
  recipes: Recipe[]
): Promangia<ConsolidatedIngredient[]> {
  // Get user's pantry
  const pantryItems = await fetchPantryItems();
  const pantryMap = buildPantryMap(pantryItems);
  
  // Consolidate ingredients from all recipes
  const consolidated = consolidateIngredients(recipes);
  
  // Check against pantry
  const withPantryStatus = consolidated.map(item => {
    const pantryKey = normalizeIngredientName(item.name);
    const pantryItem = pantryMap.get(pantryKey);
    
    const inPantry = !!pantryItem;
    const pantryQuantity = pantryItem?.quantity || 0;
    const needToBuy = Math.max(0, item.total_quantity - pantryQuantity);
    
    return {
      ...item,
      in_pantry: inPantry,
      pantry_quantity: pantryQuantity,
      need_to_buy: needToBuy,
    };
  });
  
  // Sort by category (store layout)
  return withPantryStatus.sort((a, b) => {
    const orderA = CATEGORY_ORDER.indexOf(a.category);
    const orderB = CATEGORY_ORDER.indexOf(b.category);
    return orderA - orderB;
  });
}

function buildPantryMap(items: PantryItem[]): Map<string, PantryItem> {
  const map = new Map<string, PantryItem>();
  
  for (const item of items) {
    const key = normalizeIngredientName(item.title);
    map.set(key, item);
  }
  
  return map;
}

function consolidateIngredients(recipes: Recipe[]): ConsolidatedIngredient[] {
  const ingredientMap = new Map<string, ConsolidatedIngredient>();
  
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const key = normalizeIngredientName(ingredient.name);
      
      if (ingredientMap.has(key)) {
        // Add to existing
        const existing = ingredientMap.get(key)!;
        existing.total_quantity += ingredient.quantity || 0;
        existing.from_recipes.push({
          recipe_id: recipe.id,
          recipe_title: recipe.title,
          quantity: ingredient.quantity || 0,
        });
      } else {
        // Create new entry
        ingredientMap.set(key, {
          name: ingredient.name,
          total_quantity: ingredient.quantity || 0,
          unit: ingredient.unit || '',
          category: categorizeIngredient(ingredient.name),
          from_recipes: [{
            recipe_id: recipe.id,
            recipe_title: recipe.title,
            quantity: ingredient.quantity || 0,
          }],
          in_pantry: false,
          pantry_quantity: 0,
          need_to_buy: 0,
        });
      }
    }
  }
  
  return Array.from(ingredientMap.values());
}

export function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')  // Remove punctuation
    .replace(/\s+/g, ' ')          // Normalize whitespace
    // Remove common quantity words that might be in the name
    .replace(/\b(fresh|dried|chopped|minced|diced|sliced|whole|large|small|medium)\b/g, '')
    .trim();
}

const CATEGORY_ORDER: IngredientCategory[] = [
  'produce',
  'meat_seafood',
  'dairy_eggs',
  'bakery',
  'frozen',
  'canned',
  'pantry',
  'other',
];

// Filter to only items that need to be purchased
export function getItemsToBuy(items: ConsolidatedIngredient[]): ConsolidatedIngredient[] {
  return items.filter(item => item.need_to_buy > 0);
}

// Filter to items user already has
export function getItemsInPantry(items: ConsolidatedIngredient[]): ConsolidatedIngredient[] {
  return items.filter(item => item.in_pantry);
}
```

---

### 5. Firecrawl Service (`lib/firecrawl.ts`)

**Already implemented in grosheries.** Keep as-is:

```typescript
// lib/firecrawl.ts (existing from grosheries)
interface FirecrawlRecipe {
  title?: string;
  ingredients?: string[];
  instructions?: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  image?: string;
}

export async function extractRecipeFromUrl(
  url: string, 
  apiKey: string
): Promangia<FirecrawlRecipe> {
  const response = await fetch('https://api.firecrawl.dev/v1/extract/recipe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: url,
      format: 'json',
    }),
  });

  if (!response.ok) {
    throw new Error(`Error extracting recipe: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || {};
}
```

---

### 6. Recipe CRUD Service (`lib/recipes.ts`)

**Adapt from grosheries.** Key methods needed:

```typescript
// lib/recipes.ts
import { supabase } from './supabase';
import { Recipe, RecipeIngredient, RecipeStatus } from '../models/Recipe';

export const recipeService = {
  // Create new recipe
  async createRecipe(recipe: Omit<Recipe, 'id' | 'created_at'>): Promangia<Recipe> {
    const { data, error } = await supabase
      .from('recipes')
      .insert({
        user_id: recipe.user_id,
        title: recipe.title,
        description: recipe.description,
        instructions: recipe.instructions,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        image_url: recipe.image_url,
        source_url: recipe.source_url,
        source_type: recipe.source_type,
        status: recipe.status || 'want_to_cook',
      })
      .select()
      .single();

    if (error) throw error;

    // Insert ingredients
    if (recipe.ingredients.length > 0) {
      await this.addIngredients(data.id, recipe.ingredients);
    }

    return { ...data, ingredients: recipe.ingredients };
  },

  // Add ingredients to recipe
  async addIngredients(recipeId: string, ingredients: RecipeIngredient[]): Promangia<void> {
    const rows = ingredients.map((ing, index) => ({
      recipe_id: recipeId,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      category: ing.category,
      display_order: index,
    }));

    const { error } = await supabase
      .from('recipe_ingredients')
      .insert(rows);

    if (error) throw error;
  },

  // Get recipes by status
  async getRecipesByStatus(userId: string, status: RecipeStatus): Promangia<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients:recipe_ingredients(*)
      `)
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get all user recipes
  async getAllRecipes(userId: string): Promangia<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients:recipe_ingredients(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get single recipe by ID
  async getRecipeById(recipeId: string): Promangia<Recipe | null> {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients:recipe_ingredients(*)
      `)
      .eq('id', recipeId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update recipe status
  async updateStatus(recipeId: string, status: RecipeStatus): Promangia<void> {
    const { error } = await supabase
      .from('recipes')
      .update({ status })
      .eq('id', recipeId);

    if (error) throw error;
  },

  // Delete recipe
  async deleteRecipe(recipeId: string): Promangia<void> {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (error) throw error;
  },

  // Search recipes
  async searchRecipes(userId: string, query: string): Promangia<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients:recipe_ingredients(*)
      `)
      .eq('user_id', userId)
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
```

---

### 7. Pantry Service (`lib/pantry.ts`)

**Keep from grosheries as-is.** Already implemented with full CRUD.

---

## Environment Variables

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_FIRECRAWL_API_KEY=your_firecrawl_key
EXPO_PUBLIC_CLAUDE_API_KEY=your_claude_key
EXPO_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key  # For video transcripts
EXPO_PUBLIC_REVENUECAT_API_KEY=your_revenuecat_key
```

---

## API Error Handling

```typescript
// utils/apiError.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): never {
  if (error instanceof ApiError) {
    throw error;
  }
  
  if (error instanceof Error) {
    throw new ApiError(error.message, 'UNKNOWN_ERROR');
  }
  
  throw new ApiError('An unexpected error occurred', 'UNKNOWN_ERROR');
}
```
