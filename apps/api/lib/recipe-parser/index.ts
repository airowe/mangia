// lib/recipe-parser/index.ts
// Orchestrator — detect URL type and route to the appropriate extractor

import type { ParsedRecipe, UrlType } from "./types";
import { extractRecipeFromBlogUrl } from "./blog-extractor";
import { extractRecipeWithAI } from "./ai-extractor";
import {
  getVideoTranscript,
  fetchVideoMetadata,
} from "./video-transcript";

export type { ParsedRecipe, UrlType } from "./types";

/**
 * Detect the platform type from a URL string.
 */
export function detectUrlType(url: string): UrlType {
  const lower = url.toLowerCase();

  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("instagram.com") || lower.includes("instagr.am"))
    return "instagram";
  if (lower.includes("youtube.com") || lower.includes("youtu.be"))
    return "youtube";

  return "blog";
}

/**
 * Parse a recipe from any supported URL.
 * Blog URLs are fetched + scraped. Video URLs use transcript APIs + AI.
 */
export async function parseRecipeFromUrl(
  url: string,
): Promise<ParsedRecipe> {
  const urlType = detectUrlType(url);

  if (urlType === "blog") {
    return extractRecipeFromBlogUrl(url);
  }

  return parseVideoRecipe(url, urlType);
}

/**
 * Parse recipe from a video URL (TikTok, YouTube, Instagram).
 * Attempts transcript extraction first, falls back to oEmbed metadata.
 */
async function parseVideoRecipe(
  url: string,
  type: UrlType,
): Promise<ParsedRecipe> {
  let content = "";
  let thumbnailUrl: string | undefined;

  // Step 1: Try video transcript (most detailed)
  try {
    const transcript = await getVideoTranscript(url, type);
    if (transcript && transcript.length > 50) {
      content = transcript;
    }
  } catch {
    // Fall through to oEmbed
  }

  // Step 2: Fall back to oEmbed metadata
  if (!content) {
    try {
      const videoInfo = await fetchVideoMetadata(url, type);
      content = videoInfo.content;
      thumbnailUrl = videoInfo.thumbnailUrl;
    } catch {
      // No metadata either
    }
  }

  // Step 3: If still no content, throw a helpful error
  if (!content || content.length < 20) {
    const platformName = type.charAt(0).toUpperCase() + type.slice(1);
    throw new Error(
      `Could not extract recipe from ${platformName} video. ` +
        "The video may not have captions available.\n\n" +
        "Try one of these options:\n" +
        "- Paste the recipe text manually\n" +
        "- Use a recipe blog URL instead\n" +
        "- Copy the video description and paste it",
    );
  }

  // Step 4: Extract structured recipe from the text content
  const recipe = await extractRecipeWithAI(content, "video");

  if (thumbnailUrl && !recipe.imageUrl) {
    recipe.imageUrl = thumbnailUrl;
  }

  return recipe;
}
