#!/usr/bin/env npx ts-node
/**
 * Bulk Import Test Script
 *
 * Tests recipe import from multiple sources:
 * - Eitan Bernath's blog recipes
 * - TikTok videos (requires RAPIDAPI_KEY)
 *
 * Usage:
 *   npx ts-node scripts/bulk-import-test.ts [--blog] [--tiktok] [--limit N]
 *
 * Examples:
 *   npx ts-node scripts/bulk-import-test.ts --blog --limit 3
 *   npx ts-node scripts/bulk-import-test.ts --tiktok --limit 2
 *   npx ts-node scripts/bulk-import-test.ts --blog --tiktok
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });

// Eitan Bernath's blog recipes
const BLOG_RECIPES = [
  "https://www.eitanbernath.com/2024/06/06/sesame-schnitzel-topped-with-loaded-salad/",
  "https://www.eitanbernath.com/2024/01/31/caprese-pizza/",
  "https://www.eitanbernath.com/2023/11/20/better-than-stove-top-stuffing/",
  "https://www.eitanbernath.com/2023/07/25/wild-mushroom-thyme-risotto/",
  "https://www.eitanbernath.com/2023/07/20/barbecue-burgers-with-crispy-onion-straws/",
  "https://www.eitanbernath.com/2023/06/20/salted-caramel-stuffed-chocolate-chip-cookies/",
  "https://www.eitanbernath.com/2023/05/25/blackberry-thyme-margarita/",
  "https://www.eitanbernath.com/2023/04/04/aloo-tikki-chaat/",
  "https://www.eitanbernath.com/2023/03/23/peanut-butter-swirl-brownies-2/",
  "https://www.eitanbernath.com/2023/02/12/pav-bhaji/",
  "https://www.eitanbernath.com/2022/12/09/popcorn-chicken-two-ways-with-homemade-pickles/",
  "https://www.eitanbernath.com/2022/12/02/hummus-with-spiced-lamb-and-herby-tahini/",
  "https://www.eitanbernath.com/2022/11/25/leftover-cranberry-sauce-tart/",
  "https://www.eitanbernath.com/2022/11/18/warm-winter-salad-with-sun-dried-tomato-vinaigrette/",
  "https://www.eitanbernath.com/2022/11/11/apple-cider-braised-chicken-with-sage/",
  "https://www.eitanbernath.com/2022/11/04/butternut-spicy-kale-lasagna/",
  "https://www.eitanbernath.com/2022/10/28/shrooms-and-grits/",
  "https://www.eitanbernath.com/2022/10/21/spiced-carrot-cake-with-whipped-honey/",
  "https://www.eitanbernath.com/2022/10/07/sheet-pan-harissa-spiced-lamb-meatballs/",
  "https://www.eitanbernath.com/2022/09/30/chaat-potatoes-with-masala-ketchup/",
];

// Sample TikTok recipe videos from Eitan
const TIKTOK_RECIPES: string[] = [
  "https://www.tiktok.com/@eitan/video/7598657409736805662",
];

interface ImportResult {
  url: string;
  success: boolean;
  title?: string;
  ingredientCount?: number;
  error?: string;
  duration?: number;
}

async function importRecipe(url: string): Promise<ImportResult> {
  const start = Date.now();

  try {
    // Dynamically import to ensure env vars are loaded
    const { parseRecipeFromUrl } = await import("../lib/recipeParser");

    const recipe = await parseRecipeFromUrl(url);
    const duration = Date.now() - start;

    return {
      url,
      success: true,
      title: recipe.title,
      ingredientCount: recipe.ingredients?.length || 0,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - start;
    return {
      url,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration,
    };
  }
}

async function runBulkImport(
  urls: string[],
  label: string,
  limit?: number,
): Promise<ImportResult[]> {
  const toImport = limit ? urls.slice(0, limit) : urls;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Importing ${toImport.length} ${label} recipes...`);
  console.log("=".repeat(60));

  const results: ImportResult[] = [];

  for (let i = 0; i < toImport.length; i++) {
    const url = toImport[i];
    console.log(`\n[${i + 1}/${toImport.length}] Importing: ${url}`);

    const result = await importRecipe(url);
    results.push(result);

    if (result.success) {
      console.log(`  OK: ${result.title}`);
      console.log(`    ${result.ingredientCount} ingredients, ${result.duration}ms`);
    } else {
      console.log(`  FAIL: ${result.error}`);
    }

    // Rate limiting - wait 1 second between requests
    if (i < toImport.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

function printSummary(results: ImportResult[], label: string): void {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\n${"─".repeat(60)}`);
  console.log(`${label} Summary:`);
  console.log(`  Total: ${results.length}`);
  console.log(`  Success: ${successful.length}`);
  console.log(`  Failed: ${failed.length}`);

  if (successful.length > 0) {
    const avgDuration =
      successful.reduce((sum, r) => sum + (r.duration || 0), 0) / successful.length;
    console.log(`  Avg Duration: ${Math.round(avgDuration)}ms`);
  }

  if (failed.length > 0) {
    console.log(`\n  Failed URLs:`);
    failed.forEach((r) => {
      console.log(`    - ${r.url}`);
      console.log(`      Error: ${r.error}`);
    });
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const runBlog = args.includes("--blog") || args.length === 0;
  const runTikTok = args.includes("--tiktok");
  const limitIndex = args.indexOf("--limit");
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined;

  console.log("Mangia Recipe Bulk Import Test");
  console.log("==============================");
  console.log(`Blog: ${runBlog ? "Yes" : "No"}`);
  console.log(`TikTok: ${runTikTok ? "Yes" : "No"}`);
  console.log(`Limit: ${limit || "None"}`);

  // Check environment
  console.log("\nEnvironment Check:");
  console.log(`  CLOUDFLARE_ACCOUNT_ID: ${process.env.EXPO_PUBLIC_CLOUDFLARE_ACCOUNT_ID ? "Set" : "Missing"}`);
  console.log(`  CLOUDFLARE_API_TOKEN: ${process.env.EXPO_PUBLIC_CLOUDFLARE_API_TOKEN ? "Set" : "Missing"}`);
  console.log(`  GEMINI_API_KEY: ${process.env.EXPO_PUBLIC_GEMINI_API_KEY ? "Set" : "Missing"}`);
  console.log(`  RAPIDAPI_KEY: ${process.env.EXPO_PUBLIC_RAPIDAPI_KEY ? "Set" : "Missing"}`);
  console.log(`  FIRECRAWL_API_KEY: ${process.env.EXPO_PUBLIC_FIRECRAWL_API_KEY ? "Set" : "Missing"}`);

  const allResults: ImportResult[] = [];

  if (runBlog) {
    if (!process.env.EXPO_PUBLIC_FIRECRAWL_API_KEY) {
      console.log("\nWarning: FIRECRAWL_API_KEY not set - blog imports may fail");
    }
    const blogResults = await runBulkImport(BLOG_RECIPES, "Blog", limit);
    allResults.push(...blogResults);
    printSummary(blogResults, "Blog");
  }

  if (runTikTok) {
    if (!process.env.EXPO_PUBLIC_RAPIDAPI_KEY) {
      console.log("\nWarning: RAPIDAPI_KEY not set - TikTok imports will fail");
      console.log("   Get a key at: https://rapidapi.com/hub");
      console.log("   Subscribe to: tiktok-video-no-watermark2");
    } else if (TIKTOK_RECIPES.length === 0) {
      console.log("\nWarning: No TikTok URLs configured in script");
      console.log("   Add URLs to TIKTOK_RECIPES array");
    } else {
      const tiktokResults = await runBulkImport(TIKTOK_RECIPES, "TikTok", limit);
      allResults.push(...tiktokResults);
      printSummary(tiktokResults, "TikTok");
    }
  }

  // Final summary
  if (allResults.length > 0) {
    console.log(`\n${"=".repeat(60)}`);
    console.log("FINAL SUMMARY");
    console.log("=".repeat(60));
    const successful = allResults.filter((r) => r.success);
    console.log(`Total Recipes: ${allResults.length}`);
    console.log(`Successful: ${successful.length} (${Math.round((successful.length / allResults.length) * 100)}%)`);
    console.log(`Failed: ${allResults.length - successful.length}`);

    // Output successful recipes
    if (successful.length > 0) {
      console.log("\nSuccessful imports:");
      successful.forEach((r) => {
        console.log(`  - ${r.title} (${r.ingredientCount} ingredients)`);
      });
    }
  }
}

main().catch(console.error);
