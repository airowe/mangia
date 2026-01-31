// routes/pantry.ts
// /api/pantry/*

import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { parseJson } from "../middleware/validate";
import { createPantryItemSchema, updatePantryItemSchema } from "../lib/schemas";
import { db, pantryItems, recipes, loyaltyConnections } from "../db";
import { eq, and, asc, lte, sql, type SQL } from "drizzle-orm";
import { getStockStatus, getStockLabel } from "../lib/stock-status";
import { getExpiryDefault } from "../lib/expiry-defaults";
import { logPantryEvent, logPantryEvents } from "../lib/pantry-event-logger";
import { normalizeItemName, ingredientsMatch } from "../lib/ingredient-matcher";
import { categorizeIngredient } from "../lib/grocery-generator";
import { setUndoEntry, getUndoEntry, removeUndoEntry } from "../lib/deduct-undo-store";
import { randomUUID } from "crypto";
import { lookupBarcode } from "../lib/barcode-lookup";
import {
  computeDaysUntilExpiry,
  formatExpiryText,
  getAlertWindowDate,
} from "../lib/expiry-helpers";
import { predictReorderDates } from "../lib/consumption-predictor";
import { parseIntent } from "../lib/intent-parser";
import { scanReceipt } from "../lib/receipt-scanner";
import { scanPantryImage } from "../lib/pantry-scanner";
import { deduplicateItems } from "../lib/item-deduplicator";
import { parseVoiceInput } from "../lib/voice-parser";
import { findAndParseReceipts } from "../lib/email-receipt";
import { runComparison } from "../lib/vision-compare";
import { getProvider, LOYALTY_PROVIDERS, syncLoyaltyPurchases } from "../lib/loyalty";

// --- Local Zod schemas (previously inline in each file) ---

const ingredientCategoryEnum = z.enum([
  "produce", "meat_seafood", "dairy_eggs", "bakery",
  "frozen", "canned", "pantry", "other",
]);

const VALID_CATEGORIES = ingredientCategoryEnum.options;

const bulkAddItemSchema = z.object({
  name: z.string().min(1).max(500),
  quantity: z.number().nonnegative().optional().default(1),
  unit: z.string().max(100).optional().default("piece"),
  category: ingredientCategoryEnum.optional(),
  source: z.string().max(100).optional(),
  expiryDate: z.string().optional().nullable(),
});

const bulkAddSchema = z.object({
  items: z.array(bulkAddItemSchema).min(1).max(100),
  mergeStrategy: z.enum(["increment", "replace"]).optional().default("increment"),
});

const deductSchema = z.object({
  recipeId: z.string().uuid(),
  servingsCooked: z.number().positive(),
  servingsOriginal: z.number().positive(),
});

const undoSchema = z.object({
  undoToken: z.string().uuid(),
});

const barcodeLookupSchema = z.object({
  barcode: z.string().min(8).max(20).regex(/^\d+$/, "Barcode must be numeric"),
});

const quickAddSchema = z.object({
  input: z.string().min(1).max(500),
  source: z.string().max(100).optional().default("quick_add"),
});

const scanSchema = z.object({
  imageBase64: z.string().max(5_500_000, "Image too large. Maximum size is approximately 4MB."),
  extractExpiry: z.boolean().default(true),
});

const scanBatchSchema = z.object({
  images: z
    .array(
      z.object({
        imageBase64: z.string().max(5_500_000, "Image too large"),
        label: z.string().max(100).default("photo"),
      }),
    )
    .min(1)
    .max(5),
});

const scanCompareSchema = z.object({
  imageBase64: z.string().max(5_500_000, "Image too large. Maximum size is approximately 4MB."),
  models: z
    .array(
      z.enum(["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro", "claude-sonnet"]),
    )
    .optional(),
});

const receiptScanSchema = z.object({
  imageBase64: z.string().max(5_500_000, "Image too large. Maximum size is approximately 4MB."),
  storeName: z.string().max(200).optional(),
});

const emailReceiptScanSchema = z.object({
  provider: z.enum(["gmail"]),
  accessToken: z.string().min(1),
  lookbackDays: z.number().int().min(1).max(30).default(7),
});

