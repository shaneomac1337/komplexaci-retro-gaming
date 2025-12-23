/**
 * Toast Hook for Retro Gaming Platform
 *
 * Provides convenient methods for showing toast notifications.
 * Integrates with the Zustand UI store for state management.
 */

import { useCallback } from 'react';
import { useUIStore, selectToasts, selectHasToasts } from '@/stores';
import type { ToastType, Toast } from '@/types';

/**
 * Return type for useToast hook
 */
interface UseToastReturn {
  /** Show a success toast */
  success: (message: string, duration?: number) => string;
  /** Show an error toast */
  error: (message: string, duration?: number) => string;
  /** Show an info toast */
  info: (message: string, duration?: number) => string;
  /** Show a warning toast */
  warning: (message: string, duration?: number) => string;
  /** Dismiss a specific toast by ID */
  dismiss: (id: string) => void;
  /** Dismiss all toasts */
  dismissAll: () => void;
  /** Current list of toasts */
  toasts: Toast[];
  /** Whether there are any active toasts */
  hasToasts: boolean;
}

/**
 * Default toast durations by type (in milliseconds)
 */
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  info: 4000,
  warning: 4000,
};

/**
 * Hook for showing and managing toast notifications.
 * Provides type-specific methods for common toast types.
 *
 * @returns Object with toast methods and current toast state
 *
 * @example
 * ```tsx
 * function GameControls({ gameId }: { gameId: string }) {
 *   const { success, error, info } = useToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveGame(gameId);
 *       success('Game saved successfully!');
 *     } catch (err) {
 *       error('Failed to save game');
 *     }
 *   };
 *
 *   const handleInfo = () => {
 *     info('Press F11 for fullscreen');
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleSave}>Save</button>
 *       <button onClick={handleInfo}>Help</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useToast(): UseToastReturn {
  // Get store actions and state
  const addToast = useUIStore((state) => state.addToast);
  const removeToast = useUIStore((state) => state.removeToast);
  const clearToasts = useUIStore((state) => state.clearToasts);
  const toasts = useUIStore(selectToasts);
  const hasToasts = useUIStore(selectHasToasts);

  /**
   * Create a toast and return its ID for potential dismissal
   */
  const createToast = useCallback(
    (type: ToastType, message: string, duration?: number): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      addToast({
        type,
        message,
        duration: duration ?? DEFAULT_DURATIONS[type],
      });

      return id;
    },
    [addToast]
  );

  /**
   * Show a success toast
   */
  const success = useCallback(
    (message: string, duration?: number): string => {
      return createToast('success', message, duration);
    },
    [createToast]
  );

  /**
   * Show an error toast
   */
  const error = useCallback(
    (message: string, duration?: number): string => {
      return createToast('error', message, duration);
    },
    [createToast]
  );

  /**
   * Show an info toast
   */
  const info = useCallback(
    (message: string, duration?: number): string => {
      return createToast('info', message, duration);
    },
    [createToast]
  );

  /**
   * Show a warning toast
   */
  const warning = useCallback(
    (message: string, duration?: number): string => {
      return createToast('warning', message, duration);
    },
    [createToast]
  );

  /**
   * Dismiss a specific toast
   */
  const dismiss = useCallback(
    (id: string): void => {
      removeToast(id);
    },
    [removeToast]
  );

  /**
   * Dismiss all toasts
   */
  const dismissAll = useCallback((): void => {
    clearToasts();
  }, [clearToasts]);

  return {
    success,
    error,
    info,
    warning,
    dismiss,
    dismissAll,
    toasts,
    hasToasts,
  };
}

/**
 * Extended toast options for more control
 */
