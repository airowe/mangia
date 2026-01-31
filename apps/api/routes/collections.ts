// routes/collections.ts
// /api/collections/*

import { Hono } from "hono";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { parseJson } from "../middleware/validate";
import {
  createCollectionSchema,
  updateCollectionSchema,
  collectionRecipeSchema,
} from "../lib/schemas";
import { db, collections, recipeCollections, recipes } from "../db";
import { eq, and, asc } from "drizzle-orm";

export const collectionsRoutes = new Hono<AuthEnv>();

collectionsRoutes.use(authMiddleware);

// GET /api/collections — List collections with recipe count
collectionsRoutes.get("/", async (c) => {
  const user = c.get("user");

  const userCollections = await db.query.collections.findMany({
    where: eq(collections.userId, user.id),
    with: {
      recipeCollections: {
        with: { recipe: true },
      },
    },
    orderBy: [asc(collections.name)],
  });

  const collectionsWithCount = userCollections.map((col) => ({
    ...col,
    recipeCount: col.recipeCollections.length,
    previewRecipes: col.recipeCollections.slice(0, 4).map((rc) => rc.recipe),
    recipeCollections: undefined,
  }));

  return c.json({ collections: collectionsWithCount });
});

// POST /api/collections — Create collection
collectionsRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, createCollectionSchema);

  const [newCollection] = await db
    .insert(collections)
    .values({
      userId: user.id,
      name: body.name,
      description: body.description,
      color: body.color,
      icon: body.icon,
    })
    .returning();

  return c.json({ collection: newCollection }, 201);
});

// GET /api/collections/:id — Get single collection with recipes
collectionsRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const collection = await db.query.collections.findFirst({
    where: and(eq(collections.id, id), eq(collections.userId, user.id)),
    with: {
      recipeCollections: {
        with: { recipe: true },
      },
    },
  });

  if (!collection) {
    return c.json({ error: "Collection not found" }, 404);
  }

  const result = {
    ...collection,
    recipeCount: collection.recipeCollections.length,
    recipes: collection.recipeCollections.map((rc) => rc.recipe),
    recipeCollections: undefined,
  };

  return c.json({ collection: result });
});

// PATCH /api/collections/:id — Update collection
collectionsRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await parseJson(c, updateCollectionSchema);

  const [updated] = await db
    .update(collections)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(collections.id, id), eq(collections.userId, user.id)))
    .returning();

  if (!updated) {
    return c.json({ error: "Collection not found" }, 404);
  }

  return c.json({ collection: updated });
});

// DELETE /api/collections/:id — Delete collection
collectionsRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(collections)
    .where(and(eq(collections.id, id), eq(collections.userId, user.id)))
    .returning();

  if (!deleted) {
    return c.json({ error: "Collection not found" }, 404);
  }

  return c.json({ success: true });
});

// POST /api/collections/:id/recipes — Add recipe to collection
collectionsRoutes.post("/:id/recipes", async (c) => {
  const user = c.get("user");
  const collectionId = c.req.param("id");
  const body = await parseJson(c, collectionRecipeSchema);

  // Verify collection ownership
  const collection = await db.query.collections.findFirst({
    where: and(eq(collections.id, collectionId), eq(collections.userId, user.id)),
  });

  if (!collection) {
    return c.json({ error: "Collection not found" }, 404);
  }

  // Verify recipe ownership
  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, body.recipeId), eq(recipes.userId, user.id)),
  });

  if (!recipe) {
    return c.json({ error: "Recipe not found" }, 404);
  }

  // Check for duplicate
  const existing = await db.query.recipeCollections.findFirst({
    where: and(
      eq(recipeCollections.collectionId, collectionId),
      eq(recipeCollections.recipeId, body.recipeId),
    ),
  });

  if (existing) {
    return c.json({ error: "Recipe already in collection" }, 409);
  }

  const [entry] = await db
    .insert(recipeCollections)
    .values({ collectionId, recipeId: body.recipeId })
    .returning();

  return c.json({ recipeCollection: entry }, 201);
});

// DELETE /api/collections/:id/recipes — Remove recipe from collection
collectionsRoutes.delete("/:id/recipes", async (c) => {
  const user = c.get("user");
  const collectionId = c.req.param("id");
  const body = await parseJson(c, collectionRecipeSchema);

  // Verify collection ownership
  const collection = await db.query.collections.findFirst({
    where: and(eq(collections.id, collectionId), eq(collections.userId, user.id)),
  });

  if (!collection) {
    return c.json({ error: "Collection not found" }, 404);
  }

  const [deleted] = await db
    .delete(recipeCollections)
    .where(
      and(
        eq(recipeCollections.collectionId, collectionId),
        eq(recipeCollections.recipeId, body.recipeId),
      ),
    )
    .returning();

  if (!deleted) {
    return c.json({ error: "Recipe not found in collection" }, 404);
  }

  return c.json({ success: true });
});