const voiceParseSchema = z.object({
  transcript: z.string().min(1).max(2000),
});

const connectSchema = z.object({
  provider: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
});

const syncSchema = z.object({
  provider: z.string().min(1),
  lookbackDays: z.number().int().min(1).max(30).default(14),
});

export const pantryRoutes = new Hono<AuthEnv>();

pantryRoutes.use(authMiddleware);

// ────────────────── Core CRUD ──────────────────

// GET /api/pantry — List pantry items
pantryRoutes.get("/", async (c) => {
  const user = c.get("user");

  const items = await db.query.pantryItems.findMany({
    where: eq(pantryItems.userId, user.id),
    orderBy: [asc(pantryItems.name)],
  });

  const enrichedItems = items.map((item) => {
    const status = getStockStatus(item.quantity);
    return { ...item, stockStatus: status, stockLabel: getStockLabel(status) };
  });

  return c.json({ items: enrichedItems });
});

// POST /api/pantry — Create pantry item
pantryRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, createPantryItemSchema);

  const category = body.category ?? "other";
  const expiryDate = body.expiryDate
    ? new Date(body.expiryDate)
    : getExpiryDefault(body.name, category);

  const [newItem] = await db
    .insert(pantryItems)
    .values({
      userId: user.id,
      name: body.name,
      quantity: body.quantity,
      unit: body.unit,
      category,
      expiryDate,
      notes: body.notes,
    })
    .returning();

  logPantryEvent(user.id, body.name, "added", body.quantity ?? null, body.unit ?? null, "manual");

  return c.json({ item: newItem }, 201);
});

// PATCH /api/pantry/:id — Update pantry item
pantryRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await parseJson(c, updatePantryItemSchema);

  const [updatedItem] = await db
    .update(pantryItems)
    .set({
      name: body.name,
      quantity: body.quantity,
      unit: body.unit,
      category: body.category,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      notes: body.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, user.id)))
    .returning();

  if (!updatedItem) {
    return c.json({ error: "Item not found" }, 404);
  }

  return c.json({ item: updatedItem });
});

// DELETE /api/pantry/:id — Delete pantry item
pantryRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const [deletedItem] = await db
    .delete(pantryItems)
    .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, user.id)))
    .returning();

  if (!deletedItem) {
    return c.json({ error: "Item not found" }, 404);
  }

  return c.json({ success: true });
});

// ────────────────── Alerts ──────────────────

// GET /api/pantry/alerts — Pantry items grouped by expiry status
pantryRoutes.get("/alerts", async (c) => {
  const user = c.get("user");
  const windowParam = c.req.query("window");
  const category = c.req.query("category");

  let windowDays = 7;
  if (windowParam) {
    const parsed = parseInt(windowParam, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 365) {
      windowDays = parsed;
    }
  }

  const conditions: SQL[] = [
    eq(pantryItems.userId, user.id),
    sql`${pantryItems.expiryDate} IS NOT NULL`,
    lte(pantryItems.expiryDate, getAlertWindowDate(windowDays)),
  ];

  if (category && VALID_CATEGORIES.includes(category as any)) {
    conditions.push(eq(pantryItems.category, category as any));
  }

  const items = await db.query.pantryItems.findMany({
    where: and(...conditions),
    orderBy: (pantryItems, { asc }) => [asc(pantryItems.expiryDate)],
  });

  const enriched = items.map((item) => {
    const daysUntil = computeDaysUntilExpiry(item.expiryDate!);
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      expiryDate: item.expiryDate!.toISOString(),
      expiryText: formatExpiryText(daysUntil),
      daysUntilExpiry: daysUntil,
    };
  });

  const expired: typeof enriched = [];
  const expiring: typeof enriched = [];
  for (const item of enriched) {
    if (item.daysUntilExpiry < 0) {
      expired.push(item);
    } else {
      expiring.push(item);
    }
  }

  expired.sort((a, b) => b.daysUntilExpiry - a.daysUntilExpiry);

  return c.json({
    expired,
    expiring,
    counts: {
      expired: expired.length,
      expiring: expiring.length,
      total: expired.length + expiring.length,
    },
  });
});

// ────────────────── Barcode ──────────────────

