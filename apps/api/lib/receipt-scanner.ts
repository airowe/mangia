// lib/receipt-scanner.ts
// Receipt OCR via Gemini 2.5 Flash-Lite vision

import { categorizeIngredient } from "./grocery-generator";
import type { IngredientCategory } from "@mangia/shared";

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  price: number | null;
  confidence: "high" | "medium" | "low";
}

export interface ReceiptScanResult {
  store: string | null;
  date: string | null;
  items: ReceiptItem[];
  subtotal: number | null;
  itemCount: number;
}

interface GeminiVisionResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

const RECEIPT_PROMPT = `You are analyzing a grocery store receipt. Extract all FOOD items purchased.
Return ONLY valid JSON with no markdown formatting.

{
  "store": "store name if visible or null",
  "date": "YYYY-MM-DD if visible or null",
  "items": [
    {
      "name": "full item name (expand abbreviations)",
      "quantity": 1,
      "unit": "pack/lb/oz/bag/bottle/piece",
      "price": 4.99,
      "confidence": "high/medium/low"
    }
  ],
  "subtotal": 0.00
}

Rules:
- ONLY include food and beverage items
- Expand receipt abbreviations (ORG = Organic, CHKN = Chicken, WHL = Whole, GRN = Green, etc.)
- Set quantity from receipt (look for "x2", "2 @", qty columns)
- Include price as shown on receipt
- Skip: tax, bags, discounts, coupons, non-food items (cleaning, paper, etc.)
- Set confidence based on readability of that line
- If store name appears at top of receipt, include it`;

/**
 * Scan a grocery receipt image and extract food items.
 */
export async function scanReceipt(
  imageBase64: string,
  storeName?: string,
): Promise<ReceiptScanResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = storeName
    ? `${RECEIPT_PROMPT}\n\nHint: This receipt is from ${storeName}.`
    : RECEIPT_PROMPT;

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
      signal: AbortSignal.timeout(25_000),
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

  const jsonStr = extractJson(rawText);
  if (!jsonStr) {
    throw new Error("Could not parse JSON from Gemini response");
  }

  const parsed = JSON.parse(jsonStr) as {
    store?: string;
    date?: string;
    items?: { name: string; quantity?: number; unit?: string; price?: number; confidence?: string }[];
    subtotal?: number;
  };

  const items: ReceiptItem[] = (parsed.items ?? []).map((item) => ({
    name: item.name,
    quantity: item.quantity ?? 1,
    unit: item.unit ?? "piece",
    category: categorizeIngredient(item.name),
    price: item.price ?? null,
    confidence: normalizeConfidence(item.confidence),
  }));

  return {
    store: parsed.store ?? storeName ?? null,
    date: parsed.date ?? null,
    items,
    subtotal: parsed.subtotal ?? null,
    itemCount: items.length,
  };
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
