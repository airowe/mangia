// scripts/backfill-ingredient-categories.ts
// One-time script to categorize existing ingredients that have no category or 'other'.
//
// Usage: npx tsx scripts/backfill-ingredient-categories.ts
// Requires: DATABASE_URL environment variable

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, or, isNull } from "drizzle-orm";
import * as schema from "../db/schema";
import { categorizeIngredient } from "../lib/grocery-generator";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema });

  // Fetch all ingredients with no category or 'other'
  const uncategorized = await db.query.ingredients.findMany({
    where: or(
      isNull(schema.ingredients.category),
      eq(schema.ingredients.category, "other"),
    ),
  });

  console.log(`Found ${uncategorized.length} ingredients to categorize`);

  let updated = 0;
  let skipped = 0;
  const BATCH_SIZE = 100;

  for (let i = 0; i < uncategorized.length; i += BATCH_SIZE) {
    const batch = uncategorized.slice(i, i + BATCH_SIZE);

    for (const ingredient of batch) {
      const category = categorizeIngredient(ingredient.name);

      if (category === "other") {
        skipped++;
        continue;
      }

      await db
        .update(schema.ingredients)
        .set({ category })
        .where(eq(schema.ingredients.id, ingredient.id));

      updated++;
    }

    console.log(
      `Processed ${Math.min(i + BATCH_SIZE, uncategorized.length)}/${uncategorized.length}`,
    );
  }

  console.log(`Done. Updated: ${updated}, Skipped (still 'other'): ${skipped}`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
