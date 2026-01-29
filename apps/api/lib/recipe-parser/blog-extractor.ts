// lib/recipe-parser/blog-extractor.ts
// Extract recipe content from blog/website URLs

import type { ParsedRecipe } from "./types";
import { extractRecipeWithAI } from "./ai-extractor";

/**
 * Extract a recipe from a blog URL.
 * Fetches the page HTML, strips it to text, then uses AI to extract structured data.
 */
export async function extractRecipeFromBlogUrl(
  url: string,
): Promise<ParsedRecipe> {
  // Try print URL first for cleaner content
  const printUrl = convertToPrintUrl(url);
  let html: string;

  try {
    html = await fetchWebpage(printUrl);
  } catch {
    html = await fetchWebpage(url);
  }

  const textContent = extractTextFromHtml(html);

  return extractRecipeWithAI(textContent, "blog");
}

/**
 * Convert a recipe URL to its print-friendly version for specific sites.
 */
function convertToPrintUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // eitanbernath.com: /2024/06/06/recipe-name/ -> /print/recipe-name
    if (parsed.hostname.includes("eitanbernath.com")) {
      const match = url.match(/\/\d{4}\/\d{2}\/\d{2}\/([^/]+)/);
      if (match) {
        return `${parsed.origin}/print/${match[1]}`;
      }
    }
  } catch {
    // Invalid URL, return as-is
  }

  return url;
}

/**
 * Fetch webpage HTML with a browser-like User-Agent.
 */
async function fetchWebpage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch webpage: ${response.status}`);
  }

  return response.text();
}

/**
 * Strip HTML to readable text, preserving image URLs for the AI to pick from.
 */
function extractTextFromHtml(html: string): string {
  // Remove non-content tags
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");

  // Extract image URLs before stripping tags
  const imageMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  const images = imageMatches
    ?.map((img) => {
      const srcMatch = img.match(/src=["']([^"']+)["']/i);
      return srcMatch ? srcMatch[1] : null;
    })
    .filter(Boolean)
    .slice(0, 5);

  // Convert HTML to plain text
  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  // Limit content to stay within AI token limits
  const maxLength = 8000;
  if (text.length > maxLength) {
    text = text.slice(0, maxLength) + "...";
  }

  // Append image URLs for AI to reference
  if (images && images.length > 0) {
    text += "\n\nImages found on page:\n" + images.join("\n");
  }

  return text;
}
