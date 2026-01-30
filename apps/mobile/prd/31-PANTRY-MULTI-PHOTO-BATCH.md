# Pantry: Multi-Photo Batch Scan (PANTRY-006)

## Overview

Extend the existing AI pantry scanner to accept multiple photos in a single session. Instead of one photo of the pantry, users can take photos of the fridge, freezer, pantry shelf, and spice rack — all in one batch. Items from all photos are deduplicated and presented as a single combined list.

---

## Problem

| Issue | Impact |
|-------|--------|
| Current scanner takes one photo at a time | Users need 3-5 photos to capture full kitchen inventory |
| Multiple single scans create duplicates | Same item photographed from different angles gets added twice |
| Starting a new scan loses context from the previous one | No way to build a complete picture incrementally |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Max photos per batch? | **5** | Covers fridge, freezer, pantry, counter, spice rack |
| Process all at once or incrementally? | **Incrementally** — process each photo as taken, merge results | Shows progress, doesn't make user wait for all 5 |
| Deduplication? | **Server-side** — fuzzy name matching across photo results | AI may name same item slightly differently across photos |
| UI? | **Photo strip** at top, growing item list below | Visual progress, easy to retake individual photos |
| Premium? | **Yes** — multiple AI calls per session | Extension of existing premium scanner |

---

## Server Implementation

### New Endpoint: `POST /api/pantry/scan-batch`

```typescript
// Request
{
  "images": [
    { "imageBase64": "/9j/...", "label": "fridge" },
    { "imageBase64": "/9j/...", "label": "pantry shelf" }
  ]
}

// Response
{
  "photoResults": [
    { "label": "fridge", "itemCount": 12, "status": "success" },
    { "label": "pantry shelf", "itemCount": 8, "status": "success" }
  ],
  "items": [
    {
      "name": "Milk",
      "quantity": 1,
      "unit": "gallon",
      "category": "dairy_eggs",
      "confidence": "high",
      "expiryDate": null,
      "sources": ["fridge"]
    }
  ],
  "totalBeforeDedup": 20,
  "totalAfterDedup": 17,
  "duplicatesRemoved": 3
}
```

**Logic:**
1. Authenticate user + premium check
2. Validate images array (max 5, each max 5.5MB)
3. Process all images in parallel with `Promise.allSettled` using existing `scanPantryImage()`
4. Merge all item arrays
5. Deduplicate: normalize names, merge quantities for matches
6. Track which photo(s) each item came from
7. Return combined list

### New File: `apps/api/lib/item-deduplicator.ts`

- `deduplicateItems(items: ScannedPantryItem[])` — merges items with similar names
- Name normalization: lowercase, trim, singularize, strip brand names
- When duplicates found: keep highest confidence, sum quantities
- Returns dedup stats (before/after counts)

---

## Client Changes

### New Screen: `apps/mobile/screens/BatchScanScreen.tsx`

- Camera view with photo counter ("Photo 2 of 5")
- Photo strip showing thumbnails of taken photos
- Each photo gets a label (auto-suggested: "Fridge", "Freezer", "Pantry", "Spice Rack", "Counter")
- Item list grows incrementally as each photo is processed
- Dedup indicator: "3 duplicates merged"
- "Done Scanning" → confirm items → `POST /api/pantry/bulk-add`

### `apps/mobile/screens/PantryScreen.tsx`

- Replace current "AI Scanner" option with "Scan Kitchen" (launches batch mode)
- Keep single-photo mode as "Quick Scan" sub-option

### `apps/mobile/navigation/PantryStack.tsx`

- Add `BatchScan` route

---

## Acceptance Criteria

- [ ] `POST /api/pantry/scan-batch` processes up to 5 images in parallel
- [ ] Items from all photos are merged and deduplicated
- [ ] Dedup stats returned (total before/after, duplicates removed)
- [ ] Each item tracks which photo(s) it came from
- [ ] Camera UI supports multi-photo session with photo strip
- [ ] Items appear incrementally as each photo is processed
- [ ] Individual photos can be retaken without losing other results
- [ ] Non-premium users receive 403
- [ ] `pnpm typecheck` passes in all packages
