// lib/errors.ts
// Centralized API error handling

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
