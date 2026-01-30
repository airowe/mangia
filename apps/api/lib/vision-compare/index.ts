// lib/vision-compare/index.ts
// Orchestrator: runs multiple vision models in parallel and collects results

import type { ModelResult, ComparisonResult, ScannedItem } from "./types";
import { callGemini } from "./providers/gemini";
import { callOpenAI } from "./providers/openai";

// Cost per 1M input tokens (USD)
const COST_PER_MILLION_INPUT: Record<string, number> = {
  "gemini-2.0-flash": 0.08,
  "gemini-2.5-flash": 0.15,
  "gpt-4o": 2.5,
};

// Approximate image tokens (varies by resolution, these are rough estimates)
const ESTIMATED_IMAGE_TOKENS: Record<string, number> = {
  "gemini-2.0-flash": 1000,
  "gemini-2.5-flash": 1000,
  "gpt-4o": 1100, // GPT-4o high-detail image ~1100 tokens
};

const ALL_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gpt-4o"] as const;

type ModelId = (typeof ALL_MODELS)[number];

interface ComparisonOptions {
  models?: string[];
}

async function callModel(
  imageBase64: string,
  modelId: ModelId,
): Promise<{ items: ScannedItem[]; rawResponse: string }> {
  switch (modelId) {
    case "gemini-2.0-flash":
    case "gemini-2.5-flash":
      return callGemini(imageBase64, modelId);
    case "gpt-4o":
      return callOpenAI(imageBase64);
    default:
      throw new Error(`Unknown model: ${modelId}`);
  }
}

function estimateCost(modelId: string): number {
  const costPerMillion = COST_PER_MILLION_INPUT[modelId] ?? 0;
  const imageTokens = ESTIMATED_IMAGE_TOKENS[modelId] ?? 1000;
  // Estimate ~500 prompt text tokens + image tokens + ~500 output tokens
  const totalTokens = 500 + imageTokens + 500;
  return (totalTokens / 1_000_000) * costPerMillion;
}

/**
 * Run vision comparison across multiple models in parallel.
 * Each model failure is isolated — one failure won't block others.
 */
export async function runComparison(
  imageBase64: string,
  options?: ComparisonOptions,
): Promise<ComparisonResult> {
  const selectedModels = (options?.models ?? [...ALL_MODELS]) as ModelId[];

  const promises = selectedModels.map(async (modelId): Promise<ModelResult> => {
    const start = performance.now();
    try {
      const { items, rawResponse } = await callModel(imageBase64, modelId);
      const latencyMs = Math.round(performance.now() - start);
      return {
        model: modelId,
        items,
        latencyMs,
        estimatedCost: estimateCost(modelId),
        rawResponse,
        error: null,
      };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        model: modelId,
        items: [],
        latencyMs,
        estimatedCost: estimateCost(modelId),
        rawResponse: "",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  const results = await Promise.allSettled(promises);

  const modelResults: ModelResult[] = results.map((result, i) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    // This shouldn't happen since we catch inside, but handle it anyway
    return {
      model: selectedModels[i],
      items: [],
      latencyMs: 0,
      estimatedCost: estimateCost(selectedModels[i]),
      rawResponse: "",
      error: result.reason instanceof Error
        ? result.reason.message
        : String(result.reason),
    };
  });

  return {
    results: modelResults,
    image: {
      sizeBytes: Math.ceil(imageBase64.length * 0.75), // base64 → raw bytes
    },
  };
}

export type { ModelResult, ComparisonResult, ScannedItem } from "./types";
