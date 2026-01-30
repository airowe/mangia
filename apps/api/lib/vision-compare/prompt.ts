// lib/vision-compare/prompt.ts
// Shared prompt for vision model comparison with per-item confidence

export const COMPARISON_PROMPT = `Identify all food items visible in this image. Return ONLY valid JSON with no markdown formatting.

{
  "items": [
    {
      "name": "item name",
      "quantity": 1,
      "unit": "can/bag/box/bottle/lb/oz/bunch/piece",
      "confidence": "high/medium/low",
      "expiryDate": "YYYY-MM-DD or null"
    }
  ]
}

Rules:
- List every distinct food item you can see
- Estimate quantity based on what's visible
- Use common grocery units
- Set confidence to "high" if you can clearly identify the item and read its label
- Set confidence to "medium" if you can identify the item but not read labels clearly
- Set confidence to "low" if you're guessing based on shape/color
- Only include expiryDate if you can clearly read a date on packaging
- Do NOT include non-food items (cleaning products, containers, etc.)
- Include brand name when visible (e.g., "Barilla Penne" not just "pasta")`;
