// lib/pantry-scanner.ts
// Vision AI integration for pantry scanning using Gemini 2.5 Flash-Lite

import { categorizeIngredient } from "./grocery-generator";
import type { IngredientCategory } from "@mangia/shared";

export interface ScannedPantryItem {
  name: string;
  category: IngredientCategory;
  confidence: number;
  quantity: number;
  unit: string;
  expiryDate: string | null;
  requiresReview: boolean;
}

interface GeminiRawItem {
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string | null;
}

interface GeminiVisionResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

const SCAN_PROMPT = `Identify all food items visible in this image. Return ONLY valid JSON with no markdown formatting.

{
  "items": [
    {
      "name": "item name",
      "quantity": 1,
      "unit": "can/bag/box/bottle/lb/oz/bunch/piece",
      "expiryDate": "YYYY-MM-DD or null if not visible"
    }
  ]
}

Rules:
- List every distinct food item you can see
- Estimate quantity based on what's visible
- Use common grocery units
- Only include expiryDate if you can clearly read a date on the packaging
- If unsure about an item, still include it with your best guess`;

const SCAN_PROMPT_NO_EXPIRY = `Identify all food items visible in this image. Return ONLY valid JSON with no markdown formatting.

{
  "items": [
    {
      "name": "item name",
      "quantity": 1,
      "unit": "can/bag/box/bottle/lb/oz/bunch/piece"
    }
  ]
}

Rules:
- List every distinct food item you can see
- Estimate quantity based on what's visible
- Use common grocery units
- If unsure about an item, still include it with your best guess`;

/**
 * Send an image to Gemini Vision API and extract food items.
 */
export async function scanPantryImage(
  imageBase64: string,
  extractExpiry: boolean,
): Promise<ScannedPantryItem[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = extractExpiry ? SCAN_PROMPT : SCAN_PROMPT_NO_EXPIRY;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      }),
      signal: AbortSignal.timeout(25000),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini Vision API returned status ${response.status}`);
  }

  const data = (await response.json()) as GeminiVisionResponse;

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("No response from Gemini Vision API");
  }

  // Parse JSON from response (may be wrapped in markdown code blocks)
  const jsonStr = extractJson(rawText);
  if (!jsonStr) {
    throw new Error("Could not parse JSON from Gemini response");
  }

  const parsed = JSON.parse(jsonStr) as { items: GeminiRawItem[] };

  if (!Array.isArray(parsed.items)) {
    return [];
  }

  const CONFIDENCE_THRESHOLD = 0.7;

  // Categorize each item and add confidence + review flag
  return parsed.items.map((item) => {
    const confidence = 0.85; // Gemini doesn't return confidence scores; use a reasonable default
    return {
      name: item.name,
      category: categorizeIngredient(item.name),
      confidence,
      quantity: item.quantity || 1,
      unit: item.unit || "piece",
      expiryDate: extractExpiry ? (item.expiryDate ?? null) : null,
      requiresReview: confidence < CONFIDENCE_THRESHOLD,
    };
  });
}

/** Extract the outermost JSON object from a string that may contain markdown fences. */
function extractJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") depth--;
    if (depth === 0) return text.slice(start, i + 1);
  }
  return null;
}
