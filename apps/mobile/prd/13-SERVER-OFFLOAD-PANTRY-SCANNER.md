# Server Offload: AI Pantry Scanner (API-010)

## Overview

Implement the AI pantry scanner as a server-side endpoint `POST /api/pantry/scan`. The mobile app captures a photo with the device camera, sends it as base64 to the server, and the server uses a vision AI model to identify food items and optionally extract expiry dates via OCR. Returns a structured list of detected items for user confirmation.

The mobile `AIPantryScannerScreen` currently contains placeholder/mock code with hardcoded detected items. This PRD replaces the mock with a real implementation.

---

## Problem

| Issue | Impact |
|-------|--------|
| Scanner screen is a placeholder with hardcoded items | Feature is non-functional |
| Vision AI requires API keys that shouldn't be on-device | Security risk if embedded in app bundle |
| Image processing is compute-intensive | Poor UX on low-end devices |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Which vision AI? | **Gemini 2.0 Flash** (primary), future option for Claude vision | Gemini Flash is fast and cheap; already have API key from recipe import |
| Image format? | **Base64 JPEG** | Universal, no file upload infrastructure needed |
| Max image size? | **4MB** (enforced client-side via compression) | Gemini limit; keeps payloads reasonable |
| OCR for expiry dates? | **Optional, same AI call** | Include "extract expiry dates if visible" in the prompt |
| Premium-gated? | **Yes** | AI costs per scan; free tier gets manual pantry entry |

---

## Endpoint

### `POST /api/pantry/scan`

**Request:**
```json
{
  "imageBase64": "/9j/4AAQ...",
  "extractExpiry": true
}
```

**Response:**
```json
{
  "items": [
    {
      "name": "San Marzano Tomatoes",
      "category": "canned",
      "confidence": 0.94,
      "quantity": 2,
      "unit": "can",
      "expiryDate": "2025-10-12"
    },
    {
      "name": "Arborio Rice",
      "category": "pantry",
      "confidence": 0.87,
      "quantity": 1,
      "unit": "bag",
      "expiryDate": null
    }
  ]
}
```

---

## Server Implementation

### New Files

```
apps/api/
├── api/pantry/scan.ts          # POST /api/pantry/scan endpoint
└── lib/pantry-scanner.ts       # Vision AI integration
```

### `lib/pantry-scanner.ts`

- `scanPantryImage(imageBase64, extractExpiry)` — sends image to Gemini Vision with structured prompt
- Uses `categorizeIngredient()` from `lib/categorize-ingredient.ts` (from API-009) to assign store categories
- Prompt instructs the AI to return JSON with item names, estimated quantities, units, and optional expiry dates
- `AbortSignal.timeout(10000)` — vision processing can take longer than text extraction

**AI Prompt:**
```
Identify all food items visible in this image. Return ONLY valid JSON.

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
- If unsure about an item, still include it with your best guess
```

### `api/pantry/scan.ts`

1. Authenticate user (Clerk)
2. Check premium status (require premium)
3. Validate body with Zod:
   - `imageBase64`: `z.string().max(5_500_000)` (~4MB base64)
   - `extractExpiry`: `z.boolean().default(true)`
4. Call `scanPantryImage()`
5. Categorize each detected item
6. Return items with categories and confidence scores

**Does NOT auto-add to pantry** — the client shows the `ConfirmScannedItemsScreen` for user review first.

---

## Client Changes

### Modified Files

- `apps/mobile/screens/AIPantryScannerScreen.tsx` — Replace mock detection with:
  1. Capture photo from camera (already using `expo-camera`)
  2. Compress to JPEG, convert to base64
  3. Call `POST /api/pantry/scan`
  4. Display detected items for confirmation
  5. Navigate to `ConfirmScannedItemsScreen` with detected items

- `apps/mobile/screens/ConfirmScannedItemsScreen.tsx` — Already handles item confirmation. May need minor updates to accept the new response shape (confidence scores, expiry dates).

### New Dependencies

None — `expo-camera` and `expo-image-manipulator` (for compression) are already in the project.

---

## Vercel Configuration

Add extended timeout for image processing:
```json
"functions": {
  "api/pantry/scan.ts": { "maxDuration": 30 }
}
```

---

## Environment Variables

Uses existing `GEMINI_API_KEY` (already configured for recipe import).

---

## Acceptance Criteria

- [ ] `POST /api/pantry/scan` accepts base64 image and returns detected food items
- [ ] Each item includes name, estimated quantity, unit, category, and confidence score
- [ ] Expiry dates are extracted when visible and `extractExpiry` is true
- [ ] Non-premium users receive 403 with upgrade prompt
- [ ] Image size > 4MB is rejected with 400
- [ ] `AIPantryScannerScreen` captures and sends real photos (no mock data)
- [ ] `ConfirmScannedItemsScreen` displays detected items for user review
- [ ] `pnpm typecheck` passes in both `apps/api` and `apps/mobile`
- [ ] Endpoint responds within 10 seconds for typical pantry/fridge photos
