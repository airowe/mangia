// routes/features.ts
// GET /api/features

import { Hono } from "hono";
import { authMiddleware, type AuthEnv } from "../middleware/auth";

const FEATURES = [
  { key: "unlimited_imports", title: "Unlimited Recipe Imports", description: "Import as many recipes as you want from any source", icon: "download-multiple", requiresPremium: true },
  { key: "what_can_i_make", title: "What Can I Make?", description: "Find recipes based on ingredients you have", icon: "chef-hat", requiresPremium: true },
  { key: "cookbook_collection", title: "Cookbook Collection", description: "Organize recipes into custom collections", icon: "bookshelf", requiresPremium: true },
  { key: "grocery_export", title: "Export Grocery Lists", description: "Share grocery lists to other apps", icon: "export", requiresPremium: true },
  { key: "meal_planning", title: "Meal Planning", description: "Plan your weekly meals in advance", icon: "calendar-week", requiresPremium: true },
  { key: "advanced_search", title: "Advanced Search", description: "Filter by dietary restrictions, time, and more", icon: "filter-variant", requiresPremium: true },
];

export const featuresRoutes = new Hono<AuthEnv>();

featuresRoutes.use(authMiddleware);

featuresRoutes.get("/", (c) => {
  const user = c.get("user");
  return c.json({ features: FEATURES, userIsPremium: !!user.isPremium });
});
