// api/recipes/import-count.ts
// GET /api/recipes/import-count?since=ISO_DATE — return recipe count since a given date

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { handleError } from "../../lib/errors";
import { db, recipes } from "../../db";
import { eq, and, gte, sql } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateRequest(
      req.headers.authorization as string,
    );

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const since = req.query.since as string | undefined;

    const conditions = [eq(recipes.userId, user.id)];

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

    return res.status(200).json({ count: result?.count ?? 0 });
  } catch (error) {
    return handleError(error, res);
  }
}
