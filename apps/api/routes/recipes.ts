// routes/recipes.ts
// /api/recipes/*

import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { parseJson } from "../middleware/validate";
import {
  createRecipeSchema,
  updateRecipeSchema,
  createRecipeNoteSchema,
} from "../lib/schemas";
import { checkImportLimit, incrementImportCount } from "../lib/rate-limit";
import { db, recipes, ingredients, recipeNotes, pantryItems } from "../db";
import { eq, desc, asc, and, or, ilike, inArray, gte, lte, sql, type SQL } from "drizzle-orm";
import { categorizeIngredient } from "../lib/grocery-generator";
import { getDifficulty, formatTotalTime } from "../lib/recipe-metadata";
import { getServingSuggestions } from "../lib/serving-suggestions";
import { parseRecipeFromUrl, detectUrlType } from "../lib/recipe-parser";
import { findRecipeMatches } from "../lib/ingredient-matching";

const importSchema = z.object({
  url: z.string().url("Please provide a valid URL").refine(
    (url) => url.startsWith("http://") || url.startsWith("https://"),
    "Only HTTP and HTTPS URLs are supported",
  ),
});

const matchSchema = z.object({
  minMatchPercentage: z.number().min(0).max(100).default(0),
});

const FILTER_PRESETS = [
  { id: "all", label: "All", params: {} },
  { id: "favorites", label: "Favorites", params: { minRating: 4 } },
  { id: "quick", label: "Quick & Easy", params: { maxTotalTime: 30 } },
  { id: "dinner", label: "Dinner Party", params: { mealType: "dinner" } },
  { id: "dessert", label: "Dessert", params: { mealType: "dessert" } },
];

export const recipesRoutes = new Hono<AuthEnv>();

recipesRoutes.use(authMiddleware);

// --- Static routes BEFORE /:id ---

// POST /api/recipes/import — Parse URL and create recipe
recipesRoutes.post("/import", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, importSchema);

  const limitResult = await checkImportLimit(user.id, user.isPremium);
  if (!limitResult.allowed) {
    return c.json(
      {
        error: "Monthly recipe import limit reached",
        code: "IMPORT_LIMIT_REACHED",
        limit: limitResult.limit,
        remaining: 0,
        resetAt: limitResult.resetAt?.toISOString(),
      },
      429,
    );
  }

  const parsed = await parseRecipeFromUrl(body.url);
  const sourceType = detectUrlType(body.url);

  const [newRecipe] = await db
    .insert(recipes)
    .values({
      userId: user.id,
      title: parsed.title,
      description: parsed.description,
      imageUrl: parsed.imageUrl,
      sourceUrl: body.url,
      sourceType,
      status: "want_to_cook",
      prepTime: parsed.prepTime,
      cookTime: parsed.cookTime,
      servings: parsed.servings,
      instructions: parsed.instructions,
    })
    .returning();

  if (parsed.ingredients.length > 0) {
    await db.insert(ingredients).values(
      parsed.ingredients.map((ing, index) => ({
        recipeId: newRecipe.id,
        name: ing.name,
        quantity: ing.quantity ? parseFloat(ing.quantity) || null : null,
        unit: ing.unit || null,
        category: categorizeIngredient(ing.name),
        orderIndex: index,
      })),
    );
  }

  const completeRecipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, newRecipe.id),
    with: { ingredients: true },
  });

  await incrementImportCount(user.id);

  return c.json({ recipe: completeRecipe }, 201);
});

// GET /api/recipes/import-count
recipesRoutes.get("/import-count", async (c) => {
  const user = c.get("user");
  const since = c.req.query("since");

  const conditions: SQL[] = [eq(recipes.userId, user.id)];

  if (since) {
    const sinceDate = new Date(since);
    if (!isNaN(sinceDate.getTime())) {
      conditions.push(gte(recipes.createdAt, sinceDate));
    }
  }

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(recipes)
    .where(and(...conditions));

  return c.json({ count: result?.count ?? 0 });
});

// GET /api/recipes/import-quota
recipesRoutes.get("/import-quota", async (c) => {
  const user = c.get("user");
  const result = await checkImportLimit(user.id, user.isPremium);

  return c.json({
    used: result.limit - result.remaining,
    remaining: result.remaining,
    limit: result.limit,
    isLimitReached: !result.allowed,
    isPremium: !!user.isPremium,
  });
});

// POST /api/recipes/match — Match recipes against pantry
recipesRoutes.post("/match", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, matchSchema);

  const [userRecipes, userPantryItems] = await Promise.all([
    db.query.recipes.findMany({
      where: eq(recipes.userId, user.id),
      with: { ingredients: true },
    }),
    db.query.pantryItems.findMany({
      where: eq(pantryItems.userId, user.id),
    }),
  ]);

  const pantryForMatching = userPantryItems.map((item) => ({
    id: item.id,
    title: item.name,
    quantity: item.quantity,
    unit: item.unit,
  }));

  const recipesForMatching = userRecipes.map((r) => ({
    id: r.id,
    title: r.title,
    ingredients: r.ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
    })),
  }));

  const matches = findRecipeMatches(
    recipesForMatching,
    pantryForMatching,
    body.minMatchPercentage,
  );

  return c.json({ matches });
});

