# Pantry: Voice Input (PANTRY-005)

## Overview

Add a voice input mode for pantry items. User taps the mic button and speaks naturally: "I just bought two pounds of chicken breast, a bag of rice, and a dozen eggs." The app parses the natural language into structured pantry items.

---

## Problem

| Issue | Impact |
|-------|--------|
| Adding items requires typing on a small phone keyboard | Slow and awkward, especially with hands full of groceries |
| Camera-based scanning requires items to be visible | Can't scan items already in bags or put away |
| Manual entry is the only hands-free-hostile input method | Users in the kitchen can't easily update pantry |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Speech-to-text engine? | **expo-speech-recognition** (on-device) | Fast, free, no API cost, works offline |
| NLP for parsing? | **Gemini 2.5 Flash-Lite** on server | Structured extraction from natural language is LLM's sweet spot |
| Continuous or push-to-talk? | **Push-to-talk** with auto-stop on silence | Clear start/end, avoids false activations |
| Multi-item in one utterance? | **Yes** — "chicken, rice, and eggs" → 3 items | Natural speech often lists multiple items |
| Premium? | **Yes** — AI parsing cost | Free tier gets manual entry; voice is premium convenience |

---

## Server Implementation

### New Endpoint: `POST /api/pantry/voice-parse`

```typescript
// Request
{
  "transcript": "I just bought two pounds of chicken breast, a bag of rice, and a dozen eggs"
}

// Response
{
  "items": [
    {
      "name": "Chicken Breast",
      "quantity": 2,
      "unit": "lb",
      "category": "meat_seafood",
      "confidence": "high"
    },
    {
      "name": "Rice",
      "quantity": 1,
      "unit": "bag",
      "category": "pantry",
      "confidence": "high"
    },
    {
      "name": "Eggs",
      "quantity": 12,
      "unit": "piece",
      "category": "dairy_eggs",
      "confidence": "high"
    }
  ]
}
```

**Logic:**
1. Authenticate user + premium check
2. Validate transcript (max 2000 chars)
3. Send to Gemini 2.5 Flash-Lite with voice-parsing prompt
4. Parse and categorize items
5. Return structured items

### New File: `apps/api/lib/voice-parser.ts`

- `parseVoiceInput(transcript: string)` — sends transcript to Gemini with extraction prompt
- Handles colloquial quantities ("a couple" = 2, "a few" = 3, "a dozen" = 12)
- Handles compound items ("chicken breast" not just "chicken")

**Voice Prompt:**
```
Parse this grocery/pantry item description into structured items. Return ONLY valid JSON.

{
  "items": [
    {
      "name": "item name",
      "quantity": 1,
      "unit": "lb/oz/bag/box/can/bottle/bunch/piece",
      "confidence": "high/medium/low"
    }
  ]
}

Rules:
- Extract every distinct food item mentioned
- Convert colloquial quantities: "a couple" = 2, "a few" = 3, "a dozen" = 12, "some" = 1
- Use standard grocery units
- Expand abbreviated names (e.g., "OJ" → "Orange Juice")
- If quantity is ambiguous, default to 1
- confidence: "high" if clearly stated, "medium" if inferred, "low" if very ambiguous
```

---

## Client Changes

### New Component: `apps/mobile/components/pantry/VoiceInputButton.tsx`

- Floating mic button on PantryScreen
- Push-to-talk with visual feedback (pulsing ring animation)
- Uses `expo-speech-recognition` for on-device transcription
- Shows real-time transcript as user speaks
- On completion, sends transcript to `POST /api/pantry/voice-parse`
- Shows parsed items for confirmation → `POST /api/pantry/bulk-add`

### `apps/mobile/screens/PantryScreen.tsx`

- Add VoiceInputButton to the screen
- Add "Voice Input" option to add-item menu

---

## Acceptance Criteria

- [ ] `POST /api/pantry/voice-parse` extracts structured items from natural language
- [ ] Handles multiple items in a single utterance
- [ ] Colloquial quantities parsed correctly (dozen, couple, few)
- [ ] Push-to-talk with visual feedback and auto-stop on silence
- [ ] Real-time transcript displayed during recording
- [ ] Parsed items shown for confirmation before adding to pantry
- [ ] Non-premium users receive 403
- [ ] `pnpm typecheck` passes in all packages
