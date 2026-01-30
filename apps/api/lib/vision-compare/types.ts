// lib/vision-compare/types.ts
// Shared types for vision model comparison harness

export interface ScannedItem {
  name: string;
  quantity: number;
  unit: string;
  confidence: "high" | "medium" | "low";
  expiryDate: string | null;
}

export interface ModelResult {
  model: string;
  items: ScannedItem[];
  latencyMs: number;
  estimatedCost: number;
  rawResponse: string;
  error: string | null;
}

export interface ComparisonResult {
  results: ModelResult[];
  image: { sizeBytes: number };
}
