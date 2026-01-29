// lib/recipe-parser/ai-extractor.ts
// Consolidated AI extraction — Cloudflare Workers AI (primary) + Gemini (fallback)

import type { ParsedRecipe, RawExtractedRecipe } from "./types";

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const FETCH_TIMEOUT = 6000;

const BLOG_PROMPT = `Extract the recipe from this webpage content. Return ONLY valid JSON with no additional text.

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

const VIDEO_PROMPT = `Extract the recipe from this video transcript, description, or recipe text. Return ONLY valid JSON with no additional text.

The JSON should have this exact structure:
{
  "title": "Recipe name",
  "description": "Brief description of the dish",
  "ingredients": [
    {"name": "ingredient name", "quantity": "1", "unit": "cup"}
  ],
  "instructions": ["Step 1 description", "Step 2 description"],
  "prep_time": 10,
  "cook_time": 20,
  "servings": 4
}

Rules:
- For ingredients, separate quantity, unit, and name
- If quantity is unclear, use "1" as quantity and "to taste" or "as needed" for unit
- Instructions should be clear, actionable steps
- prep_time and cook_time are in minutes (integers only)
- If you cannot determine a value, omit that field entirely
- Extract as much useful information as possible

Content to extract from:
`;

/**
 * Extract a structured recipe from raw content using AI.
 * Uses Cloudflare Workers AI (Llama 3.3 70B) with Gemini as fallback.
 */
export async function extractRecipeWithAI(
  content: string,
  mode: "blog" | "video",
): Promise<ParsedRecipe> {
  const prompt = mode === "blog" ? BLOG_PROMPT : VIDEO_PROMPT;

  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
    return extractWithCloudflare(prompt + content);
  }

  if (GEMINI_API_KEY) {
    return extractWithGemini(prompt + content);
  }

  throw new Error(
    "No AI service configured. Set CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN or GEMINI_API_KEY.",
  );
}

async function extractWithCloudflare(prompt: string): Promise<ParsedRecipe> {
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
              "You are a recipe extraction assistant. Extract recipes and return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("Cloudflare AI error:", error);
    throw new Error("Failed to extract recipe with AI");
  }

  const data = await response.json();

  if (!data.success || !data.result?.response) {
    throw new Error("Invalid response from Cloudflare AI");
  }

  return parseAIResponse(data.result.response);
}

async function extractWithGemini(prompt: string): Promise<ParsedRecipe> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.1 },
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("Gemini API error:", error);
    throw new Error("Failed to extract recipe with AI");
  }

  const data = await response.json();

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("Invalid response from Gemini AI");
  }

  return parseAIResponse(data.candidates[0].content.parts[0].text);
}

/**
 * Parse raw AI text response into a structured recipe.
 */
export function parseAIResponse(text: string): ParsedRecipe {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("No JSON found in AI response:", text.slice(0, 200));
    throw new Error("Could not parse recipe from AI response");
  }

  try {
    const raw: RawExtractedRecipe = JSON.parse(jsonMatch[0]);
    return normalizeRecipe(raw);
  } catch (e) {
    console.error("JSON parse error:", e);
    throw new Error("Invalid recipe format from AI");
  }
}

/**
 * Normalize the raw AI output into our ParsedRecipe shape.
 * Handles both string-array and object-array ingredients, string or array instructions, etc.
 */
export function normalizeRecipe(raw: RawExtractedRecipe): ParsedRecipe {
  // --- Ingredients ---
  const rawIngredients = raw.ingredients;
  let ingredients: ParsedRecipe["ingredients"] = [];

  if (Array.isArray(rawIngredients)) {
    ingredients = rawIngredients
      .map((ing: unknown) => {
        if (typeof ing === "string") {
          return parseIngredientString(ing);
        }
        if (typeof ing === "object" && ing !== null) {
          const obj = ing as Record<string, unknown>;
          return {
            name: String(obj.name || obj.ingredient || ""),
            quantity: String(obj.quantity || obj.amount || ""),
            unit: String(obj.unit || ""),
          };
        }
        return { name: "", quantity: "", unit: "" };
      })
      .filter((ing) => ing.name.trim() !== "");
  }

  // --- Instructions ---
  let instructions: string[] = [];
  const rawInstructions = raw.instructions;

  if (Array.isArray(rawInstructions)) {
    instructions = rawInstructions
      .map((step: unknown) => {
        if (typeof step === "string") return step;
        if (typeof step === "object" && step !== null) {
          const obj = step as Record<string, unknown>;
          return String(obj.text || obj.step || obj.description || "");
        }
        return "";
      })
      .filter((s) => s.trim() !== "");
  } else if (typeof rawInstructions === "string") {
    instructions = rawInstructions
      .split(/(?:\d+\.\s*|\n)+/)
      .map((s) => s.trim())
      .filter((s) => s !== "");
  }

  // --- Times ---
  const prepTime = resolveTime(raw.prep_time ?? raw.prepTime);
  const cookTime = resolveTime(raw.cook_time ?? raw.cookTime);

  // --- Image ---
  const imageUrl = resolveString(raw.image ?? raw.image_url ?? raw.imageUrl);

  return {
    title: String(raw.title || "Imported Recipe"),
    description: typeof raw.description === "string" ? raw.description : undefined,
    ingredients,
    instructions,
    prepTime,
    cookTime,
    servings: typeof raw.servings === "number" ? Math.round(raw.servings) : undefined,
    imageUrl,
  };
}

function resolveTime(value: unknown): number | undefined {
  if (typeof value === "number") return Math.round(value);
  if (typeof value === "string") return parseTimeString(value);
  return undefined;
}

function resolveString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Parse human-readable or ISO 8601 time strings to minutes.
 */
function parseTimeString(timeStr: string): number | undefined {
  // ISO 8601: PT30M, PT1H30M
  const isoMatch = timeStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (isoMatch) {
    const hours = parseInt(isoMatch[1] || "0");
    const minutes = parseInt(isoMatch[2] || "0");
    return hours * 60 + minutes || undefined;
  }

  // Human-readable: "30 minutes", "1 hour 15 minutes"
  const minutesMatch = timeStr.match(/(\d+)\s*min/i);
  const hoursMatch = timeStr.match(/(\d+)\s*hour/i);

  let total = 0;
  if (hoursMatch) total += parseInt(hoursMatch[1]) * 60;
  if (minutesMatch) total += parseInt(minutesMatch[1]);

  return total > 0 ? total : undefined;
}

/**
 * Parse an ingredient string like "1 cup flour" into structured format.
 */
export function parseIngredientString(str: string): {
  name: string;
  quantity: string;
  unit: string;
} {
  const units = [
    "cups?",
    "tbsp",
    "tablespoons?",
    "tsp",
    "teaspoons?",
    "oz",
    "ounces?",
    "lbs?",
    "pounds?",
    "g",
    "grams?",
    "kg",
    "kilograms?",
    "ml",
    "milliliters?",
    "l",
    "liters?",
    "pinch",
    "dash",
    "cloves?",
    "slices?",
    "pieces?",
    "bunch",
    "bunches",
    "heads?",
    "stalks?",
    "sprigs?",
    "can",
    "cans",
    "package",
    "packages",
    "bag",
    "bags",
  ];

  const unitPattern = new RegExp(
    `^([\\d./\\s]+)?\\s*(${units.join("|")})?\\s*(?:of\\s+)?(.+)$`,
    "i",
  );

  const match = str.trim().match(unitPattern);
  if (match) {
    return {
      quantity: (match[1] || "").trim(),
      unit: (match[2] || "").trim(),
      name: (match[3] || str).trim(),
    };
  }

  // Fallback: leading number
  const numberMatch = str.match(/^([\d./\s]+)\s+(.+)$/);
  if (numberMatch) {
    return {
      quantity: numberMatch[1].trim(),
      unit: "",
      name: numberMatch[2].trim(),
    };
  }

  return { quantity: "", unit: "", name: str.trim() };
}
