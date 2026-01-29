// api/meal-plans/index.ts
// List and create meal plans

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { createMealPlanSchema } from "../../lib/schemas";
import { handleError } from "../../lib/errors";
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
      const { startDate, endDate, date, grouped } = req.query;

      // Grouped mode: compute week boundaries server-side from a single date
      if (grouped === "true" && date && typeof date === "string") {
        const inputDate = new Date(date + "T00:00:00Z");
        // Monday-start week: getUTCDay() returns 0=Sun, 1=Mon ... 6=Sat
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
            lte(mealPlans.date, endStr)
          ),
          with: { recipe: true },
        });

        // Group by date, then by meal type
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

        return res.status(200).json({
          week: { start: startStr, end: endStr },
          days,
        });
      }

      // Non-grouped mode: requires startDate and endDate
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
    } catch (error) {
      return handleError(error, res);
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
    } catch (error) {
      return handleError(error, res);
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
