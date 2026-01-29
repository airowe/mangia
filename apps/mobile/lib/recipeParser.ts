// lib/recipeParser.ts
// Main orchestrator for URL → Recipe extraction

import { extractRecipeFromUrl } from "./firecrawl";
import { extractIngredientsWithClaude } from "./ingredientParser";
import { getVideoTranscript, VideoType } from "./videoTranscript";
import { ParsedRecipe } from "../models/Recipe";

const FIRECRAWL_API_KEY = process.env.EXPO_PUBLIC_FIRECRAWL_API_KEY!;

export type UrlType = "tiktok" | "youtube" | "instagram" | "blog";

/**
 * Detect the type of URL (platform) from a given URL string
 */
export function detectUrlType(url: string): UrlType {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("tiktok.com")) return "tiktok";
  if (lowerUrl.includes("instagram.com") || lowerUrl.includes("instagr.am"))
    return "instagram";
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be"))
    return "youtube";

  return "blog";
}

/**
 * Main entry point - parse recipe from any supported URL
 */
export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe> {
  const urlType = detectUrlType(url);

  switch (urlType) {
    case "blog":
      return await parseBlogRecipe(url);

    case "tiktok":
    case "instagram":
    case "youtube":
      return await parseVideoRecipe(url, urlType);

    default:
      throw new Error("Unsupported URL type");
  }
}

/**
 * Parse recipe from a blog URL using Firecrawl
 */
async function parseBlogRecipe(url: string): Promise<ParsedRecipe> {
  const firecrawlRecipe = await extractRecipeFromUrl(url, FIRECRAWL_API_KEY);

  return {
    title: firecrawlRecipe.title || "Imported Recipe",
    description: undefined,
    ingredients: (firecrawlRecipe.ingredients || []).map((ing) => ({
      name: ing,
      quantity: "",
      unit: "",
    })),
    instructions: firecrawlRecipe.instructions || [],
    prepTime: parseTime(firecrawlRecipe.prepTime),
    cookTime: parseTime(firecrawlRecipe.cookTime),
    servings: firecrawlRecipe.servings,
    imageUrl: firecrawlRecipe.image,
  };
}

/**
 * Parse recipe from a video URL (TikTok, YouTube, Instagram)
 * Attempts transcript extraction, falls back to oEmbed metadata
 */
async function parseVideoRecipe(
  url: string,
  type: UrlType,
): Promise<ParsedRecipe> {
  let content = "";
  let thumbnailUrl: string | undefined;

  // Step 1: Try to get video transcript (most detailed)
  try {
    console.log(`Attempting transcript extraction for ${type} video...`);
    const transcript = await getVideoTranscript(url, type as VideoType);
    if (transcript && transcript.length > 50) {
      console.log(`Got transcript: ${transcript.length} chars`);
      content = transcript;
    }
  } catch (transcriptError) {
    console.log(`Transcript not available: ${transcriptError}`);
    // Continue to fallback
  }

  // Step 2: If no transcript, try oEmbed metadata (title/description)
  if (!content) {
    try {
      console.log(`Falling back to oEmbed metadata for ${type}...`);
      const videoInfo = await fetchVideoMetadata(url, type);
      content = videoInfo.content;
      thumbnailUrl = videoInfo.thumbnailUrl;
    } catch (metadataError) {
      console.log(`oEmbed metadata not available: ${metadataError}`);
    }
  }

  // Step 3: If still no content, throw helpful error
  if (!content || content.length < 20) {
    const platformName = type.charAt(0).toUpperCase() + type.slice(1);
    throw new Error(
      `Could not extract recipe from ${platformName} video. ` +
        "The video may not have captions available.\n\n" +
        "Try one of these options:\n" +
        "• Paste the recipe text manually\n" +
        "• Use a recipe blog URL instead\n" +
        "• Copy the video description and paste it"
    );
  }

  // Use Claude to extract structured recipe from the content
  console.log(`Extracting recipe with Claude from ${content.length} chars...`);
  const recipe = await extractIngredientsWithClaude(content);

  // Include thumbnail if available
  if (thumbnailUrl && !recipe.imageUrl) {
    recipe.imageUrl = thumbnailUrl;
  }

  return recipe;
}

/**
 * Fetch basic metadata from video platforms
 * Full transcript support coming in Day 11
 */
async function fetchVideoMetadata(
  url: string,
  type: UrlType,
): Promise<{ content: string; thumbnailUrl?: string }> {
  switch (type) {
    case "youtube":
      return await fetchYouTubeMetadata(url);
    case "tiktok":
      return await fetchTikTokMetadata(url);
    case "instagram":
      return await fetchInstagramMetadata(url);
    default:
      throw new Error(`Unsupported video type: ${type}`);
  }
}

/**
 * Fetch YouTube video metadata (title, description)
 */
async function fetchYouTubeMetadata(
  url: string,
): Promise<{ content: string; thumbnailUrl?: string }> {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  // Try oEmbed API (no API key required) for basic metadata
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);

    if (response.ok) {
      const data = await response.json();
      return {
        content: data.title || "",
        thumbnailUrl: data.thumbnail_url,
      };
    }
  } catch (e) {
    console.warn("YouTube oEmbed failed:", e);
  }

  // Fallback - just use the video ID context
  throw new Error(
    "Could not fetch YouTube video metadata. Please paste the video description manually.",
  );
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
    /youtube\.com\/v\/([^&\s]+)/,
    /youtube\.com\/shorts\/([^&\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Fetch TikTok video metadata
 * Note: Full transcript support coming in Day 11
 */
async function fetchTikTokMetadata(
  url: string,
): Promise<{ content: string; thumbnailUrl?: string }> {
  // TikTok oEmbed for basic info
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl);

    if (response.ok) {
      const data = await response.json();
      return {
        content: data.title || "",
        thumbnailUrl: data.thumbnail_url,
      };
    }
  } catch (e) {
    console.warn("TikTok oEmbed failed:", e);
  }

  throw new Error(
    "Could not fetch TikTok video metadata. Please paste the video description manually.",
  );
}

/**
 * Fetch Instagram post metadata
 * Note: Instagram is restrictive, may require manual entry
 */
async function fetchInstagramMetadata(
  url: string,
): Promise<{ content: string; thumbnailUrl?: string }> {
  // Instagram oEmbed (requires app credentials in most cases)
  // For MVP, we'll likely need manual entry for Instagram

  throw new Error(
    "Instagram recipe import is not yet supported. " +
      "Please paste the recipe description manually or use the blog/YouTube URL.",
  );
}

/**
 * Parse recipe from raw text (for manual paste or fallback)
 */
export async function parseRecipeFromText(text: string): Promise<ParsedRecipe> {
  if (!text || text.trim().length < 20) {
    throw new Error("Please provide more recipe content to extract from");
  }

  return await extractIngredientsWithClaude(text);
}

/**
 * Parse time string to minutes
 */
function parseTime(timeStr?: string): number | undefined {
  if (!timeStr) return undefined;

  // Handle ISO 8601 duration (PT30M, PT1H30M)
  const isoMatch = timeStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (isoMatch) {
    const hours = parseInt(isoMatch[1] || "0");
    const minutes = parseInt(isoMatch[2] || "0");
    return hours * 60 + minutes;
  }

  // Handle formats like "30 minutes", "1 hour 15 minutes"
  const minutes = timeStr.match(/(\d+)\s*min/i);
  const hours = timeStr.match(/(\d+)\s*hour/i);

  let total = 0;
  if (hours) total += parseInt(hours[1]) * 60;
  if (minutes) total += parseInt(minutes[1]);

  return total > 0 ? total : undefined;
}