// GET /api/recipes/filter-presets
recipesRoutes.get("/filter-presets", (c) => {
  return c.json({ presets: FILTER_PRESETS });
});

// --- Collection routes (index and /:id) ---

// GET /api/recipes — List recipes with search, filtering, sorting, pagination
recipesRoutes.get("/", async (c) => {
  const user = c.get("user");

  const status = c.req.query("status");
  const mealType = c.req.query("mealType");
  const sourceType = c.req.query("sourceType");
  const search = c.req.query("search");
  const minRating = c.req.query("minRating");
  const maxTotalTime = c.req.query("maxTotalTime");
  const minServings = c.req.query("minServings");
  const titleSearch = c.req.query("titleSearch");
  const sort = c.req.query("sort") ?? "newest";
  const limit = c.req.query("limit") ?? "50";
  const offset = c.req.query("offset") ?? "0";

  const conditions: SQL[] = [eq(recipes.userId, user.id)];

  if (status) {
    const validStatuses = ["want_to_cook", "cooked", "archived"];
    const statuses = status.split(",").map((s) => s.trim()).filter((s) => validStatuses.includes(s));
    if (statuses.length === 1) {
      conditions.push(eq(recipes.status, statuses[0] as any));
    } else if (statuses.length > 1) {
      conditions.push(inArray(recipes.status, statuses as any));
    }
  }
  if (mealType) {
    conditions.push(eq(recipes.mealType, mealType as any));
  }
  if (minRating) {
    const parsed = parseInt(minRating, 10);
    if (!isNaN(parsed)) {
      conditions.push(gte(recipes.rating, parsed));
    }
  }
  if (maxTotalTime) {
    const maxMinutes = parseInt(maxTotalTime, 10);
    if (!isNaN(maxMinutes)) {
      conditions.push(
        or(
          lte(recipes.totalTime, maxMinutes),
          and(
            sql`${recipes.totalTime} IS NULL`,
            lte(sql`COALESCE(${recipes.prepTime}, 0) + COALESCE(${recipes.cookTime}, 0)`, maxMinutes),
            sql`COALESCE(${recipes.prepTime}, 0) + COALESCE(${recipes.cookTime}, 0) > 0`,
          ),
        )!,
      );
    }
  }
  if (minServings) {
    const parsed = parseInt(minServings, 10);
    if (!isNaN(parsed)) {
      conditions.push(gte(recipes.servings, parsed));
    }
  }
  if (titleSearch) {
    conditions.push(ilike(recipes.title, `%${titleSearch}%`));
  }
  if (sourceType) {
    conditions.push(eq(recipes.sourceType, sourceType));
  }
  if (search) {
    const searchTerm = `%${search}%`;
    conditions.push(
      or(ilike(recipes.title, searchTerm), ilike(recipes.description, searchTerm))!,
    );
  }

  const whereClause = and(...conditions)!;

  const sortMap: Record<string, SQL> = {
    newest: desc(recipes.createdAt),
    oldest: asc(recipes.createdAt),
    rating: desc(recipes.rating),
    most_cooked: desc(recipes.cookCount),
    alphabetical: asc(recipes.title),
  };
  const orderBy = sortMap[sort] || sortMap.newest;

  const [userRecipes, countResult] = await Promise.all([
    db.query.recipes.findMany({
      where: whereClause,
      with: { ingredients: true },
      orderBy: [orderBy],
      limit: parseInt(limit),
      offset: parseInt(offset),
    }),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(recipes)
      .where(whereClause),
  ]);

  const enrichedRecipes = userRecipes.map((r) => ({
    ...r,
    difficulty: getDifficulty(r.prepTime, r.cookTime),
    formattedTotalTime: formatTotalTime(r.prepTime, r.cookTime),
  }));

  return c.json({
    recipes: enrichedRecipes,
    total: countResult[0]?.count ?? 0,
  });
});

// POST /api/recipes — Create recipe
recipesRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, createRecipeSchema);

  const limitResult = await checkImportLimit(user.id, user.isPremium);
  if (!limitResult.allowed) {
    return c.json(
      {
        error: "Monthly recipe import limit reached",
        limit: limitResult.limit,
        remaining: 0,
        resetAt: limitResult.resetAt?.toISOString(),
      },
      429,
    );
  }

  const [newRecipe] = await db
    .insert(recipes)
    .values({
      userId: user.id,
      title: body.title,
      description: body.description,
      imageUrl: body.imageUrl,
      sourceUrl: body.sourceUrl,
      sourceType: body.sourceType,
      status: body.status,
      mealType: body.mealType,
      prepTime: body.prepTime,
      cookTime: body.cookTime,
      totalTime: body.totalTime,
      servings: body.servings,
      calories: body.calories,
      instructions: body.instructions,
      notes: body.notes,
    })
    .returning();

  if (body.ingredients && body.ingredients.length > 0) {
    await db.insert(ingredients).values(
      body.ingredients.map((ing: any, index: number) => ({
        recipeId: newRecipe.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        category: ing.category || categorizeIngredient(ing.name),
        notes: ing.notes,
        isOptional: ing.isOptional,
        orderIndex: index,
      })),
    );
  }

  const completeRecipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, newRecipe.id),
    with: { ingredients: true },
  });

  await incrementImportCount(user.id);

  return c.json({ recipe: completeRecipe }, 201);
});

