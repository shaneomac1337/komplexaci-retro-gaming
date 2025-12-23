/**
 * Database Models for RetroGaming IndexedDB
 *
 * These interfaces define the structure of data stored in IndexedDB via Dexie.
 * All tables use auto-incrementing primary keys (id) except UserSettings which
 * uses a string key for singleton pattern.
 */

/**
 * Save state for emulator games.
 * Stores binary save data and optional screenshot per game slot.
 *
 * Query patterns:
 * - Get all saves for a game: db.saveStates.where('gameId').equals(gameId)
 * - Get specific slot: db.saveStates.where('[gameId+slot]').equals([gameId, slot])
 * - Get recent saves: db.saveStates.orderBy('createdAt').reverse()
 */
export interface SaveState {
  /** Auto-incremented primary key */
  id?: number;
  /** Reference to the game identifier */
  gameId: string;
  /** Save slot number (0-9 slots per game) */
  slot: number;
  /** Binary save state data from emulator */
  data: Blob;
  /** Optional screenshot captured at save time */
  screenshot?: Blob;
  /** Timestamp when save was first created */
  createdAt: Date;
  /** Timestamp when save was last updated */
  updatedAt: Date;
}

/**
 * User's favorite games for quick access.
 * Uses unique constraint on gameId to prevent duplicate favorites.
 *
 * Query patterns:
 * - Get all favorites: db.favorites.orderBy('addedAt').reverse()
 * - Check if favorited: db.favorites.where('gameId').equals(gameId).first()
 * - Get favorites count: db.favorites.count()
 */
export interface FavoriteGame {
  /** Auto-incremented primary key */
  id?: number;
  /** Unique game identifier (unique constraint prevents duplicates) */
  gameId: string;
  /** Timestamp when game was added to favorites */
  addedAt: Date;
}

/**
 * Play session tracking for analytics and "recently played" features.
 * Each session represents a continuous play period for a game.
 *
 * Query patterns:
 * - Recently played: db.playSessions.orderBy('startedAt').reverse().limit(10)
 * - Total playtime for game: db.playSessions.where('gameId').equals(gameId)
 * - Sessions in date range: db.playSessions.where('startedAt').between(start, end)
 */
export interface PlaySession {
  /** Auto-incremented primary key */
  id?: number;
  /** Reference to the game identifier */
  gameId: string;
  /** Timestamp when session started */
  startedAt: Date;
  /** Timestamp when session ended (undefined if still playing) */
  endedAt?: Date;
  /** Total duration of session in seconds */
  durationSeconds: number;
}

/**
 * User preferences and settings.
 * Uses singleton pattern with fixed id='default' for single settings record.
 *
 * Query patterns:
 * - Get settings: db.settings.get('default')
 * - Update settings: db.settings.put({ id: 'default', ... })
 */
export interface UserSettings {
  /** Fixed identifier, always 'default' for singleton pattern */
  id: string;
  /** Master volume level (0.0 to 1.0) */
  volume: number;
  /** Default save slot to use (0-9) */
  defaultSaveSlot: number;
  /** Whether to show virtual gamepad on touch devices */
  showVirtualGamepad: boolean;
  /** Custom control mappings keyed by action name */
  controlMappings: Record<string, unknown>;
  /** Timestamp of last settings update */
  lastUpdated: Date;
}

/**
 * Type helper for creating new SaveState (without id)
 */
export type NewSaveState = Omit<SaveState, 'id'>;

/**
 * Type helper for creating new FavoriteGame (without id)
 */
export type NewFavoriteGame = Omit<FavoriteGame, 'id'>;

/**
 * Type helper for creating new PlaySession (without id)
 */
export type NewPlaySession = Omit<PlaySession, 'id'>;

/**
 * Default user settings configuration
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  id: 'default',
  volume: 0.7,
  defaultSaveSlot: 0,
  showVirtualGamepad: true,
  controlMappings: {},
  lastUpdated: new Date(),
};
