// lib/intent-parser.ts
// Parse natural language voice intents for smart home integrations

export type IntentType = "add_to_grocery" | "add_to_pantry" | "stock_check" | "check_alerts";

export interface ParsedIntent {
  intent: IntentType;
  items: string[];
}

const OUT_OF_PATTERNS = [
  /(?:i'?m|we'?re|we are) (?:out of|running low on|almost out of) (.+)/i,
  /(?:we )?need (?:more |some )?(.+)/i,
  /(?:add|put) (.+) (?:to|on) (?:the |my )?(?:grocery|shopping) list/i,
  /(?:ran out of|no more) (.+)/i,
];

const BOUGHT_PATTERNS = [
  /(?:i|we) (?:just )?(?:bought|picked up|got|purchased) (.+)/i,
  /(?:i|we) (?:have|got) (.+)/i,
  /(?:add|put) (.+) (?:to|in) (?:the |my )?pantry/i,
];

const CHECK_PATTERNS = [
  /(?:do (?:i|we) have|how much) (.+?)(?:\?|$)/i,
  /(?:check|what's the) (?:stock|status) (?:of|on|for) (.+?)(?:\?|$)/i,
];

const ALERT_PATTERNS = [
  /what'?s expiring/i,
  /(?:kitchen |expiry )?alerts/i,
  /anything expiring/i,
  /what do i need to use/i,
];

/**
 * Parse a natural language input into a structured intent.
 * Used by smart home integrations (Siri, Alexa) and the quick-add endpoint.
 */
export function parseIntent(input: string): ParsedIntent {
  const trimmed = input.trim();

  // Check alerts first (no items needed)
  for (const pattern of ALERT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { intent: "check_alerts", items: [] };
    }
  }

  // Check stock
  for (const pattern of CHECK_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return { intent: "stock_check", items: extractItemNames(match[1]) };
    }
  }

  // "Out of" / need → grocery list
  for (const pattern of OUT_OF_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return { intent: "add_to_grocery", items: extractItemNames(match[1]) };
    }
  }

  // "Bought" / have → pantry
  for (const pattern of BOUGHT_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return { intent: "add_to_pantry", items: extractItemNames(match[1]) };
    }
  }

  // Default: treat as pantry add (most common voice intent)
  return { intent: "add_to_pantry", items: extractItemNames(trimmed) };
}

/**
 * Split a comma/and-separated string into individual item names.
 * "chicken, rice, and eggs" → ["chicken", "rice", "eggs"]
 */
function extractItemNames(text: string): string[] {
  return text
    .split(/(?:,\s*(?:and\s+)?|\s+and\s+)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 100);
}
