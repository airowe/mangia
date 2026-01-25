import { extractRecipeFromUrl } from './firecrawl';
import { getVideoTranscript } from './videoTranscript';
import { extractIngredientsWithClaude } from './ingredientParser';
import { ParsedRecipe, RecipeSourceType } from '../models/Recipe';

const FIRECRAWL_API_KEY = process.env.EXPO_PUBLIC_FIRECRAWL_API_KEY || '';

export type UrlType = 'tiktok' | 'youtube' | 'instagram' | 'blog';

/**
 * Detects the type of URL (TikTok, YouTube, Instagram, or blog)
 */
export function detectUrlType(url: string): UrlType {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('tiktok.com')) return 'tiktok';
  if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) return 'instagram';
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';

  return 'blog';
}

/**
 * Maps UrlType to RecipeSourceType for database storage
 */
export function urlTypeToSourceType(urlType: UrlType): RecipeSourceType {
  return urlType as RecipeSourceType;
}

/**
 * Main entry point: parses a recipe from any supported URL type
 */
export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe> {
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

/**
 * Parses a blog recipe using Firecrawl
 */
async function parseBlogRecipe(url: string): Promise<ParsedRecipe> {
  if (!FIRECRAWL_API_KEY) {
    throw new Error('Firecrawl API key not configured');
  }

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

/**
 * Parses a video recipe by extracting transcript and using Claude
 */
async function parseVideoRecipe(url: string, type: 'tiktok' | 'youtube' | 'instagram'): Promise<ParsedRecipe> {
  // Step 1: Get video transcript
  const transcript = await getVideoTranscript(url, type);

  if (!transcript || transcript.length < 50) {
    throw new Error('Could not extract recipe content from video. Try pasting the video description or caption instead.');
  }

  // Step 2: Use Claude to extract structured recipe
  const recipe = await extractIngredientsWithClaude(transcript);

  return recipe;
}

/**
 * Parses time strings like "30 minutes", "1 hour 15 minutes", "PT30M"
 */
function parseTime(timeStr?: string): number | undefined {
  if (!timeStr) return undefined;

  // Handle ISO 8601 duration format (PT30M, PT1H15M)
  const isoMatch = timeStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (isoMatch) {
    const hours = parseInt(isoMatch[1] || '0');
    const minutes = parseInt(isoMatch[2] || '0');
    return hours * 60 + minutes;
  }

  // Handle natural language formats
  const minutes = timeStr.match(/(\d+)\s*min/i);
  const hours = timeStr.match(/(\d+)\s*hour/i);

  let total = 0;
  if (hours) total += parseInt(hours[1]) * 60;
  if (minutes) total += parseInt(minutes[1]);

  return total > 0 ? total : undefined;
}

/**
 * Fallback: Parse recipe from user-provided text (video description, caption, etc.)
 */
export async function parseRecipeFromText(text: string): Promise<ParsedRecipe> {
  if (!text || text.length < 20) {
    throw new Error('Please provide more recipe details');
  }

  return await extractIngredientsWithClaude(text);
}
