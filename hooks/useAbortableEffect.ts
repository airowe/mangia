/**
 * useAbortableEffect
 *
 * A hook for running effects with automatic AbortController cleanup.
 * Prevents memory leaks and race conditions when component unmounts
 * or dependencies change before async operations complete.
 */

import { useEffect, DependencyList, useRef } from 'react';

/**
 * Helper to check if an error is an AbortError
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'AbortError' || error.name === 'CanceledError';
  }
  // Axios uses 'CanceledError' or has a code property
  if (typeof error === 'object' && error !== null) {
    const e = error as { code?: string; name?: string };
    return e.code === 'ERR_CANCELED' || e.name === 'CanceledError';
  }
  return false;
}

/**
 * Options for request cancellation
 */
export interface RequestOptions {
  signal?: AbortSignal;
}

/**
 * A hook that runs an async effect with automatic AbortController cleanup.
 *
 * @example
 * ```tsx
 * useAbortableEffect(async (signal) => {
 *   try {
 *     const data = await fetchRecipeById(id, { signal });
 *     if (!signal.aborted) {
 *       setRecipe(data);
 *     }
 *   } catch (err) {
 *     if (!isAbortError(err) && !signal.aborted) {
 *       setError(err);
 *     }
 *   }
 * }, [id]);
 * ```
 */
export function useAbortableEffect(
  effect: (signal: AbortSignal) => void | Promise<void>,
  deps: DependencyList
): void {
  useEffect(() => {
    const abortController = new AbortController();

    // Call the effect with the abort signal
    const maybePromise = effect(abortController.signal);

    // If it returns a promise, we don't need to do anything special
    // The cleanup will abort any pending operations
    if (maybePromise instanceof Promise) {
      maybePromise.catch((err) => {
        // Silently ignore abort errors
        if (!isAbortError(err)) {
          // Re-throw other errors (they'll be caught by error boundaries)
          throw err;
        }
      });
    }

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Creates an AbortController that automatically aborts on cleanup.
 * Useful when you need more control than useAbortableEffect provides.
 *
 * @example
 * ```tsx
 * const getSignal = useAbortSignal();
 *
 * const loadData = async () => {
 *   const signal = getSignal();
 *   const data = await fetchData({ signal });
 *   if (!signal.aborted) {
 *     setData(data);
 *   }
 * };
 * ```
 */
export function useAbortSignal(): () => AbortSignal {
  const controllerRef = useRef<AbortController | null>(null);

  // Abort previous controller on unmount or when called
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return () => {
    // Abort previous request if any
    controllerRef.current?.abort();
    // Create new controller
    controllerRef.current = new AbortController();
    return controllerRef.current.signal;
  };
}

export default useAbortableEffect;
