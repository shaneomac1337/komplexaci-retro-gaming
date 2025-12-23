/**
 * Save States Hook for Retro Gaming Platform
 *
 * Provides reactive save state management using Dexie live queries.
 * Handles save/load operations with binary data and screenshots.
 */

import { useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type SaveState } from '@/services/database';

/**
 * Slot information for UI display
 */
interface SlotInfo {
  /** Slot number */
  slot: number;
  /** Whether this slot has saved data */
  hasData: boolean;
  /** Date when the save was created/updated */
  date: Date | null;
  /** Whether this slot has a screenshot */
  hasScreenshot: boolean;
  /** Size of the save data in bytes */
  sizeBytes: number;
}

/**
 * Return type for useSaveStates hook
 */
interface UseSaveStatesReturn {
  /** Array of save states for the game */
  saveStates: SaveState[];
  /** Whether the data is still loading */
  isLoading: boolean;
  /** Save current state to a slot */
  saveState: (slot: number, data: ArrayBuffer, screenshot?: Blob) => Promise<void>;
  /** Load state from a slot */
  loadState: (slot: number) => Promise<ArrayBuffer | null>;
  /** Delete a save state */
  deleteState: (slot: number) => Promise<void>;
  /** Get information about all slots */
  getSlotInfo: () => Map<number, SlotInfo>;
  /** Get info for a specific slot */
  getSlot: (slot: number) => SlotInfo | undefined;
  /** Check if a slot has data */
  hasSlotData: (slot: number) => boolean;
  /** Get screenshot URL for a slot (must be revoked when done) */
  getScreenshotUrl: (slot: number) => string | null;
}

/**
 * Maximum number of save slots per game
 */
const MAX_SLOTS = 10;

/**
 * Hook for managing save states for a specific game.
 * Uses Dexie's useLiveQuery for automatic updates when saves change.
 *
 * @param gameId - The game ID to manage saves for
 * @returns Object with save state data and management functions
 *
 * @example
 * ```tsx
 * function SaveStateManager({ gameId, emulator }: Props) {
 *   const {
 *     saveStates,
 *     isLoading,
 *     saveState,
 *     loadState,
 *     deleteState,
 *     getSlotInfo,
 *   } = useSaveStates(gameId);
 *
 *   const handleSave = async (slot: number) => {
 *     const stateData = await emulator.saveState();
 *     const screenshot = await emulator.captureScreenshot();
 *     await saveState(slot, stateData, screenshot);
 *   };
 *
 *   const handleLoad = async (slot: number) => {
 *     const data = await loadState(slot);
 *     if (data) {
 *       await emulator.loadState(data);
 *     }
 *   };
 *
 *   if (isLoading) return <LoadingSpinner />;
 *
 *   return (
 *     <div className="save-slots">
 *       {Array.from(getSlotInfo().entries()).map(([slot, info]) => (
 *         <SaveSlot
 *           key={slot}
 *           slot={slot}
 *           info={info}
 *           onSave={() => handleSave(slot)}
 *           onLoad={() => handleLoad(slot)}
 *           onDelete={() => deleteState(slot)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSaveStates(gameId: string): UseSaveStatesReturn {
  // Live query for save states
  const saveStatesData = useLiveQuery(
    async () => {
      if (!gameId) return [];
      return await db.getSaveStatesForGame(gameId);
    },
    [gameId],
    []
  );

  const isLoading = saveStatesData === undefined;
  // Memoize to prevent new reference on each render
  const saveStates = useMemo(() => saveStatesData ?? [], [saveStatesData]);

  // Create a map of slot -> save state for quick lookup
  const saveStateMap = useMemo(() => {
    const map = new Map<number, SaveState>();
    for (const state of saveStates) {
      map.set(state.slot, state);
    }
    return map;
  }, [saveStates]);

  /**
   * Save current state to a slot
   */
  const saveState = useCallback(
    async (slot: number, data: ArrayBuffer, screenshot?: Blob): Promise<void> => {
      if (slot < 0 || slot >= MAX_SLOTS) {
        throw new Error(`Invalid slot number: ${slot}. Must be between 0 and ${MAX_SLOTS - 1}`);
      }

      try {
        // Convert ArrayBuffer to Blob for storage
        const dataBlob = new Blob([data], { type: 'application/octet-stream' });
        await db.upsertSaveState(gameId, slot, dataBlob, screenshot);
      } catch (error) {
        console.error('Failed to save state:', error);
        throw error;
      }
    },
    [gameId]
  );

  /**
   * Load state from a slot
   */
  const loadState = useCallback(
    async (slot: number): Promise<ArrayBuffer | null> => {
      try {
        const state = await db.getSaveState(gameId, slot);
        if (!state) {
          return null;
        }

        // Convert Blob back to ArrayBuffer
        return await state.data.arrayBuffer();
      } catch (error) {
        console.error('Failed to load state:', error);
        throw error;
      }
    },
    [gameId]
  );

  /**
   * Delete a save state
   */
  const deleteState = useCallback(
    async (slot: number): Promise<void> => {
      try {
        await db.deleteSaveState(gameId, slot);
      } catch (error) {
        console.error('Failed to delete state:', error);
        throw error;
      }
    },
    [gameId]
  );

  /**
   * Get information about all slots
   */
  const getSlotInfo = useCallback((): Map<number, SlotInfo> => {
    const slots = new Map<number, SlotInfo>();

    for (let slot = 0; slot < MAX_SLOTS; slot++) {
      const state = saveStateMap.get(slot);

      slots.set(slot, {
        slot,
        hasData: Boolean(state),
        date: state?.updatedAt ?? state?.createdAt ?? null,
        hasScreenshot: Boolean(state?.screenshot),
        sizeBytes: state?.data?.size ?? 0,
      });
    }

    return slots;
  }, [saveStateMap]);

  /**
   * Get info for a specific slot
   */
  const getSlot = useCallback(
    (slot: number): SlotInfo | undefined => {
      const state = saveStateMap.get(slot);

      if (slot < 0 || slot >= MAX_SLOTS) {
        return undefined;
      }

      return {
        slot,
        hasData: Boolean(state),
        date: state?.updatedAt ?? state?.createdAt ?? null,
        hasScreenshot: Boolean(state?.screenshot),
        sizeBytes: state?.data?.size ?? 0,
      };
    },
    [saveStateMap]
  );

  /**
   * Check if a slot has data
   */
  const hasSlotData = useCallback(
    (slot: number): boolean => {
      return saveStateMap.has(slot);
    },
    [saveStateMap]
  );

  /**
   * Get screenshot URL for a slot
   * NOTE: The returned URL must be revoked with URL.revokeObjectURL when done
   */
  const getScreenshotUrl = useCallback(
    (slot: number): string | null => {
      const state = saveStateMap.get(slot);
      if (!state?.screenshot) {
        return null;
      }
      return URL.createObjectURL(state.screenshot);
    },
    [saveStateMap]
  );

  return {
    saveStates,
    isLoading,
    saveState,
    loadState,
    deleteState,
    getSlotInfo,
    getSlot,
    hasSlotData,
    getScreenshotUrl,
  };
}

