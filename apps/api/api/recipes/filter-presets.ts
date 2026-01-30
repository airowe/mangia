// api/recipes/filter-presets.ts
// GET /api/recipes/filter-presets — return ordered filter preset definitions

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { handleError } from "../../lib/errors";

const FILTER_PRESETS = [
  { id: "all", label: "All", params: {} },
  { id: "favorites", label: "Favorites", params: { minRating: 4 } },
  { id: "quick", label: "Quick & Easy", params: { maxTotalTime: 30 } },
  { id: "dinner", label: "Dinner Party", params: { mealType: "dinner" } },
  { id: "dessert", label: "Dessert", params: { mealType: "dessert" } },
];

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

    return res.status(200).json({ presets: FILTER_PRESETS });
  } catch (error) {
    return handleError(error, res);
  }
}
