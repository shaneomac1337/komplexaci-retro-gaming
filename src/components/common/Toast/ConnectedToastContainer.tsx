/**
 * ConnectedToastContainer Component
 *
 * Self-contained toast container that connects to the Zustand UI store.
 * Use this component at the app root level.
 */

import { memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { useUIStore, selectToasts } from '@/stores';
import { Toast } from './Toast';
import styles from './Toast.module.css';

export interface ConnectedToastContainerProps {
  /** Position of the toast container */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const positionStyles: Record<string, string> = {
  'top-right': styles.topRight,
  'top-left': styles.topLeft,
  'bottom-right': styles.bottomRight,
  'bottom-left': styles.bottomLeft,
};

/**
 * ConnectedToastContainer component that automatically connects to the UI store
 * Renders via portal to document.body
 */
export const ConnectedToastContainer = memo(function ConnectedToastContainer({
  position = 'bottom-right',
}: ConnectedToastContainerProps) {
  // Connect to store
  const toasts = useUIStore(selectToasts);
  const removeToast = useUIStore((state) => state.removeToast);

  // Handle dismiss
  const handleDismiss = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  // Don't render if there are no toasts
  if (toasts.length === 0) {
    return null;
  }

  const content = (
    <div
      className={clsx(styles.container, positionStyles[position])}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  );

  // Render via portal
  return createPortal(content, document.body);
});