interface ToastOptions {
  /** Toast message */
  message: string;
  /** Toast type */
  type?: ToastType;
  /** Duration in milliseconds (0 for persistent) */
  duration?: number;
  /** Toast title */
  title?: string;
  /** Whether the toast can be dismissed by clicking */
  dismissible?: boolean;
  /** Action button configuration */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Hook with more advanced toast options.
 * Use when you need titles, actions, or custom configurations.
 *
 * @returns Object with advanced toast methods
 *
 * @example
 * ```tsx
 * function UndoDelete() {
 *   const { show, toasts } = useAdvancedToast();
 *
 *   const handleDelete = (gameId: string) => {
 *     const backup = games.find(g => g.id === gameId);
 *     deleteGame(gameId);
 *
 *     show({
 *       type: 'info',
 *       title: 'Game Deleted',
 *       message: 'The game has been removed from your library',
 *       duration: 5000,
 *       action: {
 *         label: 'Undo',
 *         onClick: () => restoreGame(backup),
 *       },
 *     });
 *   };
 * }
 * ```
 */
export function useAdvancedToast(): {
  show: (options: ToastOptions) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  toasts: Toast[];
} {
  const addToast = useUIStore((state) => state.addToast);
  const removeToast = useUIStore((state) => state.removeToast);
  const clearToasts = useUIStore((state) => state.clearToasts);
  const toasts = useUIStore(selectToasts);

  const show = useCallback(
    (options: ToastOptions): void => {
      const { message, type = 'info', duration, title, dismissible, action } = options;

      addToast({
        type,
        message,
        title,
        duration: duration ?? DEFAULT_DURATIONS[type],
        dismissible,
        action,
      });
    },
    [addToast]
  );

  return {
    show,
    dismiss: removeToast,
    dismissAll: clearToasts,
    toasts,
  };
}

/**
 * Promise-based toast for async operations.
 * Shows loading, then success or error based on promise result.
 *
 * @returns Function to wrap promises with toast feedback
 *
 * @example
 * ```tsx
 * function SaveButton() {
 *   const toastPromise = useToastPromise();
 *
 *   const handleSave = () => {
 *     toastPromise(saveGame(), {
 *       loading: 'Saving game...',
 *       success: 'Game saved!',
 *       error: 'Failed to save game',
 *     });
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
export function useToastPromise(): <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) => Promise<T> {
  const { info, success, error, dismiss } = useToast();

  return useCallback(
    async <T>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: Error) => string);
      }
    ): Promise<T> => {
      // Show loading toast
      const loadingId = info(messages.loading, 0); // 0 = persistent until dismissed

      try {
        const result = await promise;

        // Dismiss loading and show success
        dismiss(loadingId);
        const successMessage =
          typeof messages.success === 'function'
            ? messages.success(result)
            : messages.success;
        success(successMessage);

        return result;
      } catch (err) {
        // Dismiss loading and show error
        dismiss(loadingId);
        const errorMessage =
          typeof messages.error === 'function'
            ? messages.error(err as Error)
            : messages.error;
        error(errorMessage);

        throw err;
      }
    },
    [info, success, error, dismiss]
  );
}

/**
 * Hook that provides toast methods without subscribing to toast state.
 * Use when you only need to show toasts, not read them.
 * More efficient as it doesn't cause re-renders on toast changes.
 *
 * @example
 * ```tsx
 * function DeepChildComponent() {
 *   const toast = useToastActions();
 *
 *   // This component won't re-render when toasts change
 *   const handleClick = () => {
 *     toast.success('Action completed!');
 *   };
 * }
 * ```
 */
export function useToastActions(): {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
} {
  const addToast = useUIStore((state) => state.addToast);
  const removeToast = useUIStore((state) => state.removeToast);
  const clearToasts = useUIStore((state) => state.clearToasts);

  const showToast = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      addToast({
        type,
        message,
        duration: duration ?? DEFAULT_DURATIONS[type],
      });
    },
    [addToast]
  );

  return {
    success: useCallback(
      (message: string, duration?: number) => showToast('success', message, duration),
      [showToast]
    ),
    error: useCallback(
      (message: string, duration?: number) => showToast('error', message, duration),
      [showToast]
    ),
    info: useCallback(
      (message: string, duration?: number) => showToast('info', message, duration),
      [showToast]
    ),
    warning: useCallback(
      (message: string, duration?: number) => showToast('warning', message, duration),
      [showToast]
    ),
    dismiss: removeToast,
    dismissAll: clearToasts,
  };
}

// Export types
export type { ToastOptions };
