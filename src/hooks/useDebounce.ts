/**
 * Debounce Hooks for Retro Gaming Platform
 *
 * Provides debouncing utilities for values and callbacks.
 * Useful for search inputs, form validation, and API calls.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Debounces a value, returning the debounced version after the specified delay.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 500);
 *
 *   useEffect(() => {
 *     // Only triggers 500ms after user stops typing
 *     performSearch(debouncedSearch);
 *   }, [debouncedSearch]);
 *
 *   return <input value={search} onChange={e => setSearch(e.target.value)} />;
 * }
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout to update debounced value
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timeout on value change or unmount
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Creates a debounced version of a callback function.
 * The returned function will only execute after the specified delay
 * has passed since the last invocation.
 *
 * @param callback - The callback function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns A debounced version of the callback
 *
 * @example
 * ```tsx
 * function SearchForm() {
 *   const handleSearch = useDebouncedCallback((query: string) => {
 *     api.search(query);
 *   }, 500);
 *
 *   return (
 *     <input
 *       onChange={e => handleSearch(e.target.value)}
 *       placeholder="Search games..."
 *     />
 *   );
 * }
 * ```
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set up new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  return debouncedCallback;
}

/**
 * Creates a debounced callback with cancel and flush capabilities.
 * Provides more control over the debounced function.
 *
 * @param callback - The callback function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Object with debounced callback, cancel, and flush functions
 *
 * @example
 * ```tsx
 * function GameSearch() {
 *   const { debounced, cancel, flush } = useDebouncedCallbackWithControls(
 *     (query: string) => searchGames(query),
 *     500
 *   );
 *
 *   const handleSubmit = () => {
 *     flush(); // Execute immediately on form submit
 *   };
 *
 *   const handleCancel = () => {
 *     cancel(); // Cancel pending search
 *   };
 *
 *   return <input onChange={e => debounced(e.target.value)} />;
 * }
 * ```
 */
export function useDebouncedCallbackWithControls<
  T extends (...args: unknown[]) => unknown
>(
  callback: T,
  delay: number = 300
): {
  debounced: T;
  cancel: () => void;
  flush: () => void;
  isPending: () => boolean;
} {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  const pendingArgsRef = useRef<Parameters<T> | null>(null);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingArgsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current && pendingArgsRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      callbackRef.current(...pendingArgsRef.current);
      pendingArgsRef.current = null;
    }
  }, []);

  const isPending = useCallback(() => {
    return timeoutRef.current !== null;
  }, []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      pendingArgsRef.current = args;
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        pendingArgsRef.current = null;
        timeoutRef.current = null;
      }, delay);
    },
    [delay]
  ) as T;

  return { debounced, cancel, flush, isPending };
}
