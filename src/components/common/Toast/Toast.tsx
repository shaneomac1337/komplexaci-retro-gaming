/**
 * Toast Component
 * Individual toast notification with progress bar and dismiss functionality
 */

import { useEffect, useState, useCallback, memo, type ReactElement } from 'react';
import clsx from 'clsx';
import { Icon } from '../Icon';
import type { Toast as ToastType } from '@/types';
import styles from './Toast.module.css';

export interface ToastProps {
  /** Toast data */
  toast: ToastType;
  /** Callback when toast should be dismissed */
  onDismiss: (id: string) => void;
}

// Icons for each toast type
const typeIcons: Record<ToastType['type'], ReactElement> = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

/**
 * Toast component with auto-dismiss, progress bar, and action button
 */
export const Toast = memo(function Toast({ toast, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const duration = toast.duration ?? 4000;
  const hasDuration = duration > 0;

  // Handle dismiss with exit animation
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 200);
  }, [onDismiss, toast.id]);

  // Auto-dismiss timer with progress
  useEffect(() => {
    if (!hasDuration || isPaused) return;

    const startTime = Date.now();
    const remainingTime = (progress / 100) * duration;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.max(0, ((remainingTime - elapsed) / duration) * 100);
      setProgress(newProgress);

      if (newProgress <= 0) {
        clearInterval(timer);
        handleDismiss();
      }
    }, 16);

    return () => clearInterval(timer);
  }, [hasDuration, duration, isPaused, progress, handleDismiss]);

  // Handle action button click
  const handleActionClick = useCallback(() => {
    toast.action?.onClick();
    handleDismiss();
  }, [toast.action, handleDismiss]);

  return (
    <div
      className={clsx(styles.toast, styles[toast.type], {
        [styles.exiting]: isExiting,
      })}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.toastContent}>
        <span className={styles.icon} aria-hidden="true">
          {typeIcons[toast.type]}
        </span>
        <div className={styles.textContent}>
          {toast.title && <h4 className={styles.title}>{toast.title}</h4>}
          <p className={styles.message}>{toast.message}</p>
          {toast.action && (
            <button
              type="button"
              className={styles.actionButton}
              onClick={handleActionClick}
              aria-label={`${toast.action.label} - ${toast.message}`}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        {(toast.dismissible ?? true) && (
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleDismiss}
            aria-label="Dismiss notification"
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>
      {hasDuration && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${progress}%`,
              transitionDuration: isPaused ? '0ms' : '16ms',
            }}
          />
        </div>
      )}
    </div>
  );
});