// POST /api/pantry/barcode-lookup
pantryRoutes.post("/barcode-lookup", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, barcodeLookupSchema);

  const product = await lookupBarcode(body.barcode);

  if (!product) {
    return c.json({ found: false, barcode: body.barcode });
  }

  return c.json({ found: true, product });
});

// ────────────────── Bulk add ──────────────────

// POST /api/pantry/bulk-add
pantryRoutes.post("/bulk-add", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, bulkAddSchema);

  const existing = await db.query.pantryItems.findMany({
    where: eq(pantryItems.userId, user.id),
    orderBy: [asc(pantryItems.name)],
  });

  const existingMap = new Map<string, typeof existing[number]>();
  for (const item of existing) {
    existingMap.set(normalizeItemName(item.name), item);
  }

  let addedCount = 0;
  let mergedCount = 0;
  const resultItems: typeof existing = [];

  for (const item of body.items) {
    const normalizedName = normalizeItemName(item.name);
    const category = item.category ?? categorizeIngredient(item.name);
    const existingItem = existingMap.get(normalizedName);

    if (existingItem) {
      const newQuantity =
        body.mergeStrategy === "increment"
          ? (existingItem.quantity ?? 0) + (item.quantity ?? 1)
          : (item.quantity ?? 1);

      const [updated] = await db
        .update(pantryItems)
        .set({
          quantity: newQuantity,
          unit: item.unit || existingItem.unit,
          category,
          updatedAt: new Date(),
        })
        .where(eq(pantryItems.id, existingItem.id))
        .returning();

      resultItems.push(updated);
      mergedCount++;
    } else {
      const expiryDate = item.expiryDate
        ? new Date(item.expiryDate)
        : getExpiryDefault(item.name, category);

      const [created] = await db
        .insert(pantryItems)
        .values({
          userId: user.id,
          name: item.name,
          quantity: item.quantity ?? 1,
          unit: item.unit || "piece",
          category,
          expiryDate,
        })
        .returning();

      resultItems.push(created);
      existingMap.set(normalizedName, created);
      addedCount++;
    }
  }

  logPantryEvents(
    user.id,
    body.items.map((i: any) => ({ name: i.name, quantity: i.quantity ?? 1, unit: i.unit ?? "piece" })),
    "added",
    body.items[0]?.source ?? "bulk_add",
  );

  return c.json({ added: addedCount, merged: mergedCount, items: resultItems });
});

// ────────────────── Deduct / Undo ──────────────────

// POST /api/pantry/deduct
pantryRoutes.post("/deduct", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, deductSchema);

  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, body.recipeId), eq(recipes.userId, user.id)),
    with: { ingredients: true },
  });

  if (!recipe) {
    return c.json({ error: "Recipe not found" }, 404);
  }

  const userPantry = await db.query.pantryItems.findMany({
    where: eq(pantryItems.userId, user.id),
  });

  const scaleFactor = body.servingsCooked / body.servingsOriginal;
  const pantryNameMap = new Map<string, typeof userPantry[number]>();
  for (const item of userPantry) {
    pantryNameMap.set(normalizeItemName(item.name), item);
  }

  const snapshot: { id: string; quantity: number | null }[] = [];
  const deducted: { name: string; deducted: number; remaining: number; removed: boolean }[] = [];
  const skipped: string[] = [];

  for (const ingredient of recipe.ingredients) {
    const scaledQty = (ingredient.quantity ?? 0) * scaleFactor;
    if (scaledQty <= 0) {
      skipped.push(ingredient.name);
      continue;
    }

    let matchedPantryItem: typeof userPantry[number] | undefined;
    const normName = normalizeItemName(ingredient.name);

    if (pantryNameMap.has(normName)) {
      matchedPantryItem = pantryNameMap.get(normName);
    } else {
      for (const pantryItem of userPantry) {
        if (ingredientsMatch(ingredient.name, pantryItem.name)) {
          matchedPantryItem = pantryItem;
          break;
        }
      }
    }

    if (!matchedPantryItem) {
      skipped.push(ingredient.name);
      continue;
    }

    snapshot.push({ id: matchedPantryItem.id, quantity: matchedPantryItem.quantity });

    const currentQty = matchedPantryItem.quantity ?? 0;
    const newQty = Math.max(0, currentQty - scaledQty);
    const actualDeducted = currentQty - newQty;

    if (newQty <= 0) {
      await db.delete(pantryItems).where(eq(pantryItems.id, matchedPantryItem.id));
      deducted.push({ name: matchedPantryItem.name, deducted: actualDeducted, remaining: 0, removed: true });
    } else {
      await db
        .update(pantryItems)
        .set({ quantity: newQty, updatedAt: new Date() })
        .where(eq(pantryItems.id, matchedPantryItem.id));
      deducted.push({ name: matchedPantryItem.name, deducted: actualDeducted, remaining: newQty, removed: false });
    }
  }

  logPantryEvents(
    user.id,
    deducted.map((d) => ({ name: d.name, quantity: d.deducted, unit: null })),
    "deducted",
    "cooking_deduction",
  );

  const undoToken = randomUUID();
  await setUndoEntry(undoToken, {
    userId: user.id,
    snapshot,
    expiresAt: Date.now() + 60_000,
  });

  return c.json({ deducted, skipped, undoToken });
});

