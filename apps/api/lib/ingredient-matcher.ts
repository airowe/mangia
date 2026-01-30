// lib/ingredient-matcher.ts
// Fuzzy ingredient matching for pantry operations (deduction, dedup, merge)

/**
 * Normalize an ingredient name for comparison:
 * - lowercase, trim, collapse whitespace
 * - strip common qualifiers (fresh, dried, organic, etc.)
 * - strip trailing 's' for basic singular/plural handling
 */
export function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(
      /\b(fresh|dried|chopped|minced|diced|sliced|whole|large|small|medium|optional|organic|boneless|skinless|raw|cooked|frozen|canned|ground|extra|virgin|low fat|nonfat|fat free|unsalted|salted)\b/g,
      "",
    )
    .replace(/\s+/g, " ")
    .trim()
    .replace(/s$/, ""); // basic singularize
}

/**
 * Check if two ingredient names match (fuzzy).
 * Uses normalized comparison first, then checks if one is a substring of the other.
 */
export function ingredientsMatch(a: string, b: string): boolean {
  const normA = normalizeItemName(a);
  const normB = normalizeItemName(b);

  if (normA === normB) return true;

  // Substring match for cases like "chicken" matching "chicken breast"
  if (normA.includes(normB) || normB.includes(normA)) {
    // Only match if the shorter string is at least 4 chars (avoid "oil" matching "foil")
    const shorter = normA.length < normB.length ? normA : normB;
    if (shorter.length >= 4) return true;
  }

  return false;
}

/**
 * Find the best matching pantry item name from a list.
 * Returns the matched name or null if no match found.
 */
export function findBestMatch(
  target: string,
  candidates: string[],
): string | null {
  const normTarget = normalizeItemName(target);

  // Exact normalized match first
  for (const candidate of candidates) {
    if (normalizeItemName(candidate) === normTarget) {
      return candidate;
    }
  }

  // Substring match
  for (const candidate of candidates) {
    if (ingredientsMatch(target, candidate)) {
      return candidate;
    }
  }

  return null;
}
