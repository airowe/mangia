// routes/cookbooks.ts
// /api/cookbooks/*

import { Hono } from "hono";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { parseJson } from "../middleware/validate";
import { createCookbookSchema, updateCookbookSchema } from "../lib/schemas";
import { db, cookbooks } from "../db";
import { eq, and, asc, ilike, or } from "drizzle-orm";

export const cookbooksRoutes = new Hono<AuthEnv>();

cookbooksRoutes.use(authMiddleware);

// Premium gate for all cookbook routes
cookbooksRoutes.use(async (c, next) => {
  const user = c.get("user");
  if (!user.isPremium) {
    return c.json({ error: "Premium feature" }, 403);
  }
  await next();
});

// GET /api/cookbooks — List/search cookbooks
cookbooksRoutes.get("/", async (c) => {
  const user = c.get("user");
  const search = c.req.query("search");

  const whereClause = search
    ? and(
        eq(cookbooks.userId, user.id),
        or(
          ilike(cookbooks.title, `%${search}%`),
          ilike(cookbooks.author, `%${search}%`),
        ),
      )
    : eq(cookbooks.userId, user.id);

  const userCookbooks = await db.query.cookbooks.findMany({
    where: whereClause,
    orderBy: [asc(cookbooks.title)],
  });

  return c.json({ cookbooks: userCookbooks });
});

// POST /api/cookbooks — Create cookbook
cookbooksRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, createCookbookSchema);

  const [newCookbook] = await db
    .insert(cookbooks)
    .values({
      userId: user.id,
      title: body.title,
      author: body.author,
      coverImageUrl: body.coverImageUrl,
      isbn: body.isbn,
      notes: body.notes,
    })
    .returning();

  return c.json({ cookbook: newCookbook }, 201);
});

// GET /api/cookbooks/:id — Get single cookbook
cookbooksRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const cookbook = await db.query.cookbooks.findFirst({
    where: and(eq(cookbooks.id, id), eq(cookbooks.userId, user.id)),
  });

  if (!cookbook) {
    return c.json({ error: "Cookbook not found" }, 404);
  }

  return c.json({ cookbook });
});

// PATCH /api/cookbooks/:id — Update cookbook
cookbooksRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await parseJson(c, updateCookbookSchema);

  const existing = await db.query.cookbooks.findFirst({
    where: and(eq(cookbooks.id, id), eq(cookbooks.userId, user.id)),
  });

  if (!existing) {
    return c.json({ error: "Cookbook not found" }, 404);
  }

  const [updated] = await db
    .update(cookbooks)
    .set({
      title: body.title ?? existing.title,
      author: body.author ?? existing.author,
      coverImageUrl: body.coverImageUrl ?? existing.coverImageUrl,
      isbn: body.isbn ?? existing.isbn,
      notes: body.notes ?? existing.notes,
      updatedAt: new Date(),
    })
    .where(eq(cookbooks.id, id))
    .returning();

  return c.json({ cookbook: updated });
});

// DELETE /api/cookbooks/:id — Delete cookbook
cookbooksRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const existing = await db.query.cookbooks.findFirst({
    where: and(eq(cookbooks.id, id), eq(cookbooks.userId, user.id)),
  });

  if (!existing) {
    return c.json({ error: "Cookbook not found" }, 404);
  }

  await db.delete(cookbooks).where(eq(cookbooks.id, id));

  return c.json({ success: true });
});
