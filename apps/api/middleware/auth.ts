// middleware/auth.ts
// Hono middleware wrapping lib/auth.ts authenticateRequest

import { createMiddleware } from "hono/factory";
import type { AuthUser } from "../lib/auth";
import { authenticateRequest } from "../lib/auth";

export type AuthEnv = {
  Variables: {
    user: AuthUser;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const user = await authenticateRequest(
    c.req.header("authorization") ?? null,
  );

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", user);
  await next();
});