// POST /api/pantry/deduct-undo
pantryRoutes.post("/deduct-undo", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, undoSchema);

  const entry = await getUndoEntry(body.undoToken);

  if (!entry || entry.userId !== user.id) {
    return c.json({ error: "Undo token expired or not found" }, 404);
  }

  let restored = 0;
  for (const item of entry.snapshot) {
    const existing = await db.query.pantryItems.findFirst({
      where: eq(pantryItems.id, item.id),
    });

    if (existing) {
      await db
        .update(pantryItems)
        .set({ quantity: item.quantity, updatedAt: new Date() })
        .where(eq(pantryItems.id, item.id));
      restored++;
    }
  }

  await removeUndoEntry(body.undoToken);

  return c.json({ restored });
});

// ────────────────── Email receipts ──────────────────

// POST /api/pantry/email-receipts
pantryRoutes.post("/email-receipts", async (c) => {
  const user = c.get("user");

  if (!user.isPremium) {
    return c.json(
      { error: "Email receipt parsing is a premium feature", code: "PREMIUM_REQUIRED" },
      403,
    );
  }

  const body = await parseJson(c, emailReceiptScanSchema);
  const result = await findAndParseReceipts(body.accessToken, body.lookbackDays);

  return c.json(result);
});

// ────────────────── Predictions ──────────────────

// GET /api/pantry/predictions
pantryRoutes.get("/predictions", async (c) => {
  const user = c.get("user");

  if (!user.isPremium) {
    return c.json(
      { error: "Predictive reordering is a premium feature", code: "PREMIUM_REQUIRED" },
      403,
    );
  }

  const predictions = await predictReorderDates(user.id);

  return c.json({ predictions });
});

// ────────────────── Quick add ──────────────────

// POST /api/pantry/quick-add
pantryRoutes.post("/quick-add", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, quickAddSchema);

  const parsed = parseIntent(body.input);

  switch (parsed.intent) {
    case "add_to_pantry": {
      const items = [];
      for (const name of parsed.items) {
        const category = categorizeIngredient(name);
        const expiryDate = getExpiryDefault(name, category);
        await db
          .insert(pantryItems)
          .values({
            userId: user.id,
            name,
            quantity: 1,
            unit: "piece",
            category,
            expiryDate,
          })
          .returning();
        items.push({ name, quantity: 1, unit: "piece", category, action: "added_to_pantry" });
      }

      logPantryEvents(
        user.id,
        items.map((i) => ({ name: i.name, quantity: 1, unit: "piece" })),
        "added",
        body.source,
      );

      const itemNames = items.map((i) => i.name).join(", ");
      return c.json({ items, message: `Added ${itemNames} to your pantry` });
    }

    case "add_to_grocery": {
      const items = parsed.items.map((name) => ({
        name,
        quantity: 1,
        unit: "piece" as const,
        category: categorizeIngredient(name),
        action: "added_to_grocery" as const,
      }));

      const itemNames = items.map((i) => i.name).join(", ");
      return c.json({ items, message: `Added ${itemNames} to your grocery list` });
    }

    case "stock_check": {
      if (parsed.items.length === 0) {
        return c.json({ message: "What item would you like to check?" });
      }

      const itemName = parsed.items[0];

      const allItems = await db.query.pantryItems.findMany({
        where: eq(pantryItems.userId, user.id),
      });

      const match = allItems.find(
        (i) => i.name.toLowerCase().includes(itemName.toLowerCase()),
      );

      if (match) {
        return c.json({
          found: true,
          item: match.name,
          quantity: match.quantity,
          unit: match.unit,
          expiryDate: match.expiryDate?.toISOString().split("T")[0] ?? null,
          message: `You have ${match.quantity ?? 0} ${match.unit ?? "piece"}(s) of ${match.name}`,
        });
      }

      return c.json({
        found: false,
        item: itemName,
        message: `${itemName} is not in your pantry`,
      });
    }

    case "check_alerts": {
      return c.json({
        message: "Check the Kitchen Alerts screen for expiring items",
        redirect: "kitchen_alerts",
      });
    }

    default:
      return c.json({ message: "I didn't understand that" });
  }
});

