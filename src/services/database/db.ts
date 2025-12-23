/**
 * Dexie Database Instance for RetroGaming
 *
 * IndexedDB wrapper using Dexie v4 for offline-first game data storage.
 * Handles save states, favorites, play sessions, and user settings.
 */

import Dexie, { type Table } from 'dexie';
import type {
  SaveState,
  FavoriteGame,
  PlaySession,
  UserSettings,
} from './models';
import { DEFAULT_USER_SETTINGS } from './models';

/**
 * RetroGaming Database Schema
 *
 * Index notation (Dexie v4):
 * - ++id    : Auto-incrementing primary key
 * - &field  : Unique index (prevents duplicates)
 * - [a+b]   : Compound index for multi-field queries
 * - field   : Regular index for fast lookups
 *
 * Only indexed fields are listed in the schema definition.
 * Non-indexed fields (data, screenshot, etc.) are still stored but not queryable.
 */
export class RetroGamingDB extends Dexie {
  /**
   * Save states table - stores emulator save data per game/slot
   *
   * Indexes:
   * - ++id: Auto-increment primary key
   * - gameId: Query all saves for a specific game
   * - slot: Query by slot number
   * - [gameId+slot]: Compound index for unique game+slot lookup
   * - createdAt: Sort by creation date
   * - updatedAt: Sort by last update
   */
  saveStates!: Table<SaveState, number>;

  /**
   * Favorites table - user's favorited games
   *
   * Indexes:
   * - ++id: Auto-increment primary key
   * - &gameId: Unique index prevents duplicate favorites
   * - addedAt: Sort by date added
   */
  favorites!: Table<FavoriteGame, number>;

  /**
   * Play sessions table - tracks game play history
   *
   * Indexes:
   * - ++id: Auto-increment primary key
   * - gameId: Query sessions for specific game
   * - startedAt: Sort by session start time
   * - [gameId+startedAt]: Compound for game history ordered by time
   */
  playSessions!: Table<PlaySession, number>;

  /**
   * Settings table - user preferences (singleton)
   *
   * Indexes:
   * - id: String primary key (always 'default')
   */
  settings!: Table<UserSettings, string>;

  constructor() {
    super('RetroGamingDB');

    // Version 1: Initial schema
    this.version(1).stores({
      // Save states with compound index for game+slot queries
      saveStates: '++id, gameId, slot, [gameId+slot], createdAt, updatedAt',

      // Favorites with unique constraint on gameId
      favorites: '++id, &gameId, addedAt',

      // Play sessions with compound index for game history
      playSessions: '++id, gameId, startedAt, [gameId+startedAt]',

      // Settings uses string key for singleton pattern
      settings: 'id',
    });

    // Hook to initialize default settings on database creation
    this.on('populate', () => {
      this.settings.add(DEFAULT_USER_SETTINGS);
    });
  }

  // ============================================================================
  // SAVE STATE OPERATIONS
  // ============================================================================

  /**
   * Get all save states for a specific game
   * @param gameId - The game identifier
   * @returns Promise<SaveState[]> - All save states for the game
   */
  async getSaveStatesForGame(gameId: string): Promise<SaveState[]> {
    return this.saveStates.where('gameId').equals(gameId).toArray();
  }

  /**
   * Get a specific save state by game and slot
   * @param gameId - The game identifier
   * @param slot - The slot number (0-9)
   * @returns Promise<SaveState | undefined>
   */
  async getSaveState(gameId: string, slot: number): Promise<SaveState | undefined> {
    return this.saveStates.where('[gameId+slot]').equals([gameId, slot]).first();
  }

