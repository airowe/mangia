// api/cookbooks/index.ts
// List and create cookbooks (premium feature)

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { validateBody } from "../../lib/validation";
import { createCookbookSchema } from "../../lib/schemas";
import { handleError } from "../../lib/errors";
import { db, cookbooks } from "../../db";
import { eq, asc, ilike, or, and } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization as string);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Premium check
  if (!user.isPremium) {
    return res.status(403).json({ error: "Premium feature" });
  }

  // GET - List/search cookbooks
  if (req.method === "GET") {
    try {
      const { search } = req.query;

      let query = db.query.cookbooks.findMany({
        where: eq(cookbooks.userId, user.id),
        orderBy: [asc(cookbooks.title)],
      });

      // If search query provided, filter by title or author (still scoped to user)
      if (search && typeof search === "string") {
        query = db.query.cookbooks.findMany({
          where: and(
            eq(cookbooks.userId, user.id),
            or(
              ilike(cookbooks.title, `%${search}%`),
              ilike(cookbooks.author, `%${search}%`)
            )
          ),
          orderBy: [asc(cookbooks.title)],
        });
      }

      const userCookbooks = await query;

      return res.status(200).json({ cookbooks: userCookbooks });
    } catch (error) {
      return handleError(error, res);
    }
  }

  // POST - Create cookbook
  if (req.method === "POST") {
    try {
      const body = validateBody(req.body, createCookbookSchema, res);
      if (!body) return;

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

      return res.status(201).json({ cookbook: newCookbook });
    } catch (error) {
      return handleError(error, res);
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
