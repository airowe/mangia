// api/recipes/index.ts
// List and create recipes

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { createRecipeSchema } from "../../lib/schemas";
import { checkImportLimit, incrementImportCount } from "../../lib/rate-limit";
import { handleError } from "../../lib/errors";
import { db, recipes, ingredients } from "../../db";
import { eq, desc, asc, and, or, ilike, inArray, gte, lte, sql, type SQL } from "drizzle-orm";
import { categorizeIngredient } from "../../lib/grocery-generator";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization as string);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // GET - List recipes with search, filtering, sorting, and pagination
  if (req.method === "GET") {
    try {
      const {
        status,
        mealType,
        sourceType,
        search,
        minRating,
        maxTotalTime,
        minServings,
        titleSearch,
        sort = "newest",
        limit = "50",
        offset = "0",
      } = req.query;

      // Build where conditions
      const conditions: SQL[] = [eq(recipes.userId, user.id)];

      // Status supports CSV: "want_to_cook,cooked"
      if (status && typeof status === "string") {
        const validStatuses = ["want_to_cook", "cooked", "archived"];
        const statuses = status.split(",").map(s => s.trim()).filter(s => validStatuses.includes(s));
        if (statuses.length === 1) {
          conditions.push(eq(recipes.status, statuses[0] as any));
        } else if (statuses.length > 1) {
          conditions.push(inArray(recipes.status, statuses as any));
        }
      }
      if (mealType && typeof mealType === "string") {
        conditions.push(eq(recipes.mealType, mealType as any));
      }
      if (minRating && typeof minRating === "string") {
        const parsed = parseInt(minRating, 10);
        if (!isNaN(parsed)) {
          conditions.push(gte(recipes.rating, parsed));
        }
      }
      if (maxTotalTime && typeof maxTotalTime === "string") {
        const maxMinutes = parseInt(maxTotalTime, 10);
        if (!isNaN(maxMinutes)) {
          conditions.push(
            or(
              lte(recipes.totalTime, maxMinutes),
              and(
                sql`${recipes.totalTime} IS NULL`,
                lte(sql`COALESCE(${recipes.prepTime}, 0) + COALESCE(${recipes.cookTime}, 0)`, maxMinutes),
                sql`COALESCE(${recipes.prepTime}, 0) + COALESCE(${recipes.cookTime}, 0) > 0`
              )
            )!
          );
        }
      }
      if (minServings && typeof minServings === "string") {
        const parsed = parseInt(minServings, 10);
        if (!isNaN(parsed)) {
          conditions.push(gte(recipes.servings, parsed));
        }
      }
      if (titleSearch && typeof titleSearch === "string") {
        conditions.push(ilike(recipes.title, `%${titleSearch}%`));
      }
      if (sourceType && typeof sourceType === "string") {
        conditions.push(eq(recipes.sourceType, sourceType));
      }
      if (search && typeof search === "string") {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            ilike(recipes.title, searchTerm),
            ilike(recipes.description, searchTerm)
          )!
        );
      }

      const whereClause = and(...conditions)!;

      // Build sort order
      const sortMap: Record<string, SQL> = {
        newest: desc(recipes.createdAt),
        oldest: asc(recipes.createdAt),
        rating: desc(recipes.rating),
        most_cooked: desc(recipes.cookCount),
        alphabetical: asc(recipes.title),
      };
      const orderBy = sortMap[sort as string] || sortMap.newest;

      // Fetch recipes and total count in parallel
      const [userRecipes, countResult] = await Promise.all([
        db.query.recipes.findMany({
          where: whereClause,
          with: { ingredients: true },
          orderBy: [orderBy],
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        }),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(recipes)
          .where(whereClause),
      ]);

      return res.status(200).json({
        recipes: userRecipes,
        total: countResult[0]?.count ?? 0,
      });
    } catch (error) {
      return handleError(error, res);
    }
  }

  // POST - Create recipe
  if (req.method === "POST") {
    try {
      const body = validateBody(req.body, createRecipeSchema, res);
      if (!body) return;

      // Check import limit for free tier users
      const limitResult = await checkImportLimit(user.id, user.isPremium);
      if (!limitResult.allowed) {
        return res.status(429).json({
          error: "Monthly recipe import limit reached",
          limit: limitResult.limit,
          remaining: 0,
          resetAt: limitResult.resetAt?.toISOString(),
        });
      }

      // Create recipe
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

      // Create ingredients if provided
      if (body.ingredients && body.ingredients.length > 0) {
        await db.insert(ingredients).values(
          body.ingredients.map((ing, index) => ({
            recipeId: newRecipe.id,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: ing.category || categorizeIngredient(ing.name),
            notes: ing.notes,
            isOptional: ing.isOptional,
            orderIndex: index,
          }))
        );
      }

      // Fetch complete recipe with ingredients
      const completeRecipe = await db.query.recipes.findFirst({
        where: eq(recipes.id, newRecipe.id),
        with: {
          ingredients: true,
        },
      });

      // Increment import counter for free tier tracking
      await incrementImportCount(user.id);

      return res.status(201).json({ recipe: completeRecipe });
    } catch (error) {
      return handleError(error, res);
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
