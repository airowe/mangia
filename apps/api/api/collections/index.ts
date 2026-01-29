// api/collections/index.ts
// List and create collections

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { db, collections, recipeCollections, recipes } from "../../db";
import { eq, asc, sql } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await authenticateRequest(req.headers.authorization as string);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // GET - List collections with recipe count
  if (req.method === "GET") {
    try {
      const userCollections = await db.query.collections.findMany({
        where: eq(collections.userId, user.id),
        with: {
          recipeCollections: {
            with: {
              recipe: true,
            },
          },
        },
        orderBy: [asc(collections.name)],
      });

      // Transform to include recipe count and preview
      const collectionsWithCount = userCollections.map((col) => ({
        ...col,
        recipeCount: col.recipeCollections.length,
        previewRecipes: col.recipeCollections.slice(0, 4).map((rc) => rc.recipe),
        recipeCollections: undefined, // Remove the raw junction data
      }));

      return res.status(200).json({ collections: collectionsWithCount });
    } catch (error: any) {
      console.error("Error fetching collections:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Create collection
  if (req.method === "POST") {
    try {
      const body = req.body;

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

      return res.status(201).json({ collection: newCollection });
    } catch (error: any) {
      console.error("Error creating collection:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
