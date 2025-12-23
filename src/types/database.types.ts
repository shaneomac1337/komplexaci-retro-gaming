/**
 * Database Types for Dexie.js IndexedDB Integration
 * Defines models for persistent storage of save states, favorites, sessions, and settings
 */

import type { ConsoleType } from './console.types';
import type { ControlMapping, EmulatorShader } from './emulator.types';

/**
 * Base interface for all database entities
 * Provides common timestamp fields
 */
export interface BaseEntity {
  /** Auto-incremented primary key */
  id?: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Save state stored in IndexedDB
 * Contains the actual emulator state data and optional screenshot
 */
export interface SaveState extends BaseEntity {
  /** Reference to the game this save belongs to */
  gameId: string;
  /** Console type for compatibility validation */
  consoleType: ConsoleType;
  /** Save slot number (0-9 for manual, -1 for auto, -2 for quick) */
  slot: number;
  /** The actual save state data as a Blob */
  data: Blob;
  /** Optional screenshot thumbnail as a Blob */
  screenshot?: Blob;
  /** User-defined label for the save state */
  label?: string;
  /** Size of the save state in bytes */
  sizeBytes: number;
  /** EmulatorJS version used to create this state (for compatibility) */
  emulatorVersion?: string;
}

/**
 * Special save slot constants
 */
export const SAVE_SLOT = {
  /** Auto-save slot identifier */
  AUTO: -1,
  /** Quick-save slot identifier */
  QUICK: -2,
  /** Minimum manual slot number */
  MIN_MANUAL: 0,
  /** Maximum manual slot number */
  MAX_MANUAL: 9,
} as const;

/**
 * Save state creation input (without auto-generated fields)
 */
export type SaveStateInput = Omit<SaveState, 'id' | 'createdAt' | 'updatedAt' | 'sizeBytes'>;

/**
 * Favorite game entry
 * Links to a game and tracks when it was favorited
 */
export interface FavoriteGame {
  /** Auto-incremented primary key */
  id?: number;
  /** Reference to the favorited game */
  gameId: string;
  /** When the game was added to favorites */
  addedAt: Date;
  /** Optional note about why this game is a favorite */
  note?: string;
}

/**
 * Favorite game creation input
 */
export type FavoriteGameInput = Omit<FavoriteGame, 'id' | 'addedAt'>;

/**
 * Play session record for tracking gameplay history
 */
export interface PlaySession {
  /** Auto-incremented primary key */
  id?: number;
  /** Reference to the game played */
  gameId: string;
  /** Console type of the game */
  consoleType: ConsoleType;
  /** When the session started */
  startedAt: Date;
  /** When the session ended (null if still in progress) */
  endedAt?: Date;
  /** Duration of the session in seconds */
  durationSeconds: number;
  /** Whether the session was ended cleanly */
  cleanExit?: boolean;
}

/**
 * Play session creation input
 */
export type PlaySessionInput = Omit<PlaySession, 'id' | 'durationSeconds'>;

/**
 * Aggregated play statistics for a game
 */
export interface GamePlayStats {
  /** Game ID */
  gameId: string;
  /** Total number of play sessions */
  totalSessions: number;
  /** Total play time in seconds */
  totalPlayTimeSeconds: number;
  /** Last played timestamp */
  lastPlayedAt?: Date;
  /** Average session duration in seconds */
  averageSessionSeconds: number;
  /** Longest session duration in seconds */
  longestSessionSeconds: number;
}

/**
 * Virtual gamepad settings
 */
export interface VirtualGamepadSettings {
  /** Enable virtual gamepad on touch devices */
  enabled: boolean;
  /** Opacity of the gamepad overlay (0-1) */
  opacity: number;
  /** Scale factor for the gamepad */
  scale: number;
  /** Left-handed mode */
  leftHanded: boolean;
  /** Vibration feedback on button press */
  vibration: boolean;
}

/**
 * Default virtual gamepad settings
 */
export const DEFAULT_VIRTUAL_GAMEPAD_SETTINGS: VirtualGamepadSettings = {
  enabled: true,
  opacity: 0.7,
  scale: 1.0,
  leftHanded: false,
  vibration: true,
} as const;

/**
 * Display settings for the emulator
 */
export interface DisplaySettings {
  /** Default shader to apply */
  shader: EmulatorShader;
  /** Show FPS counter */
  showFps: boolean;
  /** Maintain aspect ratio */
  maintainAspectRatio: boolean;
  /** Integer scaling */
  integerScaling: boolean;
  /** Start in fullscreen */
  fullscreenOnLoad: boolean;
}

/**
 * Default display settings
 */
export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  shader: '',
  showFps: false,
  maintainAspectRatio: true,
  integerScaling: false,
  fullscreenOnLoad: false,
} as const;

/**
 * User settings stored in IndexedDB
 * Contains all user preferences and configurations
 */
export interface UserSettings {
  /** Primary key (always 1 for singleton pattern) */
  id: number;
  /** Audio volume (0-1) */
  volume: number;
  /** Whether audio is muted */
  isMuted: boolean;
  /** Default save slot for quick save */
  defaultSaveSlot: number;
  /** Virtual gamepad configuration */
  virtualGamepad: VirtualGamepadSettings;
  /** Display settings */
  display: DisplaySettings;
  /** Control mappings per player */
  controlMappings: {
    player1: ControlMapping;
    player2?: ControlMapping;
    player3?: ControlMapping;
    player4?: ControlMapping;
  };
  /** Preferred UI language */
  language: string;
  /** UI theme preference */
  theme: 'light' | 'dark' | 'system';
  /** Enable rewind feature */
  rewindEnabled: boolean;
  /** Fast-forward speed multiplier */
  fastForwardSpeed: number;
  /** Show confirmation dialogs */
  confirmations: {
    /** Confirm before overwriting save states */
    overwriteSave: boolean;
    /** Confirm before exiting game */
    exitGame: boolean;
    /** Confirm before deleting save states */
    deleteSave: boolean;
  };
  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * Default user settings
 */
export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'lastUpdated'> = {
  id: 1,
  volume: 0.7,
  isMuted: false,
  defaultSaveSlot: 0,
  virtualGamepad: DEFAULT_VIRTUAL_GAMEPAD_SETTINGS,
  display: DEFAULT_DISPLAY_SETTINGS,
  controlMappings: {
    player1: {},
  },
  language: 'en-US',
  theme: 'system',
  rewindEnabled: true,
  fastForwardSpeed: 2,
  confirmations: {
    overwriteSave: true,
    exitGame: true,
    deleteSave: true,
  },
} as const;

/**
 * Partial user settings for updates
 */
export type UserSettingsUpdate = Partial<Omit<UserSettings, 'id' | 'lastUpdated'>>;

/**
 * Database schema version info
 */
export interface DatabaseMeta {
  /** Schema version number */
  version: number;
  /** When the database was created */
  createdAt: Date;
  /** When the database was last migrated */
  lastMigration?: Date;
}

/**
 * All table names in the database
 */
export type DatabaseTableName =
  | 'saveStates'
  | 'favoriteGames'
  | 'playSessions'
  | 'userSettings'
  | 'meta';

/**
 * Database statistics
 */
export interface DatabaseStats {
  /** Total number of save states */
  saveStateCount: number;
  /** Total size of save states in bytes */
  saveStateTotalSize: number;
  /** Number of favorite games */
  favoriteCount: number;
  /** Number of play sessions */
  sessionCount: number;
  /** Total play time across all games in seconds */
  totalPlayTime: number;
}
