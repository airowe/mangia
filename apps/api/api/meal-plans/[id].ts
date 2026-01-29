// api/meal-plans/[id].ts
// Update and delete single meal plan

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { db, mealPlans } from "../../db";
import { eq, and } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization as string);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Meal plan ID required" });
  }

  // PATCH - Update meal plan
  if (req.method === "PATCH") {
    try {
      const { recipe_id, title, notes, completed } = req.body;

      const [updated] = await db
        .update(mealPlans)
        .set({
          ...(recipe_id !== undefined && { recipeId: recipe_id }),
          ...(title !== undefined && { title }),
          ...(notes !== undefined && { notes }),
          ...(completed !== undefined && { completed }),
        })
        .where(and(eq(mealPlans.id, id), eq(mealPlans.userId, user.id)))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Meal plan not found" });
      }

      const updatedWithRecipe = await db.query.mealPlans.findFirst({
        where: eq(mealPlans.id, updated.id),
        with: { recipe: true },
      });

      return res.status(200).json(updatedWithRecipe);
    } catch (error: any) {
      console.error("Error updating meal plan:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - Delete meal plan
  if (req.method === "DELETE") {
    try {
      const [deleted] = await db
        .delete(mealPlans)
        .where(and(eq(mealPlans.id, id), eq(mealPlans.userId, user.id)))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Meal plan not found" });
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Error deleting meal plan:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
