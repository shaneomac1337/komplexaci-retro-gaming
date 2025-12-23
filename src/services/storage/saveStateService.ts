/**
 * Save State Service
 * Manages emulator save states using Dexie IndexedDB.
 *
 * @module services/storage/saveStateService
 */

import { db } from '../database/db';
import type { SaveState } from '../database/models';

/** Maximum number of save slots per game */
const MAX_SLOTS = 10;

/**
 * Slot information for UI display
 */
interface SlotInfo {
  /** Date when the save was created/updated */
  date: Date;
  /** Whether the slot has a screenshot */
  hasScreenshot: boolean;
}

/**
 * Save state management service for emulator states
 */
export const saveStateService = {
  /**
   * Saves an emulator state to a specific slot.
   * Creates a new save or updates an existing one.
   *
   * @param gameId - The ID of the game
   * @param slot - The slot number (0 to MAX_SLOTS-1)
   * @param data - The save state binary data as ArrayBuffer
   * @param screenshot - Optional screenshot blob
   * @throws Error if slot number is invalid
   */
  async saveState(
    gameId: string,
    slot: number,
    data: ArrayBuffer,
    screenshot?: Blob
  ): Promise<void> {
    if (slot < 0 || slot >= MAX_SLOTS) {
      throw new Error(`Invalid slot number: ${slot}. Must be between 0 and ${MAX_SLOTS - 1}`);
    }

    try {
      // Convert ArrayBuffer to Blob for storage
      const dataBlob = new Blob([data], { type: 'application/octet-stream' });

      await db.upsertSaveState(gameId, slot, dataBlob, screenshot);
    } catch (error) {
      console.error('Error saving state:', error);
      throw new Error(`Failed to save state to slot ${slot}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Loads a save state from a specific slot.
   *
   * @param gameId - The ID of the game
   * @param slot - The slot number to load from
   * @returns The save state data as ArrayBuffer, or null if not found
   */
  async loadState(gameId: string, slot: number): Promise<ArrayBuffer | null> {
    try {
      const saveState = await db.getSaveState(gameId, slot);

      if (!saveState) {
        return null;
      }

      // Convert Blob back to ArrayBuffer
      return await saveState.data.arrayBuffer();
    } catch (error) {
      console.error('Error loading state:', error);
      throw new Error(`Failed to load state from slot ${slot}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Gets all save states for a specific game.
   *
   * @param gameId - The ID of the game
   * @returns Array of save states for the game
   */
  async getSaveStates(gameId: string): Promise<SaveState[]> {
    try {
      return await db.getSaveStatesForGame(gameId);
    } catch (error) {
      console.error('Error getting save states:', error);
      throw new Error(`Failed to get save states: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Deletes a save state from a specific slot.
   *
   * @param gameId - The ID of the game
   * @param slot - The slot number to delete
   */
  async deleteSaveState(gameId: string, slot: number): Promise<void> {
    try {
      await db.deleteSaveState(gameId, slot);
    } catch (error) {
      console.error('Error deleting save state:', error);
      throw new Error(`Failed to delete save state from slot ${slot}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Gets slot information for UI display.
   * Returns a map of slot numbers to their info.
   *
   * @param gameId - The ID of the game
   * @returns Map of slot number to slot info
   */
  async getSlotInfo(gameId: string): Promise<Map<number, SlotInfo>> {
    try {
      const saveStates = await db.getSaveStatesForGame(gameId);
      const slotMap = new Map<number, SlotInfo>();

      for (const state of saveStates) {
        slotMap.set(state.slot, {
          date: state.updatedAt,
          hasScreenshot: !!state.screenshot,
        });
      }

      return slotMap;
    } catch (error) {
      console.error('Error getting slot info:', error);
      return new Map();
    }
  },

  /**
   * Gets the most recently updated save state for a game.
   * Useful for "quick load" functionality.
   *
   * @param gameId - The ID of the game
   * @returns The most recent save state, or null if none exist
   */
  async getLatestSaveState(gameId: string): Promise<SaveState | null> {
    try {
      const saveStates = await db.getSaveStatesForGame(gameId);

      if (saveStates.length === 0) {
        return null;
      }

      // Sort by updatedAt descending and return the first one
      saveStates.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      return saveStates[0];
    } catch (error) {
      console.error('Error getting latest save state:', error);
      return null;
    }
  },

  /**
   * Gets a screenshot for a specific save slot.
   *
   * @param gameId - The ID of the game
   * @param slot - The slot number
   * @returns The screenshot blob, or null if not available
   */
  async getScreenshot(gameId: string, slot: number): Promise<Blob | null> {
    try {
      const saveState = await db.getSaveState(gameId, slot);
      return saveState?.screenshot ?? null;
    } catch (error) {
      console.error('Error getting screenshot:', error);
      return null;
    }
  },

  /**
   * Checks if a specific slot has a save state.
   *
   * @param gameId - The ID of the game
   * @param slot - The slot number
   * @returns True if the slot has a save state
   */
  async hasState(gameId: string, slot: number): Promise<boolean> {
    try {
      const saveState = await db.getSaveState(gameId, slot);
      return !!saveState;
    } catch (error) {
      console.error('Error checking save state:', error);
      return false;
    }
  },

  /**
   * Gets the count of save states for a game.
   *
   * @param gameId - The ID of the game
   * @returns Number of save states
   */
  async getSaveStateCount(gameId: string): Promise<number> {
    try {
      const saveStates = await db.getSaveStatesForGame(gameId);
      return saveStates.length;
    } catch (error) {
      console.error('Error getting save state count:', error);
      return 0;
    }
  },

  /**
   * Gets the maximum number of allowed slots.
   *
   * @returns The maximum number of save slots
   */
  getMaxSlots(): number {
    return MAX_SLOTS;
  },

  /**
   * Deletes all save states for a game.
   *
   * @param gameId - The ID of the game
   */
  async deleteAllSaveStates(gameId: string): Promise<void> {
    try {
      const saveStates = await db.getSaveStatesForGame(gameId);

      for (const state of saveStates) {
        await db.deleteSaveState(gameId, state.slot);
      }
    } catch (error) {
      console.error('Error deleting all save states:', error);
      throw new Error(`Failed to delete all save states: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};
