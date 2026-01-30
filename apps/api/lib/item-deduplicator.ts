// lib/item-deduplicator.ts
// Deduplication of scanned pantry items across multiple photos

import { normalizeItemName, ingredientsMatch } from "./ingredient-matcher";

interface DeduplicatableItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  confidence: number | string;
  expiryDate?: string | null;
}

export interface DeduplicatedItem extends DeduplicatableItem {
  sources: string[];
}

export interface DeduplicationResult {
  items: DeduplicatedItem[];
  totalBeforeDedup: number;
  totalAfterDedup: number;
  duplicatesRemoved: number;
}

/**
 * Deduplicate items across multiple sources (photos, scans).
 * When duplicates are found:
 * - Keep the name from the highest-confidence entry
 * - Sum quantities
 * - Merge source labels
 */
export function deduplicateItems(
  itemsBySource: { label: string; items: DeduplicatableItem[] }[],
): DeduplicationResult {
  const totalBefore = itemsBySource.reduce((sum, s) => sum + s.items.length, 0);
  const merged = new Map<string, DeduplicatedItem>();

  for (const source of itemsBySource) {
    for (const item of source.items) {
      const normName = normalizeItemName(item.name);

      // Find existing match
      let matchKey: string | null = null;
      for (const [key] of merged) {
        if (key === normName || ingredientsMatch(item.name, merged.get(key)!.name)) {
          matchKey = key;
          break;
        }
      }

      if (matchKey) {
        const existing = merged.get(matchKey)!;
        // Sum quantities
        existing.quantity += item.quantity;
        // Keep higher confidence name
        const existingConf = confidenceToNumber(existing.confidence);
        const newConf = confidenceToNumber(item.confidence);
        if (newConf > existingConf) {
          existing.name = item.name;
          existing.confidence = item.confidence;
        }
        // Merge sources
        if (!existing.sources.includes(source.label)) {
          existing.sources.push(source.label);
        }
      } else {
        merged.set(normName, {
          ...item,
          sources: [source.label],
        });
      }
    }
  }

  const items = Array.from(merged.values());
  return {
    items,
    totalBeforeDedup: totalBefore,
    totalAfterDedup: items.length,
    duplicatesRemoved: totalBefore - items.length,
  };
}

function confidenceToNumber(confidence: number | string): number {
  if (typeof confidence === "number") return confidence;
  switch (confidence) {
    case "high": return 0.9;
    case "medium": return 0.7;
    case "low": return 0.5;
    default: return 0.5;
  }
}
