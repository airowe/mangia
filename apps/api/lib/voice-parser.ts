// lib/voice-parser.ts
// Natural language voice input parsing via Gemini 2.5 Flash-Lite

import { categorizeIngredient } from "./grocery-generator";
import type { IngredientCategory } from "@mangia/shared";

export interface VoiceParsedItem {
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  confidence: "high" | "medium" | "low";
}

interface GeminiTextResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

const VOICE_PROMPT = `Parse this grocery/pantry item description into structured items. Return ONLY valid JSON with no markdown formatting.

{
  "items": [
    {
      "name": "item name",
      "quantity": 1,
      "unit": "lb/oz/bag/box/can/bottle/bunch/piece/gallon/dozen",
      "confidence": "high/medium/low"
    }
  ]
}

Rules:
- Extract every distinct food item mentioned
- Convert colloquial quantities: "a couple" = 2, "a few" = 3, "a dozen" = 12, "some" = 1, "a pack" = 1
- Use standard grocery units
- Expand abbreviated names (e.g., "OJ" = "Orange Juice")
- If quantity is ambiguous, default to 1
- confidence: "high" if clearly stated, "medium" if inferred, "low" if very ambiguous
- Ignore non-food mentions ("I just" / "we need" / "picked up" are just speech patterns)`;

/**
 * Parse a voice transcript into structured pantry items.
 */
export async function parseVoiceInput(transcript: string): Promise<VoiceParsedItem[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${VOICE_PROMPT}\n\nTranscript: "${transcript}"` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini API returned status ${response.status}`);
  }

  const data = (await response.json()) as GeminiTextResponse;
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("No response from Gemini API");
  }

  const jsonStr = extractJson(rawText);
  if (!jsonStr) {
    throw new Error("Could not parse JSON from Gemini response");
  }

  const parsed = JSON.parse(jsonStr) as {
    items?: { name: string; quantity?: number; unit?: string; confidence?: string }[];
  };

  return (parsed.items ?? []).map((item) => ({
    name: item.name,
    quantity: item.quantity ?? 1,
    unit: item.unit ?? "piece",
    category: categorizeIngredient(item.name),
    confidence: normalizeConfidence(item.confidence),
  }));
}

function normalizeConfidence(val?: string): "high" | "medium" | "low" {
  if (val === "high" || val === "medium" || val === "low") return val;
  return "medium";
}

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
