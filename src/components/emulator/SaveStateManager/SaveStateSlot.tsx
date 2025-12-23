/**
 * SaveStateSlot Component
 * Individual save slot card displaying screenshot, timestamp, and actions
 */

import { memo, useEffect, useState, useRef, type MouseEvent } from 'react';
import clsx from 'clsx';
import { Icon } from '@/components/common/Icon';
import styles from './SaveStateSlot.module.css';

export interface SaveStateSlotProps {
  /** Slot number (0-9) */
  slot: number;
  /** Whether this slot has saved data */
  hasData: boolean;
  /** Timestamp when the save was created/updated */
  timestamp?: Date;
  /** Screenshot blob for preview */
  screenshot?: Blob;
  /** Whether this slot is currently selected */
  isSelected?: boolean;
  /** Current mode - save or load */
  mode: 'save' | 'load';
  /** Callback when slot is selected */
  onSelect: () => void;
  /** Callback when delete is requested */
  onDelete?: () => void;
  /** Whether the slot is disabled */
  disabled?: boolean;
}

/**
 * Formats a date to a user-friendly string
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  // If less than 24 hours ago, show relative time
  if (diff < oneDay) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours < 1) {
      const minutes = Math.floor(diff / (60 * 1000));
      return minutes < 1 ? 'Just now' : `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }

  // If same year, omit year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Full date with year
  return date.toLocaleDateString(undefined, {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * SaveStateSlot displays an individual save slot with preview and controls
 */
/**
 * Custom hook to manage blob URL lifecycle
 * Creates and revokes object URLs safely
 */
function useBlobUrl(blob: Blob | undefined): string | null {
  // Initialize with a computed value based on the blob
  const [url, setUrl] = useState<string | null>(() => {
    if (!blob) return null;
    return URL.createObjectURL(blob);
  });

  // Track the previous blob to detect changes
  const prevBlobRef = useRef<Blob | undefined>(blob);

  useEffect(() => {
    // Only run when blob actually changes
    if (prevBlobRef.current === blob) {
      return;
    }

    prevBlobRef.current = blob;

    // Clean up old URL if it exists
    if (url) {
      URL.revokeObjectURL(url);
    }

    if (!blob) {
      // Use setTimeout to make the state update async
      setTimeout(() => setUrl(null), 0);
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    setTimeout(() => setUrl(objectUrl), 0);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob, url]);

  // Return null if blob is undefined, even if we still have an old URL
  return blob ? url : null;
}

export const SaveStateSlot = memo(function SaveStateSlot({
  slot,
  hasData,
  timestamp,
  screenshot,
  isSelected = false,
  mode,
  onSelect,
  onDelete,
  disabled = false,
}: SaveStateSlotProps) {
  // Use custom hook for blob URL management
  const screenshotUrl = useBlobUrl(screenshot);

  // Handle delete click - prevent event bubbling
  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete?.();
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };

  // Determine if slot is actionable
  const isLoadDisabled = mode === 'load' && !hasData;
  const isDisabled = disabled || isLoadDisabled;

  return (
    <div
      className={clsx(styles.slot, {
        [styles.selected]: isSelected,
        [styles.empty]: !hasData,
        [styles.disabled]: isDisabled,
        [styles.modeSave]: mode === 'save',
      })}
      onClick={isDisabled ? undefined : onSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={
        hasData
          ? `Slot ${slot}: ${timestamp ? formatTimestamp(timestamp) : 'Saved'}. Press to ${mode}.`
          : `Slot ${slot}: Empty. ${mode === 'save' ? 'Press to save.' : 'No data to load.'}`
      }
      aria-selected={isSelected}
      aria-disabled={isDisabled}
    >
      {/* Slot number badge */}
      <span className={styles.slotBadge} aria-hidden="true">
        {slot}
      </span>

      {/* Delete button (only for slots with data) */}
      {hasData && onDelete && !disabled && (
        <button
          type="button"
          className={styles.deleteButton}
          onClick={handleDeleteClick}
          aria-label={`Delete save from slot ${slot}`}
          tabIndex={0}
        >
          <Icon name="close" size={14} />
        </button>
      )}

      {/* Preview area */}
      <div className={styles.preview}>
        {screenshotUrl ? (
          <img
            src={screenshotUrl}
            alt={`Save state screenshot for slot ${slot}`}
            className={styles.screenshot}
          />
        ) : (
          <div className={styles.placeholder}>
            <Icon
              name={hasData ? 'save' : 'gamepad'}
              size={32}
              className={styles.placeholderIcon}
            />
            {!hasData && <span className={styles.emptyText}>Empty</span>}
          </div>
        )}

        {/* Mode overlay on hover */}
        <div className={styles.modeOverlay} aria-hidden="true">
          <Icon
            name={mode === 'save' ? 'save' : 'load'}
            size={40}
            className={styles.modeIcon}
          />
        </div>
      </div>

      {/* Info footer */}
      <div className={styles.info}>
        <span className={styles.timestamp}>
          {hasData && timestamp ? formatTimestamp(timestamp) : 'No save data'}
        </span>
      </div>
    </div>
  );
});
