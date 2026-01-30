// lib/barcode-lookup.ts
// Barcode product lookup via Open Food Facts API with local caching

import { categorizeIngredient } from "./grocery-generator";
import type { IngredientCategory } from "@mangia/shared";
import { db, barcodeProducts } from "../db";
import { eq } from "drizzle-orm";

export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand: string | null;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  imageUrl: string | null;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    quantity?: string;
    image_url?: string;
    categories_tags?: string[];
  };
}

/**
 * Look up a product by barcode. Checks local cache first, then Open Food Facts.
 */
export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  // Check cache first
  const cached = await db.query.barcodeProducts.findFirst({
    where: eq(barcodeProducts.barcode, barcode),
  });

  if (cached) {
    return {
      barcode: cached.barcode,
      name: cached.name,
      brand: cached.brand,
      quantity: cached.quantity ?? 1,
      unit: cached.unit ?? "piece",
      category: (cached.category as IngredientCategory) ?? "other",
      imageUrl: cached.imageUrl,
    };
  }

  // Query Open Food Facts
  const product = await fetchOpenFoodFacts(barcode);
  if (!product) return null;

  // Cache the result
  try {
    await db.insert(barcodeProducts).values({
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      quantity: product.quantity,
      unit: product.unit,
      category: product.category,
      imageUrl: product.imageUrl,
      source: "openfoodfacts",
    });
  } catch {
    // Cache write failure is non-fatal
  }

  return product;
}

async function fetchOpenFoodFacts(barcode: string): Promise<BarcodeProduct | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      {
        headers: { "User-Agent": "Mangia/1.0 (https://mangia-nu.vercel.app)" },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as OpenFoodFactsResponse;
    if (data.status !== 1 || !data.product?.product_name) return null;

    const productName = data.product.product_name;
    const brand = data.product.brands?.split(",")[0]?.trim() ?? null;
    const { quantity, unit } = parseQuantityString(data.product.quantity ?? "");
    const category = categorizeIngredient(productName);

    return {
      barcode,
      name: brand ? `${brand} ${productName}` : productName,
      brand,
      quantity: quantity || 1,
      unit: unit || "piece",
      category,
      imageUrl: data.product.image_url ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Parse quantity strings like "16 oz", "500 g", "1 L" from Open Food Facts.
 */
function parseQuantityString(str: string): { quantity: number; unit: string } {
  const match = str.match(/^([\d.]+)\s*(oz|g|kg|ml|l|lb|fl\s*oz|gal|pt|qt)/i);
  if (match) {
    return { quantity: parseFloat(match[1]), unit: match[2].toLowerCase() };
  }
  return { quantity: 1, unit: "piece" };
}