  /**
   * Create or update a save state
   * Uses compound index to find existing save for game+slot
   * @param gameId - The game identifier
   * @param slot - The slot number (0-9)
   * @param data - The save state binary data
   * @param screenshot - Optional screenshot blob
   * @returns Promise<number> - The save state id
   */
  async upsertSaveState(
    gameId: string,
    slot: number,
    data: Blob,
    screenshot?: Blob
  ): Promise<number> {
    const existing = await this.getSaveState(gameId, slot);
    const now = new Date();

    if (existing?.id) {
      await this.saveStates.update(existing.id, {
        data,
        screenshot,
        updatedAt: now,
      });
      return existing.id;
    }

    return this.saveStates.add({
      gameId,
      slot,
      data,
      screenshot,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Delete a save state by game and slot
   * @param gameId - The game identifier
   * @param slot - The slot number
   * @returns Promise<number> - Number of deleted records
   */
  async deleteSaveState(gameId: string, slot: number): Promise<number> {
    return this.saveStates.where('[gameId+slot]').equals([gameId, slot]).delete();
  }

  // ============================================================================
  // FAVORITES OPERATIONS
  // ============================================================================

  /**
   * Get all favorite games ordered by most recently added
   * @returns Promise<FavoriteGame[]>
   */
  async getFavorites(): Promise<FavoriteGame[]> {
    return this.favorites.orderBy('addedAt').reverse().toArray();
  }

  /**
   * Check if a game is in favorites
   * @param gameId - The game identifier
   * @returns Promise<boolean>
   */
  async isFavorite(gameId: string): Promise<boolean> {
    const favorite = await this.favorites.where('gameId').equals(gameId).first();
    return !!favorite;
  }

  /**
   * Add a game to favorites
   * Silently succeeds if already favorited (unique constraint)
   * @param gameId - The game identifier
   * @returns Promise<number | void> - The favorite id or void if already exists
   */
  async addFavorite(gameId: string): Promise<number | void> {
    try {
      return await this.favorites.add({
        gameId,
        addedAt: new Date(),
      });
    } catch (error) {
      // ConstraintError means it already exists, which is fine
      if ((error as Error).name === 'ConstraintError') {
        return;
      }
      throw error;
    }
  }

  /**
   * Remove a game from favorites
   * @param gameId - The game identifier
   * @returns Promise<number> - Number of deleted records
   */
  async removeFavorite(gameId: string): Promise<number> {
    return this.favorites.where('gameId').equals(gameId).delete();
  }

  /**
   * Toggle favorite status for a game
   * @param gameId - The game identifier
   * @returns Promise<boolean> - New favorite status (true if now favorited)
   */
  async toggleFavorite(gameId: string): Promise<boolean> {
    const isFav = await this.isFavorite(gameId);
    if (isFav) {
      await this.removeFavorite(gameId);
      return false;
    }
    await this.addFavorite(gameId);
    return true;
  }

  // ============================================================================
  // PLAY SESSION OPERATIONS
  // ============================================================================

  /**
   * Start a new play session
   * @param gameId - The game identifier
   * @returns Promise<number> - The session id
   */
  async startPlaySession(gameId: string): Promise<number> {
    return this.playSessions.add({
      gameId,
      startedAt: new Date(),
      durationSeconds: 0,
    });
  }

  /**
   * End an active play session
   * @param sessionId - The session id
   * @returns Promise<void>
   */
  async endPlaySession(sessionId: number): Promise<void> {
    const session = await this.playSessions.get(sessionId);
    if (!session) return;

    const endedAt = new Date();
    const durationSeconds = Math.floor(
      (endedAt.getTime() - session.startedAt.getTime()) / 1000
    );

    await this.playSessions.update(sessionId, {
      endedAt,
      durationSeconds,
    });
  }

  /**
   * Get recently played games (last 10 unique games)
   * @param limit - Maximum number of games to return (default 10)
   * @returns Promise<string[]> - Array of unique gameIds ordered by most recent
   */
  async getRecentlyPlayedGames(limit = 10): Promise<string[]> {
    const sessions = await this.playSessions
      .orderBy('startedAt')
      .reverse()
      .toArray();

    // Extract unique gameIds preserving order
    const seen = new Set<string>();
    const uniqueGameIds: string[] = [];

    for (const session of sessions) {
      if (!seen.has(session.gameId)) {
        seen.add(session.gameId);
        uniqueGameIds.push(session.gameId);
        if (uniqueGameIds.length >= limit) break;
      }
    }

    return uniqueGameIds;
  }

  /**
   * Get total play time for a specific game
   * @param gameId - The game identifier
   * @returns Promise<number> - Total seconds played
   */
  async getTotalPlayTime(gameId: string): Promise<number> {
    const sessions = await this.playSessions
      .where('gameId')
      .equals(gameId)
      .toArray();

    return sessions.reduce((total, session) => total + session.durationSeconds, 0);
  }

  /**
   * Get play sessions for a specific game
   * @param gameId - The game identifier
   * @returns Promise<PlaySession[]> - Sessions ordered by start time (newest first)
   */
  async getPlaySessionsForGame(gameId: string): Promise<PlaySession[]> {
    return this.playSessions
      .where('[gameId+startedAt]')
      .between([gameId, Dexie.minKey], [gameId, Dexie.maxKey])
      .reverse()
      .toArray();
  }

  // ============================================================================
  // SETTINGS OPERATIONS
  // ============================================================================

  /**
   * Get user settings (creates default if not exists)
   * @returns Promise<UserSettings>
   */
  async getSettings(): Promise<UserSettings> {
    const settings = await this.settings.get('default');
    if (!settings) {
      await this.settings.add(DEFAULT_USER_SETTINGS);
      return DEFAULT_USER_SETTINGS;
    }
    return settings;
  }

  /**
   * Update user settings (partial update)
   * @param updates - Partial settings to update
   * @returns Promise<void>
   */
  async updateSettings(updates: Partial<Omit<UserSettings, 'id'>>): Promise<void> {
    await this.settings.update('default', {
      ...updates,
      lastUpdated: new Date(),
    });
  }

  /**
   * Reset settings to defaults
   * @returns Promise<void>
   */
  async resetSettings(): Promise<void> {
    await this.settings.put({
      ...DEFAULT_USER_SETTINGS,
      lastUpdated: new Date(),
    });
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  /**
   * Clear all data from the database (for testing/reset)
   * @returns Promise<void>
   */
  async clearAllData(): Promise<void> {
    await Promise.all([
      this.saveStates.clear(),
      this.favorites.clear(),
      this.playSessions.clear(),
      this.settings.clear(),
    ]);
    // Re-initialize default settings
    await this.settings.add(DEFAULT_USER_SETTINGS);
  }

  /**
   * Get database statistics
   * @returns Promise<object> - Counts for each table
   */
  async getStats(): Promise<{
    saveStates: number;
    favorites: number;
    playSessions: number;
  }> {
    const [saveStates, favorites, playSessions] = await Promise.all([
      this.saveStates.count(),
      this.favorites.count(),
      this.playSessions.count(),
    ]);

    return { saveStates, favorites, playSessions };
  }
}

/**
 * Singleton database instance
 * Use this throughout the application for all database operations
 */
export const db = new RetroGamingDB();
