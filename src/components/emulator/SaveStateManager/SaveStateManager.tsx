/**
 * SaveStateManager Component
 * Panel/drawer for managing game save states with save/load functionality
 */

import {
  memo,
  useCallback,
  useEffect,
  useState,
  useRef,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { useSaveStates, MAX_SLOTS } from '@/hooks/useSaveStates';
import { Icon } from '@/components/common/Icon';
import { SaveStateSlot } from './SaveStateSlot';
import styles from './SaveStateManager.module.css';

export interface SaveStateManagerProps {
  /** The game ID to manage saves for */
  gameId: string;
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when the panel should close */
  onClose: () => void;
  /** Current mode - save or load */
  mode: 'save' | 'load';
  /** Callback to get current emulator state (for saving) */
  onGetState?: () => Promise<{ data: ArrayBuffer; screenshot?: Blob }>;
  /** Callback when state is loaded */
  onLoadState?: (data: ArrayBuffer) => Promise<void>;
}

interface ConfirmState {
  isOpen: boolean;
  slot: number;
  action: 'overwrite' | 'delete';
}

/**
 * SaveStateManager provides a panel for managing save states
 * Supports keyboard shortcuts and confirmation dialogs
 */
export const SaveStateManager = memo(function SaveStateManager({
  gameId,
  isOpen,
  onClose,
  mode,
  onGetState,
  onLoadState,
}: SaveStateManagerProps) {
  const {
    saveStates,
    isLoading,
    saveState,
    loadState,
    deleteState,
    getSlotInfo,
    // getScreenshotUrl, // Available for future screenshot feature
  } = useSaveStates(gameId);

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({
    isOpen: false,
    slot: -1,
    action: 'overwrite',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Get slot info map
  const slotInfoMap = getSlotInfo();

  /**
   * Handle saving to a slot
   */
  const handleSave = useCallback(
    async (slot: number) => {
      if (!onGetState) return;

      const slotInfo = slotInfoMap.get(slot);

      // If slot has data, show confirmation
      if (slotInfo?.hasData) {
        setConfirm({ isOpen: true, slot, action: 'overwrite' });
        return;
      }

      try {
        setIsProcessing(true);
        const { data, screenshot } = await onGetState();
        await saveState(slot, data, screenshot);
        onClose();
      } catch (error) {
        console.error('Failed to save state:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [onGetState, saveState, slotInfoMap, onClose]
  );

  /**
   * Handle loading from a slot
   */
  const handleLoad = useCallback(
    async (slot: number) => {
      if (!onLoadState) return;

      const slotInfo = slotInfoMap.get(slot);
      if (!slotInfo?.hasData) return;

      try {
        setIsProcessing(true);
        const data = await loadState(slot);
        if (data) {
          await onLoadState(data);
          onClose();
        }
      } catch (error) {
        console.error('Failed to load state:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [onLoadState, loadState, slotInfoMap, onClose]
  );

  /**
   * Handle slot selection
   */
  const handleSlotSelect = useCallback(
    (slot: number) => {
      setSelectedSlot(slot);

      if (mode === 'save') {
        handleSave(slot);
      } else {
        handleLoad(slot);
      }
    },
    [mode, handleSave, handleLoad]
  );

  /**
   * Handle delete request
   */
  const handleDeleteRequest = useCallback((slot: number) => {
    setConfirm({ isOpen: true, slot, action: 'delete' });
  }, []);

  /**
   * Handle confirm action
   */
  const handleConfirm = useCallback(async () => {
    const { slot, action } = confirm;

    try {
      setIsProcessing(true);

      if (action === 'delete') {
        await deleteState(slot);
      } else if (action === 'overwrite' && onGetState) {
        const { data, screenshot } = await onGetState();
        await saveState(slot, data, screenshot);
        onClose();
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setIsProcessing(false);
      setConfirm({ isOpen: false, slot: -1, action: 'overwrite' });
    }
  }, [confirm, deleteState, saveState, onGetState, onClose]);

  /**
   * Cancel confirmation
   */
  const handleCancelConfirm = useCallback(() => {
    setConfirm({ isOpen: false, slot: -1, action: 'overwrite' });
  }, []);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      // Close on Escape
      if (event.key === 'Escape') {
        event.preventDefault();
        if (confirm.isOpen) {
          handleCancelConfirm();
        } else {
          onClose();
        }
        return;
      }

      // Quick slot selection with number keys 0-9
      if (!confirm.isOpen && /^[0-9]$/.test(event.key)) {
        event.preventDefault();
        const slot = parseInt(event.key, 10);
        if (slot < MAX_SLOTS) {
          handleSlotSelect(slot);
        }
      }
    },
    [confirm.isOpen, handleCancelConfirm, onClose, handleSlotSelect]
  );

  /**
   * Handle overlay click
   */
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      requestAnimationFrame(() => {
        panelRef.current?.focus();
      });

      return () => {
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Get screenshot for a slot
  const getScreenshotBlob = (slot: number): Blob | undefined => {
    const state = saveStates.find((s) => s.slot === slot);
    return state?.screenshot;
  };

  const panelContent = (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={panelRef}
        className={clsx(styles.panel, {
          [styles.panelSave]: mode === 'save',
        })}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-state-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.titleWrapper}>
            <Icon
              name={mode === 'save' ? 'save' : 'load'}
              size={24}
              className={styles.titleIcon}
            />
            <h2 id="save-state-title" className={styles.title}>
              {mode === 'save' ? 'Save State' : 'Load State'}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close save state panel"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        {/* Content */}
        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loadingWrapper}>
              <div className={styles.loadingSpinner} aria-label="Loading save states" />
            </div>
          ) : (
            <>
              <div className={styles.slotsGrid} role="listbox" aria-label="Save slots">
                {Array.from({ length: MAX_SLOTS }, (_, slot) => {
                  const info = slotInfoMap.get(slot);
                  return (
                    <SaveStateSlot
                      key={slot}
                      slot={slot}
                      hasData={info?.hasData ?? false}
                      timestamp={info?.date ?? undefined}
                      screenshot={getScreenshotBlob(slot)}
                      isSelected={selectedSlot === slot}
                      mode={mode}
                      onSelect={() => handleSlotSelect(slot)}
                      onDelete={() => handleDeleteRequest(slot)}
                      disabled={isProcessing}
                    />
                  );
                })}
              </div>

              <div className={styles.instructions}>
                <span>Press</span>
                <span className={styles.keyHint}>0-9</span>
                <span>to quick select a slot</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirm.isOpen && (
        <div
          className={styles.confirmOverlay}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
        >
          <div className={styles.confirmDialog}>
            <h3 id="confirm-title" className={styles.confirmTitle}>
              {confirm.action === 'delete' ? 'Delete Save?' : 'Overwrite Save?'}
            </h3>
            <p id="confirm-message" className={styles.confirmMessage}>
              {confirm.action === 'delete'
                ? `Are you sure you want to delete the save in slot ${confirm.slot}? This cannot be undone.`
                : `Slot ${confirm.slot} already has data. Overwrite it with a new save?`}
            </p>
            <div className={styles.confirmButtons}>
              <button
                type="button"
                className={clsx(styles.confirmButton, styles.confirmButtonCancel)}
                onClick={handleCancelConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className={clsx(styles.confirmButton, styles.confirmButtonConfirm)}
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                {confirm.action === 'delete' ? 'Delete' : 'Overwrite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(panelContent, document.body);
});
