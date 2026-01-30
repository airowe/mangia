# Pantry: Email Receipt Parsing (PANTRY-007)

## Overview

Connect to the user's email to find and parse digital grocery receipts from major retailers (Instacart, Amazon Fresh, Walmart, Target, Whole Foods, Kroger). When a grocery order is detected, extract the items and offer to add them to the pantry — zero manual input required.

---

## Problem

| Issue | Impact |
|-------|--------|
| Online grocery orders leave a digital paper trail that's never used | Perfect structured data sitting unused in email |
| Users forget to update pantry after delivery arrives | Pantry goes stale within days |
| Instacart/Amazon/Walmart receipts have exact item data | More accurate than any AI scan or manual entry |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Email access method? | **Gmail API (OAuth)** for V1, expand to IMAP later | 65%+ smartphone users have Gmail; OAuth is secure |
| Which retailers? | **Instacart, Amazon Fresh, Walmart Grocery, Whole Foods** | Biggest US online grocery services |
| Scanning frequency? | **On-demand** — user taps "Check for Receipts" | Privacy-first; no background email scanning |
| Parsing approach? | **HTML parsing** per retailer template + AI fallback | Retailer emails are templated; faster and cheaper than AI for known formats |
| Data retention? | **Extract items only, don't store email content** | Minimize privacy surface |
| Premium? | **Yes** — premium convenience feature | High value, differentiator |

---

## Server Implementation

### New Endpoint: `POST /api/pantry/email-receipts/scan`

```typescript
// Request
{
  "provider": "gmail",
  "accessToken": "ya29.a0...",
  "lookbackDays": 7
}

// Response
{
  "receipts": [
    {
      "retailer": "Instacart",
      "date": "2026-01-27",
      "orderTotal": 87.42,
      "items": [
        {
          "name": "Organic Bananas",
          "quantity": 1,
          "unit": "bunch",
          "category": "produce",
          "price": 1.99
        }
      ]
    }
  ],
  "totalItems": 23,
  "receiptCount": 2
}
```

**Logic:**
1. Authenticate user + premium check
2. Use Gmail API with user's access token to search for recent grocery emails
3. Search query: `from:(instacart OR amazonfresh OR walmart OR wholefoodsmarket) subject:(order OR receipt OR delivery) newer_than:7d`
4. For each matching email, parse with retailer-specific parser
5. If no parser matches, try AI extraction as fallback
6. Categorize items, deduplicate across receipts
7. Return structured receipt data

### New Files

```
apps/api/lib/email-receipt/
├── index.ts              # Orchestrator: findAndParseReceipts()
├── gmail.ts              # Gmail API search + fetch
├── parsers/
│   ├── instacart.ts      # Instacart HTML template parser
│   ├── amazon-fresh.ts   # Amazon Fresh template parser
│   ├── walmart.ts        # Walmart Grocery template parser
│   └── whole-foods.ts    # Whole Foods template parser
└── ai-fallback.ts        # Gemini-based extraction for unknown formats
```

### New Endpoint: `GET /api/pantry/email-receipts/auth-url`

Returns the Gmail OAuth URL for the client to initiate consent flow.

---

## Client Changes

### New Screen: `apps/mobile/screens/EmailReceiptScreen.tsx`

- Connect Gmail button (OAuth flow via `expo-auth-session`)
- "Check for Receipts" button
- List of found receipts with retailer logo, date, item count
- Tap receipt → expand item list with checkboxes
- "Add Selected to Pantry" → `POST /api/pantry/bulk-add`

### `apps/mobile/screens/PantryScreen.tsx`

- Add "Import from Email" option to add-item menu

### `apps/mobile/navigation/PantryStack.tsx`

- Add `EmailReceipt` route

---

## Privacy Considerations

- Email access token is passed per-request, never stored on server
- Only emails matching grocery retailer patterns are fetched
- Email content is parsed in memory, not persisted
- User can disconnect at any time (revoke OAuth)
- Clear privacy disclosure in UI before connecting

---

## Acceptance Criteria

- [ ] Gmail OAuth flow works via `expo-auth-session`
- [ ] `POST /api/pantry/email-receipts/scan` finds and parses grocery receipts
- [ ] Instacart, Amazon Fresh, Walmart, and Whole Foods parsers extract items
- [ ] AI fallback handles unknown retailer formats
- [ ] Items include name, quantity, unit, category, price
- [ ] User can review and select items before adding to pantry
- [ ] Email content is not stored on server
- [ ] Non-premium users receive 403
- [ ] `pnpm typecheck` passes in all packages
