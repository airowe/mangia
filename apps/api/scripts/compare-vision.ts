// scripts/compare-vision.ts
// CLI: npx tsx scripts/compare-vision.ts <image-path>
// Compares pantry scanning results across vision models

import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync, statSync } from "fs";
import { runComparison } from "../lib/vision-compare";
import type { ModelResult } from "../lib/vision-compare/types";

// Load .env.local from the api directory (process.cwd() since tsx sets __dirname to ".")
config({ path: resolve(process.cwd(), ".env.local") });

function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

function formatLatency(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function confidenceColor(confidence: string): string {
  switch (confidence) {
    case "high":
      return "\x1b[32m"; // green
    case "medium":
      return "\x1b[33m"; // yellow
    case "low":
      return "\x1b[31m"; // red
    default:
      return "\x1b[0m";
  }
}

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function printSummaryTable(results: ModelResult[]): void {
  console.log(`\n${BOLD}═══ Summary ═══${RESET}\n`);

  const header = [
    "Model".padEnd(22),
    "Items".padStart(6),
    "Latency".padStart(10),
    "Est. Cost".padStart(10),
    "Status".padStart(10),
  ].join(" │ ");

  const separator = "─".repeat(header.length);

  console.log(header);
  console.log(separator);

  for (const r of results) {
    const status = r.error
      ? `\x1b[31mFAILED${RESET}`
      : `\x1b[32mOK${RESET}    `;
    const row = [
      r.model.padEnd(22),
      String(r.items.length).padStart(6),
      formatLatency(r.latencyMs).padStart(10),
      formatCost(r.estimatedCost).padStart(10),
      status.padStart(10 + 9), // +9 for ANSI escape codes
    ].join(" │ ");
    console.log(row);
  }

  console.log(separator);
}

function printItemComparison(results: ModelResult[]): void {
  console.log(`\n${BOLD}═══ Items by Model ═══${RESET}\n`);

  for (const r of results) {
    if (r.error) {
      console.log(`${BOLD}${r.model}${RESET}: ${DIM}(error: ${r.error})${RESET}\n`);
      continue;
    }

    console.log(`${BOLD}${r.model}${RESET} (${r.items.length} items):`);

    const highCount = r.items.filter((i) => i.confidence === "high").length;
    const medCount = r.items.filter((i) => i.confidence === "medium").length;
    const lowCount = r.items.filter((i) => i.confidence === "low").length;

    console.log(
      `  Confidence: \x1b[32m${highCount} high${RESET}, \x1b[33m${medCount} medium${RESET}, \x1b[31m${lowCount} low${RESET}`,
    );
    console.log();

    for (const item of r.items) {
      const color = confidenceColor(item.confidence);
      const expiry = item.expiryDate ? ` (exp: ${item.expiryDate})` : "";
      console.log(
        `  ${color}●${RESET} ${item.name} — ${item.quantity} ${item.unit}${DIM}${expiry}${RESET} ${color}[${item.confidence}]${RESET}`,
      );
    }
    console.log();
  }
}

function printItemOverlap(results: ModelResult[]): void {
  const successResults = results.filter((r) => !r.error);
  if (successResults.length < 2) return;

  console.log(`${BOLD}═══ Item Overlap ═══${RESET}\n`);

  // Normalize item names for comparison
  const itemSets = successResults.map((r) => ({
    model: r.model,
    names: new Set(r.items.map((i) => i.name.toLowerCase().trim())),
  }));

  // Find items present in all models
  const allNames = new Set<string>();
  for (const s of itemSets) {
    for (const name of s.names) allNames.add(name);
  }

  const inAll: string[] = [];
  const inSome: { name: string; models: string[] }[] = [];

  for (const name of allNames) {
    const presentIn = itemSets
      .filter((s) => s.names.has(name))
      .map((s) => s.model);
    if (presentIn.length === successResults.length) {
      inAll.push(name);
    } else {
      inSome.push({ name, models: presentIn });
    }
  }

  console.log(
    `  All models agree on: ${BOLD}${inAll.length}${RESET} items`,
  );
  if (inAll.length > 0) {
    console.log(`  ${DIM}${inAll.join(", ")}${RESET}`);
  }

  if (inSome.length > 0) {
    console.log(`\n  Disagreements (${inSome.length} items):`);
    for (const { name, models } of inSome) {
      console.log(`  ${DIM}●${RESET} "${name}" — found by: ${models.join(", ")}`);
    }
  }
  console.log();
}

async function main(): Promise<void> {
  const imagePath = process.argv[2];

  if (!imagePath) {
    console.error("Usage: npx tsx scripts/compare-vision.ts <image-path>");
    console.error("\nExample: npx tsx scripts/compare-vision.ts ~/pantry-photo.jpg");
    process.exit(1);
  }

  const fullPath = resolve(imagePath);

  // Validate file exists and get size
  let fileStat;
  try {
    fileStat = statSync(fullPath);
  } catch {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`${BOLD}Vision Model Comparison Harness${RESET}`);
  console.log(`Image: ${fullPath} (${(fileStat.size / 1024).toFixed(0)} KB)`);
  console.log(`Models: gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.5-pro, claude-sonnet`);
  console.log(`Running comparison...\n`);

  const imageBuffer = readFileSync(fullPath);
  const imageBase64 = imageBuffer.toString("base64");

  const result = await runComparison(imageBase64);

  printSummaryTable(result.results);
  printItemComparison(result.results);
  printItemOverlap(result.results);

  // Total cost
  const totalCost = result.results.reduce((sum, r) => sum + r.estimatedCost, 0);
  console.log(`${DIM}Total estimated cost: ${formatCost(totalCost)}${RESET}`);
  console.log(
    `${DIM}Image size: ${(result.image.sizeBytes / 1024).toFixed(0)} KB (raw bytes)${RESET}`,
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