// ────────────────── Receipt scan ──────────────────

// POST /api/pantry/receipt-scan
pantryRoutes.post("/receipt-scan", async (c) => {
  const user = c.get("user");

  if (!user.isPremium) {
    return c.json(
      { error: "Receipt scanning is a premium feature", code: "PREMIUM_REQUIRED" },
      403,
    );
  }

  const body = await parseJson(c, receiptScanSchema);
  const result = await scanReceipt(body.imageBase64, body.storeName);

  return c.json(result);
});

// ────────────────── AI scan ──────────────────

// POST /api/pantry/scan
pantryRoutes.post("/scan", async (c) => {
  const user = c.get("user");

  if (!user.isPremium) {
    return c.json(
      { error: "AI Pantry Scanner is a premium feature", code: "PREMIUM_REQUIRED" },
      403,
    );
  }

  const body = await parseJson(c, scanSchema);
  const items = await scanPantryImage(body.imageBase64, body.extractExpiry);

  return c.json({ items });
});

// POST /api/pantry/scan-batch
pantryRoutes.post("/scan-batch", async (c) => {
  const user = c.get("user");

  if (!user.isPremium) {
    return c.json(
      { error: "Batch scanning is a premium feature", code: "PREMIUM_REQUIRED" },
      403,
    );
  }

  const body = await parseJson(c, scanBatchSchema);

  const scanPromises = body.images.map(async (img: any) => {
    try {
      const items = await scanPantryImage(img.imageBase64, false);
      return {
        label: img.label as string,
        itemCount: items.length,
        status: "success" as const,
        items: items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          confidence: item.confidence,
          expiryDate: item.expiryDate,
        })),
      };
    } catch (err) {
      return {
        label: img.label as string,
        itemCount: 0,
        status: "error" as const,
        items: [] as any[],
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  const photoResults = await Promise.all(scanPromises);

  const itemsBySource = photoResults
    .filter((r: any) => r.status === "success")
    .map((r: any) => ({ label: r.label, items: r.items }));

  const dedupResult = deduplicateItems(itemsBySource);

  return c.json({
    photoResults: photoResults.map(({ items, ...meta }: any) => meta),
    items: dedupResult.items,
    totalBeforeDedup: dedupResult.totalBeforeDedup,
    totalAfterDedup: dedupResult.totalAfterDedup,
    duplicatesRemoved: dedupResult.duplicatesRemoved,
  });
});

// POST /api/pantry/scan-compare
pantryRoutes.post("/scan-compare", async (c) => {
  const user = c.get("user");

  if (!user.isPremium) {
    return c.json(
      { error: "Vision model comparison is a premium feature", code: "PREMIUM_REQUIRED" },
      403,
    );
  }

  const body = await parseJson(c, scanCompareSchema);
  const result = await runComparison(body.imageBase64, { models: body.models });

  return c.json(result);
});

// ────────────────── Stock check ──────────────────

// GET /api/pantry/stock-check
pantryRoutes.get("/stock-check", async (c) => {
  const user = c.get("user");
  const itemQuery = c.req.query("item");

  if (!itemQuery) {
    return c.json({ error: "Query parameter 'item' is required" }, 400);
  }

  const searchTerm = itemQuery.toLowerCase().trim();

  const allItems = await db.query.pantryItems.findMany({
    where: eq(pantryItems.userId, user.id),
  });

  const match = allItems.find(
    (i) => i.name.toLowerCase().includes(searchTerm),
  );

  if (!match) {
    return c.json({ found: false, item: itemQuery });
  }

  const status = getStockStatus(match.quantity);

  return c.json({
    found: true,
    item: match.name,
    quantity: match.quantity,
    unit: match.unit,
    status,
    statusLabel: getStockLabel(status),
    expiryDate: match.expiryDate?.toISOString().split("T")[0] ?? null,
  });
});

// ────────────────── Voice parse ──────────────────

// POST /api/pantry/voice-parse
pantryRoutes.post("/voice-parse", async (c) => {
  const user = c.get("user");

  if (!user.isPremium) {
    return c.json(
      { error: "Voice input is a premium feature", code: "PREMIUM_REQUIRED" },
      403,
    );
  }

  const body = await parseJson(c, voiceParseSchema);
  const items = await parseVoiceInput(body.transcript);

  return c.json({ items });
});

// ────────────────── Loyalty ──────────────────

// GET /api/pantry/loyalty/providers
pantryRoutes.get("/loyalty/providers", async (c) => {
  const user = c.get("user");

  const connections = await db.query.loyaltyConnections.findMany({
    where: eq(loyaltyConnections.userId, user.id),
  });

  const connectionMap = new Map(connections.map((conn) => [conn.provider, conn]));

  const providers = LOYALTY_PROVIDERS.map((provider) => {
    const conn = connectionMap.get(provider.id);
    return {
      ...provider,
      connected: !!conn,
      lastSync: conn?.lastSyncAt?.toISOString() ?? null,
    };
  });

  return c.json({ providers });
});

// POST /api/pantry/loyalty/connect
pantryRoutes.post("/loyalty/connect", async (c) => {
  const user = c.get("user");

  if (!user.isPremium) {
    return c.json(
      { error: "Loyalty sync is a premium feature", code: "PREMIUM_REQUIRED" },
      403,
    );
  }

  const body = await parseJson(c, connectSchema);

  const provider = getProvider(body.provider);
  if (!provider || provider.status !== "active") {
    return c.json({ error: `Provider "${body.provider}" is not available` }, 400);
  }

  const existing = await db.query.loyaltyConnections.findFirst({
    where: and(
      eq(loyaltyConnections.userId, user.id),
      eq(loyaltyConnections.provider, body.provider),
    ),
  });

  if (existing) {
    await db
      .update(loyaltyConnections)
      .set({
        accessToken: body.accessToken,
        refreshToken: body.refreshToken ?? existing.refreshToken,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : existing.expiresAt,
      })
      .where(eq(loyaltyConnections.id, existing.id));
  } else {
    await db.insert(loyaltyConnections).values({
      userId: user.id,
      provider: body.provider,
      accessToken: body.accessToken,
      refreshToken: body.refreshToken ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    });
  }

  return c.json({ connected: true, provider: body.provider });
});

// POST /api/pantry/loyalty/sync
pantryRoutes.post("/loyalty/sync", async (c) => {
  const user = c.get("user");

  if (!user.isPremium) {
    return c.json(
      { error: "Loyalty sync is a premium feature", code: "PREMIUM_REQUIRED" },
      403,
    );
  }

  const body = await parseJson(c, syncSchema);

  const connection = await db.query.loyaltyConnections.findFirst({
    where: and(
      eq(loyaltyConnections.userId, user.id),
      eq(loyaltyConnections.provider, body.provider),
    ),
  });

  if (!connection) {
    return c.json(
      { error: `No connected ${body.provider} account found`, code: "NOT_CONNECTED" },
      404,
    );
  }

  const result = await syncLoyaltyPurchases(
    body.provider,
    connection.accessToken,
    body.lookbackDays,
  );

  await db
    .update(loyaltyConnections)
    .set({ lastSyncAt: new Date() })
    .where(eq(loyaltyConnections.id, connection.id));

  return c.json(result);
});
