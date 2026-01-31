// middleware/error-handler.ts
// Global Hono error handler using ApiError

import type { ErrorHandler } from "hono";
import { ApiError } from "../lib/errors";

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof ApiError) {
    return c.json(
      {
        error: error.message,
        ...(error.code && { code: error.code }),
      },
      error.statusCode as any,
    );
  }

  console.error("Unhandled error:", error);
  return c.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    500,
  );
};
