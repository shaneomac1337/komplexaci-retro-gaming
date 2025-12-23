/**
 * LocalStorage Hook for Retro Gaming Platform
 *
 * Provides type-safe localStorage access with JSON serialization,
 * cross-tab synchronization, and SSR safety.
 */

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

/**
 * Type-safe localStorage hook with automatic JSON serialization.
 * Syncs across browser tabs using the storage event.
 *
 * @param key - Storage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns Tuple of [value, setValue, removeValue]
 *
 * @example
 * ```tsx
 * function SettingsPanel() {
 *   const [volume, setVolume, removeVolume] = useLocalStorage('volume', 0.7);
 *   const [favorites, setFavorites] = useLocalStorage<string[]>('favorites', []);
 *
 *   return (
 *     <div>
 *       <input
 *         type="range"
 *         value={volume}
 *         onChange={e => setVolume(parseFloat(e.target.value))}
 *       />
 *       <button onClick={() => removeVolume()}>Reset Volume</button>
 *       <button onClick={() => setFavorites(prev => [...prev, 'game-id'])}>
 *         Add Favorite
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get initial value from localStorage or use provided initial value
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  /**
   * Set value in state and localStorage
   */
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (typeof window === 'undefined') {
        console.warn('Cannot set localStorage in SSR environment');
        return;
      }

      try {
        // Allow value to be a function for functional updates
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Save to state
        setStoredValue(valueToStore);

        // Save to localStorage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        // Dispatch custom event for same-tab updates
        // (storage event only fires in other tabs)
        window.dispatchEvent(
          new StorageEvent('storage', {
            key,
            newValue: JSON.stringify(valueToStore),
            storageArea: window.localStorage,
          })
        );
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  /**
   * Remove value from localStorage
   */
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);

      // Dispatch event for same-tab updates
      window.dispatchEvent(
        new StorageEvent('storage', {
          key,
          newValue: null,
          storageArea: window.localStorage,
        })
      );
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Sync with localStorage changes from other tabs or same tab
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key || event.storageArea !== window.localStorage) {
        return;
      }

      try {
        if (event.newValue === null) {
          setStoredValue(initialValue);
        } else {
          setStoredValue(JSON.parse(event.newValue) as T);
        }
      } catch (error) {
        console.warn(`Error parsing storage event for key "${key}":`, error);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  // Sync on mount in case value changed while component was unmounted
  useEffect(() => {
    setStoredValue(readValue());
  }, [readValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Alternative implementation using useSyncExternalStore for better React 18+ integration.
 * Provides more consistent behavior with concurrent features.
 *
 * @param key - Storage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns Tuple of [value, setValue, removeValue]
 */
export function useLocalStorageSync<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Create stable serialized initial value for comparison
  const serializedInitial = JSON.stringify(initialValue);

  const getSnapshot = useCallback((): string => {
    if (typeof window === 'undefined') {
      return serializedInitial;
    }
    return window.localStorage.getItem(key) ?? serializedInitial;
  }, [key, serializedInitial]);

  const getServerSnapshot = useCallback((): string => {
    return serializedInitial;
  }, [serializedInitial]);

  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === 'undefined') {
        return () => {};
      }

      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === key || event.key === null) {
          callback();
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    },
    [key]
  );

  const rawValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Parse the stored value
  const value = (() => {
    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return initialValue;
    }
  })();

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      if (typeof window === 'undefined') {
        return;
      }

      try {
        const currentValue = (() => {
          try {
            const stored = window.localStorage.getItem(key);
            return stored ? (JSON.parse(stored) as T) : initialValue;
          } catch {
            return initialValue;
          }
        })();

        const valueToStore = newValue instanceof Function ? newValue(currentValue) : newValue;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        // Trigger update
        window.dispatchEvent(
          new StorageEvent('storage', {
            key,
            newValue: JSON.stringify(valueToStore),
            storageArea: window.localStorage,
          })
        );
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, initialValue]
  );

  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(key);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key,
        newValue: null,
        storageArea: window.localStorage,
      })
    );
  }, [key]);

  return [value, setValue, removeValue];
}

/**
 * Simple boolean flag for localStorage with toggle functionality.
 *
 * @param key - Storage key
 * @param initialValue - Initial boolean value (default: false)
 * @returns Tuple of [value, setValue, toggle]
 *
 * @example
 * ```tsx
 * function Settings() {
 *   const [isDarkMode, setDarkMode, toggleDarkMode] = useLocalStorageBoolean('darkMode', false);
 *
 *   return (
 *     <button onClick={toggleDarkMode}>
 *       {isDarkMode ? 'Light Mode' : 'Dark Mode'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useLocalStorageBoolean(
  key: string,
  initialValue: boolean = false
): [boolean, (value: boolean) => void, () => void] {
  const [value, setValue] = useLocalStorage(key, initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, [setValue]);

  return [value, setValue, toggle];
}

/**
 * Object localStorage with partial update support.
 *
 * @param key - Storage key
 * @param initialValue - Initial object value
 * @returns Object with value, update, reset functions
 *
 * @example
 * ```tsx
 * function UserPreferences() {
 *   const { value: prefs, update, reset } = useLocalStorageObject('prefs', {
 *     theme: 'dark',
 *     volume: 0.8,
 *     language: 'en',
 *   });
 *
 *   return (
 *     <div>
 *       <select
 *         value={prefs.theme}
 *         onChange={e => update({ theme: e.target.value })}
 *       >
 *         <option value="light">Light</option>
 *         <option value="dark">Dark</option>
 *       </select>
 *       <button onClick={reset}>Reset All</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLocalStorageObject<T extends Record<string, unknown>>(
  key: string,
  initialValue: T
): {
  value: T;
  setValue: (value: T) => void;
  update: (partial: Partial<T>) => void;
  reset: () => void;
} {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue);

  const update = useCallback(
    (partial: Partial<T>) => {
      setValue((prev) => ({ ...prev, ...partial }));
    },
    [setValue]
  );

  const reset = useCallback(() => {
    removeValue();
  }, [removeValue]);

  return { value, setValue, update, reset };
}

/**
 * Check if localStorage is available.
 * Useful for feature detection.
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__localStorage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hook to check localStorage availability reactively.
 */
export function useLocalStorageAvailable(): boolean {
  // Initialize with computed value to avoid setState in effect
  const [available] = useState(() => isLocalStorageAvailable());

  return available;
}
