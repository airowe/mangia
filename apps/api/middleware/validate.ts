// middleware/validate.ts
// Manual Zod validation helper matching the existing { error, details } response shape
// Uses manual parsing instead of @hono/zod-validator to avoid TypeScript OOM issues

import type { z } from "zod";
import type { Context } from "hono";

/**
 * Parses and validates JSON body from a Hono context against a Zod schema.
 * Returns the parsed data or sends a 400 response and returns null.
 */
export async function validateJson<T extends z.ZodType<any, any, any>>(
  c: Context,
  schema: T,
): Promise<z.infer<T> | null> {
  const body = await c.req.json().catch(() => null);
  const result = schema.safeParse(body);

  if (!result.success) {
    return null;
  }

  return result.data;
}

/**
 * Like validateJson but throws a validation error response.
 * Use as: const body = await parseJson(c, schema);
 */
export async function parseJson<T extends z.ZodType<any, any, any>>(
  c: Context,
  schema: T,
): Promise<z.infer<T>> {
  const body = await c.req.json().catch(() => null);
  const result = schema.safeParse(body);

  if (!result.success) {
    throw c.json(
      {
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      },
      400,
    );
  }

  return result.data;
}
