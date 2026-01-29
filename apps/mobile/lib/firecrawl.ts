// lib/firecrawl.ts
// Blog recipe extraction - uses Cloudflare AI to parse HTML content

const CLOUDFLARE_ACCOUNT_ID = process.env.EXPO_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.EXPO_PUBLIC_CLOUDFLARE_API_TOKEN;
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

interface FirecrawlRecipe {
  title?: string;
  ingredients?: string[];
  instructions?: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  image?: string;
}

const RECIPE_EXTRACTION_PROMPT = `Extract the recipe from this webpage content. Return ONLY valid JSON with no additional text.

The JSON should have this exact structure:
{
  "title": "Recipe name",
  "ingredients": ["1 cup flour", "2 eggs", ...],
  "instructions": ["Step 1 description", "Step 2 description", ...],
  "prepTime": "15 minutes",
  "cookTime": "30 minutes",
  "servings": 4,
  "image": "https://example.com/image.jpg"
}

Rules:
- Extract all ingredients as strings with quantities included
- Extract all instruction steps as separate strings
- If prep/cook time is not found, omit those fields
- If servings is not found, omit that field
- Find the main recipe image URL if available
- Focus on the main recipe, ignore sidebar recipes or related recipes

Webpage content:
`;

/**
 * Extract recipe from a blog URL using free AI (Cloudflare or Gemini)
 */
export async function extractRecipeFromUrl(
  url: string,
  _apiKey?: string, // Kept for backwards compatibility, not used
): Promise<FirecrawlRecipe> {
  // Try print URL first for cleaner content (works for eitanbernath.com and similar sites)
  const printUrl = convertToPrintUrl(url);
  let html: string;

  try {
    html = await fetchWebpage(printUrl);
  } catch {
    // Fall back to original URL if print URL fails
    html = await fetchWebpage(url);
  }

  // Step 2: Extract text content from HTML
  const textContent = extractTextFromHtml(html);

  // Step 3: Use AI to extract structured recipe
  const recipe = await extractRecipeWithAI(textContent, url);

  return recipe;
}

/**
 * Try to convert a recipe URL to its print-friendly version
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

    // Add more site-specific print URL patterns here as needed
  } catch {
    // Invalid URL, return as-is
  }

  return url;
}

/**
 * Fetch webpage HTML content
 */
async function fetchWebpage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch webpage: ${response.status}`);
  }

  return response.text();
}

/**
 * Extract readable text from HTML, focusing on recipe content
 */
function extractTextFromHtml(html: string): string {
  // Remove script and style tags
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");

  // Extract image URLs before removing tags (look for recipe-related images)
  const imageMatches = html.match(
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
  );
  const images = imageMatches
    ?.map((img) => {
      const srcMatch = img.match(/src=["']([^"']+)["']/i);
      return srcMatch ? srcMatch[1] : null;
    })
    .filter(Boolean)
    .slice(0, 5); // Keep first 5 images

  // Convert HTML to text
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

  // Limit content length to avoid token limits
  const maxLength = 8000;
  if (text.length > maxLength) {
    text = text.slice(0, maxLength) + "...";
  }

  // Append image URLs for AI to pick from
  if (images && images.length > 0) {
    text += "\n\nImages found on page:\n" + images.join("\n");
  }

  return text;
}

/**
 * Extract recipe using Cloudflare AI or Gemini
 */
async function extractRecipeWithAI(
  content: string,
  sourceUrl: string,
): Promise<FirecrawlRecipe> {
  // Try Cloudflare first
  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
    return extractWithCloudflare(content);
  }

  // Fall back to Gemini
  if (GEMINI_API_KEY) {
    return extractWithGemini(content);
  }

  throw new Error(
    "No AI service configured. Please set up Cloudflare Workers AI or Gemini API.",
  );
}

/**
 * Extract recipe using Cloudflare Workers AI
 */
async function extractWithCloudflare(content: string): Promise<FirecrawlRecipe> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are a recipe extraction assistant. Extract recipes from webpage content and return only valid JSON.",
          },
          {
            role: "user",
            content: RECIPE_EXTRACTION_PROMPT + content,
          },
        ],
        max_tokens: 2048,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("Cloudflare AI error:", error);
    throw new Error("Failed to extract recipe with AI. Please try again.");
  }

  const data = await response.json();

  if (!data.success || !data.result?.response) {
    throw new Error("Invalid response from AI service");
  }

  return parseAIResponse(data.result.response);
}

/**
 * Extract recipe using Gemini API
 */
async function extractWithGemini(content: string): Promise<FirecrawlRecipe> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: RECIPE_EXTRACTION_PROMPT + content,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.1,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("Gemini API error:", error);
    throw new Error("Failed to extract recipe with AI. Please try again.");
  }

  const data = await response.json();

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("Invalid response from AI service");
  }

  return parseAIResponse(data.candidates[0].content.parts[0].text);
}

/**
 * Parse AI response text into recipe object
 */
function parseAIResponse(text: string): FirecrawlRecipe {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("Could not find JSON in AI response:", text);
    throw new Error("Could not parse recipe from AI response");
  }

  try {
    const recipe = JSON.parse(jsonMatch[0]);
    return {
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      image: recipe.image,
    };
  } catch (e) {
    console.error("JSON parse error:", e, "Raw:", jsonMatch[0]);
    throw new Error("Invalid recipe format from AI");
  }
}

export function mapToRecipeFormat(firecrawlRecipe: FirecrawlRecipe): {
  title: string;
  ingredients: { name: string }[];
  instructions: string[];
} {
  return {
    title: firecrawlRecipe.title || "Imported Recipe",
    ingredients: (firecrawlRecipe.ingredients || []).map((ingredient) => ({
      name: ingredient,
      quantity: 0,
      unit: "",
    })),
    instructions: firecrawlRecipe.instructions || [],
  };
}
