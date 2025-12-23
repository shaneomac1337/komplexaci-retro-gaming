/**
 * ErrorOverlay Component
 *
 * Displays an error overlay when the emulator fails to load or encounters an error.
 * Provides retry and back navigation options.
 */

import { memo } from 'react';
import styles from './ErrorOverlay.module.css';

export interface ErrorOverlayProps {
  /** Error message to display */
  error: string;
  /** Callback when user clicks retry button */
  onRetry?: () => void;
  /** Callback when user clicks back button */
  onBack?: () => void;
}

/**
 * Error icon SVG component
 */
function ErrorIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

/**
 * Retry icon SVG component
 */
function RetryIcon() {
  return (
    <svg
      className={styles.buttonIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="23,4 23,10 17,10" />
      <path d="M20.49,15a9,9,0,1,1-2.12-9.36L23,10" />
    </svg>
  );
}

/**
 * Back arrow icon SVG component
 */
function BackIcon() {
  return (
    <svg
      className={styles.buttonIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12,19 5,12 12,5" />
    </svg>
  );
}

/**
 * Error overlay component with retry and back navigation options.
 * Styled to match the cyberpunk theme with red error accents.
 */
function ErrorOverlayComponent({ error, onRetry, onBack }: ErrorOverlayProps) {
  return (
    <div className={styles.overlay} role="alert" aria-live="assertive">
      <div className={styles.content}>
        {/* Error Icon */}
        <div className={styles.iconContainer}>
          <ErrorIcon />
        </div>

        {/* Error Title */}
        <h2 className={styles.title}>Emulator Error</h2>

        {/* Error Message */}
        <p className={styles.message}>{error}</p>

        {/* Action Buttons */}
        <div className={styles.actions}>
          {onRetry && (
            <button
              type="button"
              className={styles.retryButton}
              onClick={onRetry}
              aria-label="Retry loading the game"
            >
              <RetryIcon />
              <span>Retry</span>
            </button>
          )}
          {onBack && (
            <button
              type="button"
              className={styles.backButton}
              onClick={onBack}
              aria-label="Go back to game browser"
            >
              <BackIcon />
              <span>Back to Browse</span>
            </button>
          )}
        </div>

        {/* Decorative Elements */}
        <div className={styles.glitchLine} aria-hidden="true" />
      </div>
    </div>
  );
}

export const ErrorOverlay = memo(ErrorOverlayComponent);
ErrorOverlay.displayName = 'ErrorOverlay';
