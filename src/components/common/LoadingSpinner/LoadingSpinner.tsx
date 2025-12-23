/**
 * LoadingSpinner Component
 * Neon-styled loading spinner with optional text and fullscreen mode
 */

import { memo } from 'react';
import clsx from 'clsx';
import styles from './LoadingSpinner.module.css';

export interface LoadingSpinnerProps {
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg';
  /** Spinner color */
  color?: 'cyan' | 'magenta' | 'white';
  /** Display in fullscreen overlay mode */
  fullScreen?: boolean;
  /** Optional loading text */
  text?: string;
  /** Additional class name */
  className?: string;
}

/**
 * LoadingSpinner component with neon glow effects
 * Can be used inline or as a fullscreen overlay
 */
export const LoadingSpinner = memo(function LoadingSpinner({
  size = 'md',
  color = 'cyan',
  fullScreen = false,
  text,
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={clsx(
        styles.container,
        {
          [styles.fullScreen]: fullScreen,
        },
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={clsx(styles.spinner, styles[size], styles[color])}
        aria-hidden="true"
      />
      {text && <span className={styles.text}>{text}</span>}
      <span className="sr-only">{text || 'Loading...'}</span>
    </div>
  );
});
