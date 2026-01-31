// routes/meal-plans.ts
// /api/meal-plans/*

import { Hono } from "hono";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { parseJson } from "../middleware/validate";
import { createMealPlanSchema, updateMealPlanSchema } from "../lib/schemas";
import { db, mealPlans } from "../db";
import { eq, and, gte, lte } from "drizzle-orm";

export const mealPlansRoutes = new Hono<AuthEnv>();

mealPlansRoutes.use(authMiddleware);

// GET /api/meal-plans — List meal plans for date range
mealPlansRoutes.get("/", async (c) => {
  const user = c.get("user");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const date = c.req.query("date");
  const grouped = c.req.query("grouped");

  // Grouped mode: compute week boundaries server-side from a single date
  if (grouped === "true" && date) {
    const inputDate = new Date(date + "T00:00:00Z");
    const dayOfWeek = inputDate.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(inputDate);
    weekStart.setUTCDate(weekStart.getUTCDate() + mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    const startStr = weekStart.toISOString().split("T")[0];
    const endStr = weekEnd.toISOString().split("T")[0];

    const plans = await db.query.mealPlans.findMany({
      where: and(
        eq(mealPlans.userId, user.id),
        gte(mealPlans.date, startStr),
        lte(mealPlans.date, endStr),
      ),
      with: { recipe: true },
    });

    const days: Record<string, Record<string, unknown>> = {};
    for (const plan of plans) {
      if (!days[plan.date]) {
        days[plan.date] = {};
      }
      const mealType = plan.mealType || "other";
      if (mealType === "snack") {
        if (!days[plan.date].snacks) {
          days[plan.date].snacks = [];
        }
        (days[plan.date].snacks as unknown[]).push(plan);
      } else {
        days[plan.date][mealType] = plan;
      }
    }

    return c.json({ week: { start: startStr, end: endStr }, days });
  }

  // Non-grouped mode
  if (!startDate || !endDate) {
    return c.json({ error: "startDate and endDate are required" }, 400);
  }

  const plans = await db.query.mealPlans.findMany({
    where: and(
      eq(mealPlans.userId, user.id),
      gte(mealPlans.date, startDate),
      lte(mealPlans.date, endDate),
    ),
    with: { recipe: true },
  });

  return c.json(plans);
});

// POST /api/meal-plans — Create meal plan
mealPlansRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await parseJson(c, createMealPlanSchema);

  // Check if meal already exists for this slot
  const existing = await db.query.mealPlans.findFirst({
    where: and(
      eq(mealPlans.userId, user.id),
      eq(mealPlans.date, body.date),
      eq(mealPlans.mealType, body.mealType),
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(mealPlans)
      .set({
        recipeId: body.recipeId || null,
        title: body.title || null,
        notes: body.notes || null,
      })
      .where(eq(mealPlans.id, existing.id))
      .returning();

    const updatedWithRecipe = await db.query.mealPlans.findFirst({
      where: eq(mealPlans.id, updated.id),
      with: { recipe: true },
    });

    return c.json(updatedWithRecipe);
  }

  const [newPlan] = await db
    .insert(mealPlans)
    .values({
      userId: user.id,
      date: body.date,
      mealType: body.mealType,
      recipeId: body.recipeId || null,
      title: body.title || null,
      notes: body.notes || null,
    })
    .returning();

  const planWithRecipe = await db.query.mealPlans.findFirst({
    where: eq(mealPlans.id, newPlan.id),
    with: { recipe: true },
  });

  return c.json(planWithRecipe, 201);
});

// PATCH /api/meal-plans/:id — Update meal plan
mealPlansRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await parseJson(c, updateMealPlanSchema);

  const [updated] = await db
    .update(mealPlans)
    .set({
      ...(body.recipeId !== undefined && { recipeId: body.recipeId }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.completed !== undefined && { completed: body.completed }),
    })
    .where(and(eq(mealPlans.id, id), eq(mealPlans.userId, user.id)))
    .returning();

  if (!updated) {
    return c.json({ error: "Meal plan not found" }, 404);
  }

  const updatedWithRecipe = await db.query.mealPlans.findFirst({
    where: eq(mealPlans.id, updated.id),
    with: { recipe: true },
  });

  return c.json(updatedWithRecipe);
});

// DELETE /api/meal-plans/:id — Delete meal plan
mealPlansRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(mealPlans)
    .where(and(eq(mealPlans.id, id), eq(mealPlans.userId, user.id)))
    .returning();

  if (!deleted) {
    return c.json({ error: "Meal plan not found" }, 404);
  }

  return c.json({ success: true });
});
