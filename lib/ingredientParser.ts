// lib/ingredientParser.ts
// Use Claude API to extract structured recipe from transcript/description

import { ParsedRecipe } from "../models/Recipe";

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY!;

/**
 * Extract structured recipe data from text content using Claude
 */
export async function extractIngredientsWithClaude(
  content: string,
): Promise<ParsedRecipe> {
  const prompt = `Extract the recipe from this video transcript, description, or recipe text. Return ONLY valid JSON with no additional text.

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
${content}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("Claude API error:", error);
    throw new Error("Failed to parse recipe with AI. Please try again.");
  }

  const data = await response.json();

  if (!data.content || !data.content[0] || !data.content[0].text) {
    throw new Error("Invalid response from AI service");
  }

  const text = data.content[0].text;

  // Extract JSON from response (in case there's extra text)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("Could not find JSON in Claude response:", text);
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
    prep_time:
      typeof raw.prep_time === "number" ? Math.round(raw.prep_time) : undefined,
    cook_time:
      typeof raw.cook_time === "number" ? Math.round(raw.cook_time) : undefined,
    servings:
      typeof raw.servings === "number" ? Math.round(raw.servings) : undefined,
    image_url: typeof raw.image_url === "string" ? raw.image_url : undefined,
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
