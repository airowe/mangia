// lib/ingredientParser.ts
// Use Cloudflare Workers AI to extract structured recipe from transcript/description
// Falls back to Gemini if Cloudflare is not configured

import { ParsedRecipe } from "../models/Recipe";

const CLOUDFLARE_ACCOUNT_ID = process.env.EXPO_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.EXPO_PUBLIC_CLOUDFLARE_API_TOKEN;
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const RECIPE_PROMPT = `Extract the recipe from this video transcript, description, or recipe text. Return ONLY valid JSON with no additional text.

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
 * Extract structured recipe data from text content using Cloudflare Workers AI
 * Falls back to Gemini if Cloudflare is not configured
 */
export async function extractIngredientsWithClaude(
  content: string,
): Promise<ParsedRecipe> {
  // Use Cloudflare Workers AI if configured (free tier)
  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
    return extractWithCloudflare(content);
  }

  // Fall back to Gemini if Cloudflare not configured
  if (GEMINI_API_KEY) {
    return extractWithGemini(content);
  }

  throw new Error(
    "No AI service configured. Please set up Cloudflare Workers AI or Gemini API.",
  );
}

/**
 * Extract recipe using Cloudflare Workers AI (Llama 3.3 70B)
 */
async function extractWithCloudflare(content: string): Promise<ParsedRecipe> {
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
              "You are a helpful recipe extraction assistant. Always respond with valid JSON only, no additional text.",
          },
          {
            role: "user",
            content: RECIPE_PROMPT + content,
          },
        ],
        max_tokens: 2048,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("Cloudflare AI error:", error);
    throw new Error("Failed to parse recipe with AI. Please try again.");
  }

  const data = await response.json();

  if (!data.success || !data.result?.response) {
    console.error("Invalid Cloudflare response:", data);
    throw new Error("Invalid response from AI service");
  }

  const text = data.result.response;
  return parseAIResponse(text);
}

/**
 * Extract recipe using Gemini API (fallback)
 */
async function extractWithGemini(content: string): Promise<ParsedRecipe> {
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
                text: RECIPE_PROMPT + content,
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
    throw new Error("Failed to parse recipe with AI. Please try again.");
  }

  const data = await response.json();

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error("Invalid Gemini response:", data);
    throw new Error("Invalid response from AI service");
  }

  return parseAIResponse(data.candidates[0].content.parts[0].text);
}

/**
 * Parse AI response text and extract JSON recipe
 */
function parseAIResponse(text: string): ParsedRecipe {
  // Extract JSON from response (in case there's extra text)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("Could not find JSON in AI response:", text);
    throw new Error("Could not parse recipe from AI response");
  }

  try {
    const recipe = JSON.parse(jsonMatch[0]);
    return normalizeRecipe(recipe);
  } catch (e) {
    console.error("JSON parse error:", e, "Raw:", jsonMatch[0]);
    throw new Error("Invalid recipe format from AI");
  }
}

/**
 * Normalize the raw AI response to our ParsedRecipe format
 */
function normalizeRecipe(raw: Record<string, unknown>): ParsedRecipe {
  // Handle ingredients - could be string array or object array
  const rawIngredients = raw.ingredients;
  let ingredients: ParsedRecipe["ingredients"] = [];

  if (Array.isArray(rawIngredients)) {
    ingredients = rawIngredients.map((ing: unknown) => {
      if (typeof ing === "string") {
        // Parse ingredient string like "1 cup flour"
        return parseIngredientString(ing);
      } else if (typeof ing === "object" && ing !== null) {
        const ingObj = ing as Record<string, unknown>;
        return {
          name: String(ingObj.name || ingObj.ingredient || ""),
          quantity: String(ingObj.quantity || ingObj.amount || ""),
          unit: String(ingObj.unit || ""),
        };
      }
      return { name: "", quantity: "", unit: "" };
    });
  }

  // Filter out empty ingredients
  ingredients = ingredients.filter((ing) => ing.name.trim() !== "");

  // Handle instructions - could be string array or single string
  let instructions: string[] = [];
  const rawInstructions = raw.instructions;

  if (Array.isArray(rawInstructions)) {
    instructions = rawInstructions
      .map((step: unknown) => {
        if (typeof step === "string") return step;
        if (typeof step === "object" && step !== null) {
          const stepObj = step as Record<string, unknown>;
          return String(
            stepObj.text || stepObj.step || stepObj.description || "",
          );
        }
        return "";
      })
      .filter((step) => step.trim() !== "");
  } else if (typeof rawInstructions === "string") {
    // Split on numbered steps or newlines
    instructions = rawInstructions
      .split(/(?:\d+\.\s*|\n)+/)
      .map((s) => s.trim())
      .filter((s) => s !== "");
  }

  return {
    title: String(raw.title || "Imported Recipe"),
    description:
      typeof raw.description === "string" ? raw.description : undefined,
    ingredients,
    instructions,
    prepTime:
      typeof raw.prep_time === "number" ? Math.round(raw.prep_time) : undefined,
    cookTime:
      typeof raw.cook_time === "number" ? Math.round(raw.cook_time) : undefined,
    servings:
      typeof raw.servings === "number" ? Math.round(raw.servings) : undefined,
    imageUrl: typeof raw.image_url === "string" ? raw.image_url : undefined,
  };
}

/**
 * Parse an ingredient string like "1 cup flour" into structured format
 */
function parseIngredientString(str: string): {
  name: string;
  quantity: string;
  unit: string;
} {
  // Common units to look for
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

  // Fallback - check for leading number
  const numberMatch = str.match(/^([\d./\s]+)\s+(.+)$/);
  if (numberMatch) {
    return {
      quantity: numberMatch[1].trim(),
      unit: "",
      name: numberMatch[2].trim(),
    };
  }

  return {
    quantity: "",
    unit: "",
    name: str.trim(),
  };
}
