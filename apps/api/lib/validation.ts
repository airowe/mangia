// lib/validation.ts
// Shared validation helper for Zod schema validation

import { z } from "zod";
import type { VercelResponse } from "@vercel/node";

/**
 * Validates a request body against a Zod schema.
 * Returns the parsed data if valid, or null after sending a 400 response.
 */
export function validateBody<T extends z.ZodSchema>(
  body: unknown,
  schema: T,
  res: VercelResponse
): z.infer<T> | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten().fieldErrors,
    });
    return null;
  }
  return result.data;
}
