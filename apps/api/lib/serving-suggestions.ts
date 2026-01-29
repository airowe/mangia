// lib/serving-suggestions.ts
// Serving size suggestions for recipe detail view

export function getServingSuggestions(originalServings: number): number[] {
  const suggestions = new Set<number>();

  [1, 2, 4, 6, 8].forEach((s) => suggestions.add(s));

  suggestions.add(originalServings);
  suggestions.add(originalServings * 2);
  if (originalServings >= 2) {
    suggestions.add(Math.floor(originalServings / 2));
  }

  return Array.from(suggestions)
    .filter((s) => s > 0 && s <= 24)
    .sort((a, b) => a - b)
    .slice(0, 6);
}
