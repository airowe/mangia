// lib/vision-compare/providers/claude.ts
// Anthropic Claude Vision provider for pantry scanning comparison

import type { ScannedItem } from "../types";
import { COMPARISON_PROMPT } from "../prompt";

interface AnthropicMessageResponse {
  content?: {
    type: string;
    text?: string;
  }[];
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

/**
 * Call Anthropic Messages API with vision (Claude Sonnet).
 */
export async function callClaude(
  imageBase64: string,
): Promise<{ items: ScannedItem[]; rawResponse: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: COMPARISON_PROMPT,
            },
          ],
        },
      ],
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown");
    throw new Error(
      `Anthropic API returned status ${response.status}: ${errorText}`,
    );
  }

  const data = (await response.json()) as AnthropicMessageResponse;

  const rawResponse =
    data.content?.find((c) => c.type === "text")?.text ?? "";
  if (!rawResponse) {
    throw new Error("No response from Anthropic API");
  }

  // Extract JSON — Claude may wrap in markdown fences
  const jsonStr = extractJson(rawResponse);
  if (!jsonStr) {
    throw new Error("Could not parse JSON from Claude response");
  }

  const parsed = JSON.parse(jsonStr) as { items: ScannedItem[] };

  if (!Array.isArray(parsed.items)) {
    return { items: [], rawResponse };
  }

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
