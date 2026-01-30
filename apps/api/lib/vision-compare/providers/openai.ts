// lib/vision-compare/providers/openai.ts
// OpenAI GPT-4o Vision provider for pantry scanning comparison

import type { ScannedItem } from "../types";
import { COMPARISON_PROMPT } from "../prompt";

interface OpenAIChatResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * Call OpenAI Chat Completions API with vision (GPT-4o).
 */
export async function callOpenAI(
  imageBase64: string,
): Promise<{ items: ScannedItem[]; rawResponse: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: COMPARISON_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 2048,
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown");
    throw new Error(
      `OpenAI API returned status ${response.status}: ${errorText}`,
    );
  }

  const data = (await response.json()) as OpenAIChatResponse;

  const rawResponse = data.choices?.[0]?.message?.content ?? "";
  if (!rawResponse) {
    throw new Error("No response from OpenAI API");
  }

  const parsed = JSON.parse(rawResponse) as { items: ScannedItem[] };

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

function normalizeConfidence(
  value: unknown,
): "high" | "medium" | "low" {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "medium";
}
