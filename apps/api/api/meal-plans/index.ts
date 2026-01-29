// api/meal-plans/index.ts
// List and create meal plans

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { createMealPlanSchema } from "../../lib/schemas";
import { db, mealPlans } from "../../db";
import { eq, and, gte, lte } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization as string);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // GET - List meal plans for date range
  if (req.method === "GET") {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const plans = await db.query.mealPlans.findMany({
        where: and(
          eq(mealPlans.userId, user.id),
          gte(mealPlans.date, startDate as string),
          lte(mealPlans.date, endDate as string)
        ),
        with: {
          recipe: true,
        },
      });

      return res.status(200).json(plans);
    } catch (error: any) {
      console.error("Error fetching meal plans:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Create meal plan
  if (req.method === "POST") {
    try {
      const body = validateBody(req.body, createMealPlanSchema, res);
      if (!body) return;

      // Check if meal already exists for this slot
      const existing = await db.query.mealPlans.findFirst({
        where: and(
          eq(mealPlans.userId, user.id),
          eq(mealPlans.date, body.date),
          eq(mealPlans.mealType, body.mealType)
        ),
      });

      if (existing) {
        // Update existing meal plan
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

        return res.status(200).json(updatedWithRecipe);
      }

      // Create new meal plan
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

      return res.status(201).json(planWithRecipe);
    } catch (error: any) {
      console.error("Error creating meal plan:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
