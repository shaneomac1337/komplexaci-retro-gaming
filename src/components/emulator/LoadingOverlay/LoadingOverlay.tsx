/**
 * LoadingOverlay Component
 *
 * Displays a loading overlay with progress bar and status text
 * while the emulator is initializing or loading a game ROM.
 */

import { memo } from 'react';
import styles from './LoadingOverlay.module.css';

export interface LoadingOverlayProps {
  /** Name of the game being loaded */
  gameName: string;
  /** Loading progress percentage (0-100) */
  progress?: number;
  /** Current loading status message */
  status?: string;
}

/**
 * Loading overlay component with cyberpunk-styled progress indicator.
 * Shows game name, progress bar, and status text during emulator initialization.
 */
function LoadingOverlayComponent({
  gameName,
  progress = 0,
  status = 'Loading...',
}: LoadingOverlayProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={styles.overlay}>
      <div
        className={styles.content}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Loading ${gameName}`}
        aria-live="polite"
        aria-busy="true"
      >
        {/* Spinner */}
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}>
            <div className={styles.spinnerInner} />
          </div>
        </div>

        {/* Game Name */}
        <h2 className={styles.gameName}>{gameName}</h2>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${clampedProgress}%` }}
            />
            <div className={styles.progressGlow} style={{ width: `${clampedProgress}%` }} />
          </div>
          <span className={styles.progressText}>{clampedProgress}%</span>
        </div>

        {/* Status Text */}
        <p className={styles.status} aria-live="polite">{status}</p>

        {/* Screen reader announcement */}
        <span className="sr-only">
          Loading {gameName}, {clampedProgress}% complete. {status}
        </span>

        {/* Decorative Elements */}
        <div className={styles.scanlines} aria-hidden="true" />
      </div>
    </div>
  );
}

export const LoadingOverlay = memo(LoadingOverlayComponent);
LoadingOverlay.displayName = 'LoadingOverlay';
