// lib/vision-compare/providers/gemini.ts
// Gemini Vision API provider for pantry scanning comparison

import type { ScannedItem } from "../types";
import { COMPARISON_PROMPT } from "../prompt";

interface GeminiVisionResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

/**
 * Call Gemini Vision API with a configurable model ID.
 * Supports gemini-2.0-flash and gemini-2.5-flash.
 */
export async function callGemini(
  imageBase64: string,
  modelId: string,
): Promise<{ items: ScannedItem[]; rawResponse: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: COMPARISON_PROMPT },
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
      signal: AbortSignal.timeout(30000),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown");
    throw new Error(
      `Gemini API (${modelId}) returned status ${response.status}: ${errorText}`,
    );
  }

  const data = (await response.json()) as GeminiVisionResponse;

  const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!rawResponse) {
    throw new Error(`No response from Gemini API (${modelId})`);
  }

  const jsonStr = extractJson(rawResponse);
  if (!jsonStr) {
    throw new Error(
      `Could not parse JSON from Gemini response (${modelId})`,
    );
  }

  const parsed = JSON.parse(jsonStr) as { items: ScannedItem[] };

  if (!Array.isArray(parsed.items)) {
    return { items: [], rawResponse };
  }

  // Normalize items to ensure correct shape
  const items: ScannedItem[] = parsed.items.map((item) => ({
    name: item.name || "unknown",
    quantity: item.quantity || 1,
    unit: item.unit || "piece",
    confidence: normalizeConfidence(item.confidence),
    expiryDate: item.expiryDate ?? null,
  }));

  return { items, rawResponse };
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

function normalizeConfidence(
  value: unknown,
): "high" | "medium" | "low" {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "medium";
}
