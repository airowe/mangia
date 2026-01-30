# Pantry: Receipt OCR (PANTRY-004)

## Overview

Allow users to photograph a grocery receipt and automatically extract purchased items into the pantry. This handles the "just got home from shopping" use case — snap a photo of the receipt, confirm the items, and the entire haul is in the pantry.

---

## Problem

| Issue | Impact |
|-------|--------|
| After a big grocery trip, adding 20-30 items is tedious | Users skip pantry updates entirely |
| AI photo scan requires items to be visible/arranged | Can't scan a full bag of groceries |
| Receipt has the exact items purchased with quantities | Rich structured data going to waste |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| OCR approach? | **Gemini 2.5 Flash-Lite** (same model as pantry scanner) | Already integrated, good at structured extraction, cheap |
| Receipt photo quality? | **Auto-enhance** — increase contrast, sharpen before sending | Receipts on thermal paper fade and have low contrast |
| What to extract? | **Item name, quantity, price** (price for future budgeting) | Maximize value from a single scan |
| Handle non-food items? | **AI filters to food only** via prompt | Cleaning supplies, bags, etc. should be excluded |
| Multiple receipts? | **One at a time** for V1 | Keep scope manageable |
| Premium? | **Yes** — AI cost per scan | Like pantry scanner, premium feature |

---

## Server Implementation

### New Endpoint: `POST /api/pantry/receipt-scan`

```typescript
// Request
{
  "imageBase64": "/9j/4AAQ...",
  "storeName": "Trader Joe's"  // optional, helps AI context
}

// Response
{
  "store": "Trader Joe's",
  "date": "2026-01-28",
  "items": [
    {
      "name": "Organic Chicken Breast",
      "quantity": 1,
      "unit": "pack",
      "category": "meat_seafood",
      "price": 8.99,
      "confidence": "high"
    }
  ],
  "subtotal": 67.42,
  "itemCount": 12
}
```

**Logic:**
1. Authenticate user + premium check
2. Validate image (max 5.5MB base64)
3. Send to Gemini 2.5 Flash-Lite with receipt-specific prompt
4. Parse response, categorize items
5. Return structured receipt data

### New File: `apps/api/lib/receipt-scanner.ts`

- `scanReceipt(imageBase64, storeName?)` — Gemini vision call with receipt prompt
- Receipt-specific prompt that extracts item names, quantities, prices
- Filters non-food items (cleaning, bags, tax lines)
- Normalizes store-specific abbreviations ("ORG CHKN BRST" → "Organic Chicken Breast")

**Receipt Prompt:**
```
You are analyzing a grocery store receipt. Extract all FOOD items purchased.
Return ONLY valid JSON.

{
  "store": "store name if visible",
  "date": "YYYY-MM-DD if visible",
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
- Expand receipt abbreviations (ORG = Organic, CHKN = Chicken, etc.)
- Set quantity from receipt (look for "x2", "2 @", etc.)
- Include price as shown on receipt
- Skip: tax, bags, discounts, coupons, non-food items
- Set confidence based on readability of that line
```

---

## Client Changes

### New Screen: `apps/mobile/screens/ReceiptScanScreen.tsx`

- Camera view optimized for document scanning (portrait, edge detection guide)
- Capture button with flash toggle
- Processing state with receipt-themed animation
- Results: list of extracted items with checkboxes
- Edit capability for each item (name, quantity, category)
- "Add Selected to Pantry" button → calls `POST /api/pantry/bulk-add`

### `apps/mobile/screens/PantryScreen.tsx`

- Add "Scan Receipt" option to the add-item menu

### `apps/mobile/navigation/PantryStack.tsx`

- Add `ReceiptScan` route

---

## Acceptance Criteria

- [ ] `POST /api/pantry/receipt-scan` extracts food items from receipt photos
- [ ] Non-food items (cleaning, bags, tax) are filtered out
- [ ] Receipt abbreviations are expanded to full names
- [ ] Items include name, quantity, unit, price, category, confidence
- [ ] Store name and date are extracted when visible
- [ ] User can review and edit extracted items before adding to pantry
- [ ] Items are added via `POST /api/pantry/bulk-add`
- [ ] Non-premium users receive 403
- [ ] `pnpm typecheck` passes in all packages
