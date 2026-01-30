// lib/email-receipt/ai-fallback.ts
// AI-powered extraction for unknown email receipt formats

import { categorizeIngredient } from "../grocery-generator";
import type { ReceiptEmailItem, ParsedReceipt } from "./types";

interface GeminiTextResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

const EMAIL_RECEIPT_PROMPT = `Extract grocery items from this email receipt HTML. Return ONLY valid JSON.

{
  "retailer": "store name",
  "date": "YYYY-MM-DD or null",
  "orderTotal": 0.00,
  "items": [
    {
      "name": "item name",
      "quantity": 1,
      "unit": "piece/lb/oz/bag/pack",
      "price": 0.00
    }
  ]
}

Rules:
- ONLY include food and beverage items
- Skip non-food items, delivery fees, tips, taxes
- Extract exact item names from the order
- Include price per item if shown`;

/**
 * Use Gemini to extract items from an unknown receipt format.
 */
export async function extractWithAI(
  emailHtml: string,
  retailerHint?: string,
): Promise<ParsedReceipt | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  // Truncate HTML to avoid token limits (keep first 8000 chars)
  const truncatedHtml = emailHtml.slice(0, 8000);

  const prompt = retailerHint
    ? `${EMAIL_RECEIPT_PROMPT}\n\nRetailer hint: ${retailerHint}`
    : EMAIL_RECEIPT_PROMPT;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${prompt}\n\nEmail HTML:\n${truncatedHtml}` },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
          },
        }),
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as GeminiTextResponse;
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const jsonStr = extractJson(rawText);
    if (!jsonStr) return null;

    const parsed = JSON.parse(jsonStr) as {
      retailer?: string;
      date?: string;
      orderTotal?: number;
      items?: { name: string; quantity?: number; unit?: string; price?: number }[];
    };

    const items: ReceiptEmailItem[] = (parsed.items ?? []).map((item) => ({
      name: item.name,
      quantity: item.quantity ?? 1,
      unit: item.unit ?? "piece",
      category: categorizeIngredient(item.name),
      price: item.price ?? null,
    }));

    return {
      retailer: parsed.retailer ?? retailerHint ?? "Unknown",
      date: parsed.date ?? null,
      orderTotal: parsed.orderTotal ?? null,
      items,
    };
  } catch {
    return null;
  }
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
