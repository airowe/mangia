// routes/user.ts
// GET /api/user/me

import { Hono } from "hono";
import { authMiddleware, type AuthEnv } from "../middleware/auth";

export const userRoutes = new Hono<AuthEnv>();

userRoutes.use(authMiddleware);

userRoutes.get("/me", (c) => {
  const user = c.get("user");
  return c.json({ user });
});