// GET /api/recipes/:id — Get single recipe
recipesRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, id), eq(recipes.userId, user.id)),
    with: { ingredients: true },
  });

  if (!recipe) {
    return c.json({ error: "Recipe not found" }, 404);
  }

  const enrichedRecipe = {
    ...recipe,
    difficulty: getDifficulty(recipe.prepTime, recipe.cookTime),
    formattedTotalTime: formatTotalTime(recipe.prepTime, recipe.cookTime),
    servingSuggestions: getServingSuggestions(recipe.servings || 4),
  };

  return c.json({ recipe: enrichedRecipe });
});

// PATCH /api/recipes/:id — Update recipe
recipesRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await parseJson(c, updateRecipeSchema);

  const [updatedRecipe] = await db
    .update(recipes)
    .set({
      title: body.title,
      description: body.description,
      imageUrl: body.imageUrl,
      sourceUrl: body.sourceUrl,
      status: body.status,
      mealType: body.mealType,
      prepTime: body.prepTime,
      cookTime: body.cookTime,
      totalTime: body.totalTime,
      servings: body.servings,
      calories: body.calories,
      instructions: body.instructions,
      notes: body.notes,
      rating: body.rating,
      updatedAt: new Date(),
    })
    .where(and(eq(recipes.id, id), eq(recipes.userId, user.id)))
    .returning();

  if (!updatedRecipe) {
    return c.json({ error: "Recipe not found" }, 404);
  }

  if (body.ingredients) {
    await db.delete(ingredients).where(eq(ingredients.recipeId, id));

    if (body.ingredients.length > 0) {
      await db.insert(ingredients).values(
        body.ingredients.map((ing: any, index: number) => ({
          recipeId: id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          category: ing.category,
          notes: ing.notes,
          isOptional: ing.isOptional,
          orderIndex: index,
        })),
      );
    }
  }

  const completeRecipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, id),
    with: { ingredients: true },
  });

  return c.json({ recipe: completeRecipe });
});

// DELETE /api/recipes/:id — Delete recipe
recipesRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const [deletedRecipe] = await db
    .delete(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, user.id)))
    .returning();

  if (!deletedRecipe) {
    return c.json({ error: "Recipe not found" }, 404);
  }

  return c.json({ success: true });
});

// --- Recipe notes ---

// GET /api/recipes/:id/notes — List notes
recipesRoutes.get("/:id/notes", async (c) => {
  const user = c.get("user");
  const recipeId = c.req.param("id");

  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.userId, user.id)),
  });

  if (!recipe) {
    return c.json({ error: "Recipe not found" }, 404);
  }

  const notes = await db.query.recipeNotes.findMany({
    where: eq(recipeNotes.recipeId, recipeId),
    orderBy: [desc(recipeNotes.createdAt)],
  });

  return c.json(notes);
});

// POST /api/recipes/:id/notes — Create note
recipesRoutes.post("/:id/notes", async (c) => {
  const user = c.get("user");
  const recipeId = c.req.param("id");
  const body = await parseJson(c, createRecipeNoteSchema);

  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.userId, user.id)),
  });

  if (!recipe) {
    return c.json({ error: "Recipe not found" }, 404);
  }

  const [newNote] = await db
    .insert(recipeNotes)
    .values({
      recipeId,
      userId: user.id,
      note: body.note,
      cookedAt: body.cookedAt || new Date().toISOString().split("T")[0],
    })
    .returning();

  await db
    .update(recipes)
    .set({
      cookCount: (recipe.cookCount || 0) + 1,
      lastCookedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(recipes.id, recipeId));

  return c.json(newNote, 201);
});

// DELETE /api/recipes/:id/notes/:noteId — Delete note
recipesRoutes.delete("/:id/notes/:noteId", async (c) => {
  const user = c.get("user");
  const recipeId = c.req.param("id");
  const noteId = c.req.param("noteId");

  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.userId, user.id)),
  });

  if (!recipe) {
    return c.json({ error: "Recipe not found" }, 404);
  }

  const [deleted] = await db
    .delete(recipeNotes)
    .where(
      and(
        eq(recipeNotes.id, noteId),
        eq(recipeNotes.recipeId, recipeId),
        eq(recipeNotes.userId, user.id),
      ),
    )
    .returning();

  if (!deleted) {
    return c.json({ error: "Note not found" }, 404);
  }

  return c.json({ success: true });
});
