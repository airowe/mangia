/**
 * Development Configuration
 *
 * Centralized dev mode settings to avoid duplication across the codebase.
 */

/**
 * When true, bypasses Clerk authentication and uses mock data.
 * This allows testing the app without a backend or auth setup.
 *
 * Set to `__DEV__ && true` to enable in development only.
 * Set to `__DEV__ && false` to disable (use real auth in dev).
 */
export const DEV_BYPASS_AUTH = __DEV__ && true;

/**
 * Mock user ID used when DEV_BYPASS_AUTH is enabled.
 * Keep consistent across mock data and auth bypass.
 */
export const DEV_USER_ID = 'dev-user-123';
