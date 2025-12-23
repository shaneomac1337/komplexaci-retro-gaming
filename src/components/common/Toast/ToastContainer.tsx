/**
 * ToastContainer Component
 * Container for displaying stacked toast notifications
 */

import { memo } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Toast } from './Toast';
import type { Toast as ToastType } from '@/types';
import styles from './Toast.module.css';

export interface ToastContainerProps {
  /** Position of the toast container */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Array of toasts to display */
  toasts: ToastType[];
  /** Callback when a toast should be dismissed */
  onDismiss: (id: string) => void;
}

const positionStyles: Record<ToastContainerProps['position'] & string, string> = {
  'top-right': styles.topRight,
  'top-left': styles.topLeft,
  'bottom-right': styles.bottomRight,
  'bottom-left': styles.bottomLeft,
};

/**
 * ToastContainer component that renders toasts in a fixed position
 * Renders via portal to document.body
 */
export const ToastContainer = memo(function ToastContainer({
  position = 'top-right',
  toasts,
  onDismiss,
}: ToastContainerProps) {
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
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );

  // Render via portal
  return createPortal(content, document.body);
});
