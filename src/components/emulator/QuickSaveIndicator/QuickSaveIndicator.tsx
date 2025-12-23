/**
 * QuickSaveIndicator Component
 * Brief on-screen notification for quick save/load operations
 *
 * Note: The useQuickSaveIndicator hook is in src/hooks/useQuickSaveIndicator.ts
 */

import { memo, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Icon } from '@/components/common/Icon';
import styles from './QuickSaveIndicator.module.css';

export interface QuickSaveIndicatorProps {
  /** Whether the indicator is visible */
  visible: boolean;
  /** Type of operation - save or load */
  type: 'save' | 'load';
  /** Slot number that was saved/loaded (optional) */
  slot?: number;
  /** Duration to show the indicator in ms (default: 2000) */
  duration?: number;
  /** Callback when the indicator finishes hiding */
  onHide?: () => void;
}

/**
 * QuickSaveIndicator shows a brief notification when save/load occurs
 * Auto-fades after the specified duration
 */
export const QuickSaveIndicator = memo(function QuickSaveIndicator({
  visible,
  type,
  slot,
  duration = 2000,
  onHide,
}: QuickSaveIndicatorProps) {
  const [internalState, setInternalState] = useState<{
    isVisible: boolean;
    animationKey: number;
  }>({ isVisible: false, animationKey: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Handle visibility changes - batch state updates to avoid multiple renders
   */
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (visible) {
      // Batch both state changes into one update via setTimeout (async)
      setTimeout(() => {
        setInternalState((prev) => ({
          isVisible: true,
          animationKey: prev.animationKey + 1,
        }));
      }, 0);

      // Auto-hide after duration
      timerRef.current = setTimeout(() => {
        setInternalState((prev) => ({ ...prev, isVisible: false }));
        onHide?.();
      }, duration);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, duration, onHide]);

  // Don't render if not visible
  if (!internalState.isVisible) {
    return null;
  }

  const message = type === 'save' ? 'Saved to' : 'Loaded from';
  const slotText = slot !== undefined ? `Slot ${slot}` : type === 'save' ? 'Quick Save' : 'Quick Load';

  return (
    <div
      key={internalState.animationKey}
      className={clsx(styles.container, styles[type])}
      role="status"
      aria-live="polite"
      aria-label={`${type === 'save' ? 'Saved to' : 'Loaded from'} ${slotText}`}
    >
      <div className={styles.icon}>
        <Icon
          name={type === 'save' ? 'save' : 'load'}
          size={24}
          aria-hidden
        />
      </div>
      <span className={styles.text}>
        {message}{' '}
        <span className={styles.slotNumber}>{slotText}</span>
      </span>

      {/* Progress bar */}
      <div className={styles.progressBar} aria-hidden="true">
        <div className={styles.progressFill} />
      </div>
    </div>
  );
});
