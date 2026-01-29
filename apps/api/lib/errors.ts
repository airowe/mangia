// lib/errors.ts
// Centralized API error handling

import type { VercelResponse } from "@vercel/node";

/**
 * Typed API error with HTTP status code and optional error code.
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Centralized error handler for all API endpoints.
 * ApiError instances return their status code and message.
 * Unknown errors return 500 without leaking internal details.
 */
export function handleError(error: unknown, res: VercelResponse) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: error.message,
      ...(error.code && { code: error.code }),
    });
  }

  console.error("Unhandled error:", error);
  return res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}

/**
 * Throws a 404 ApiError if the resource's userId doesn't match the request userId.
 * Returns 404 (not 403) to avoid leaking resource existence to unauthorized users.
 */
export function requireOwnership(
  resourceUserId: string,
  requestUserId: string
): void {
  if (resourceUserId !== requestUserId) {
    throw new ApiError(404, "Not found");
  }
}