/**
 * Hook for managing a single save slot.
 * More focused API when working with one slot at a time.
 *
 * @param gameId - The game ID
 * @param slot - The slot number
 * @returns Object with slot-specific operations
 *
 * @example
 * ```tsx
 * function QuickSaveSlot({ gameId, emulator }: Props) {
 *   const { hasData, date, save, load, remove, isLoading } = useSaveSlot(gameId, 0);
 *
 *   return (
 *     <div className="quick-save">
 *       {hasData ? (
 *         <>
 *           <p>Last saved: {date?.toLocaleString()}</p>
 *           <button onClick={load}>Load</button>
 *           <button onClick={remove}>Delete</button>
 *         </>
 *       ) : (
 *         <p>No quick save</p>
 *       )}
 *       <button onClick={() => save(emulator.saveState())}>
 *         Quick Save (F5)
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSaveSlot(
  gameId: string,
  slot: number
): {
  hasData: boolean;
  date: Date | null;
  hasScreenshot: boolean;
  screenshotUrl: string | null;
  isLoading: boolean;
  save: (data: ArrayBuffer, screenshot?: Blob) => Promise<void>;
  load: () => Promise<ArrayBuffer | null>;
  remove: () => Promise<void>;
} {
  // Live query for specific slot
  const slotData = useLiveQuery(
    async () => {
      if (!gameId) return null;
      return await db.getSaveState(gameId, slot);
    },
    [gameId, slot],
    null
  );

  const isLoading = slotData === undefined;
  const state = slotData ?? null;

  const save = useCallback(
    async (data: ArrayBuffer, screenshot?: Blob): Promise<void> => {
      const dataBlob = new Blob([data], { type: 'application/octet-stream' });
      await db.upsertSaveState(gameId, slot, dataBlob, screenshot);
    },
    [gameId, slot]
  );

  const load = useCallback(async (): Promise<ArrayBuffer | null> => {
    const savedState = await db.getSaveState(gameId, slot);
    if (!savedState) return null;
    return await savedState.data.arrayBuffer();
  }, [gameId, slot]);

  const remove = useCallback(async (): Promise<void> => {
    await db.deleteSaveState(gameId, slot);
  }, [gameId, slot]);

  // Generate screenshot URL (memoized based on state)
  const screenshot = state?.screenshot;
  const screenshotUrl = useMemo(() => {
    if (!screenshot) return null;
    return URL.createObjectURL(screenshot);
  }, [screenshot]);

  return {
    hasData: Boolean(state),
    date: state?.updatedAt ?? state?.createdAt ?? null,
    hasScreenshot: Boolean(state?.screenshot),
    screenshotUrl,
    isLoading,
    save,
    load,
    remove,
  };
}

/**
 * Hook to get count of save states for a game.
 *
 * @param gameId - The game ID
 * @returns Object with count and loading state
 */
export function useSaveStatesCount(gameId: string): {
  count: number;
  isLoading: boolean;
} {
  const countData = useLiveQuery(
    async () => {
      if (!gameId) return 0;
      const states = await db.getSaveStatesForGame(gameId);
      return states.length;
    },
    [gameId],
    0
  );

  return {
    count: countData ?? 0,
    isLoading: countData === undefined,
  };
}

/**
 * Utility function to format save state size.
 *
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatSaveSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const base = 1024;
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1);
  const value = bytes / Math.pow(base, exponent);

  return `${value.toFixed(exponent > 0 ? 1 : 0)} ${units[exponent]}`;
}

// Export constants
export { MAX_SLOTS };
export type { SlotInfo };
