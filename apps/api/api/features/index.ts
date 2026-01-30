// api/features/index.ts
// GET /api/features — return premium feature definitions

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateRequest } from "../../lib/auth";
import { handleError } from "../../lib/errors";

const FEATURES = [
  { key: "unlimited_imports", title: "Unlimited Recipe Imports", description: "Import as many recipes as you want from any source", icon: "download-multiple", requiresPremium: true },
  { key: "what_can_i_make", title: "What Can I Make?", description: "Find recipes based on ingredients you have", icon: "chef-hat", requiresPremium: true },
  { key: "cookbook_collection", title: "Cookbook Collection", description: "Organize recipes into custom collections", icon: "bookshelf", requiresPremium: true },
  { key: "grocery_export", title: "Export Grocery Lists", description: "Share grocery lists to other apps", icon: "export", requiresPremium: true },
  { key: "meal_planning", title: "Meal Planning", description: "Plan your weekly meals in advance", icon: "calendar-week", requiresPremium: true },
  { key: "advanced_search", title: "Advanced Search", description: "Filter by dietary restrictions, time, and more", icon: "filter-variant", requiresPremium: true },
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

    return res.status(200).json({
      features: FEATURES,
      userIsPremium: !!user.isPremium,
    });
  } catch (error) {
    return handleError(error, res);
  }
}
