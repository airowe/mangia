# Pantry: Barcode Scanner (PANTRY-003)

## Overview

Add a barcode scanner to the pantry input options. User points camera at a product barcode (UPC/EAN), the app identifies the product from a food database, and adds it to the pantry with a single tap. This is the fastest way to add individual items — scan, confirm, done.

---

## Problem

| Issue | Impact |
|-------|--------|
| Adding individual items requires typing name, quantity, unit, category | Too slow for restocking 20+ items after a grocery trip |
| AI photo scan works for shelf views but is overkill for single items | Wastes API credits, slower than barcode lookup |
| No way to get exact product data (brand, size, nutrition) | Generic names like "pasta" are less useful than "Barilla Penne 16oz" |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Barcode database? | **Open Food Facts** (open-source, free API) | No API key needed, 3M+ products, community-maintained |
| Fallback if not found? | **Manual entry** pre-filled with barcode for future lookup | Don't block the user; collect data for improvement |
| Camera library? | **expo-camera** (already installed) + `expo-barcode-scanner` | Already in the project, well-supported |
| Scan mode? | **Continuous** — auto-scan as barcodes enter frame | Faster than tap-to-scan for multiple items |
| Quantity? | **Default 1**, tap to adjust | Most items are bought one at a time |
| Premium? | **Free tier: 5 scans/day, Premium: unlimited** | Low cost (no AI), good conversion driver |

---

## Server Implementation

### New Endpoint: `POST /api/pantry/barcode-lookup`

```typescript
// Request
{ "barcode": "0041196910735" }

// Response (found)
{
  "found": true,
  "product": {
    "name": "Barilla Penne Rigate",
    "brand": "Barilla",
    "quantity": 16,
    "unit": "oz",
    "category": "pantry",
    "imageUrl": "https://images.openfoodfacts.org/...",
    "barcode": "0041196910735"
  }
}

// Response (not found)
{
  "found": false,
  "barcode": "0041196910735"
}
```

**Logic:**
1. Authenticate user
2. Check local cache (database table `barcode_products`) first
3. If not cached, query Open Food Facts API: `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
4. Parse response: extract product name, brand, quantity, unit
5. Auto-categorize with `categorizeIngredient()`
6. Cache result in `barcode_products` table
7. Return product data

### New Database Table: `barcode_products`

```sql
CREATE TABLE barcode_products (
  barcode TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  quantity REAL,
  unit TEXT,
  category ingredient_category DEFAULT 'other',
  image_url TEXT,
  source TEXT DEFAULT 'openfoodfacts',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### New File: `apps/api/lib/barcode-lookup.ts`

- `lookupBarcode(barcode: string)` — checks cache, then Open Food Facts
- `parseOpenFoodFacts(data)` — extracts structured product info from OFF response
- Handles missing/incomplete data gracefully

---

## Client Changes

### New Screen: `apps/mobile/screens/BarcodeScannerScreen.tsx`

- Camera view with barcode overlay guide
- Continuous scanning mode
- On barcode detected:
  1. Haptic feedback
  2. Call `POST /api/pantry/barcode-lookup`
  3. If found: show product card overlay with "Add to Pantry" button
  4. If not found: show "Product not found" with manual entry option
- Recent scans list at bottom
- Quantity adjustment (+/- buttons)

### `apps/mobile/screens/PantryScreen.tsx`

- Add "Scan Barcode" option to the add-item menu (alongside AI Scanner and Manual)

### `apps/mobile/navigation/PantryStack.tsx`

- Add `BarcodeScanner` route

---

## Acceptance Criteria

- [ ] `POST /api/pantry/barcode-lookup` returns product data from Open Food Facts
- [ ] Barcode results are cached in `barcode_products` table
- [ ] Camera detects UPC and EAN barcodes in real-time
- [ ] Found products show name, brand, quantity, category with "Add to Pantry" button
- [ ] Not-found barcodes offer manual entry fallback
- [ ] Items added from barcode scan include full product details
- [ ] Free tier limited to 5 scans/day, premium unlimited
- [ ] `pnpm typecheck` passes in all packages
