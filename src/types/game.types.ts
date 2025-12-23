/**
 * Game Types for Retro Gaming Platform
 * Defines game entities, manifests, and filtering options
 */

import type { ConsoleType } from './console.types';

/**
 * Genre categories for retro games
 */
export type GameGenre =
  | 'action'
  | 'adventure'
  | 'rpg'
  | 'platformer'
  | 'puzzle'
  | 'racing'
  | 'shooter'
  | 'sports'
  | 'fighting'
  | 'strategy'
  | 'simulation'
  | 'other';

/**
 * Player count options
 */
export type PlayerCount = 1 | 2 | 3 | 4;

/**
 * Sort field options for game lists
 */
export type GameSortField = 'title' | 'console' | 'releaseYear' | 'genre' | 'lastPlayed' | 'addedAt';

/**
 * Sort order direction
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Represents a single game in the library
 */
export interface Game {
  /** Unique identifier for the game */
  readonly id: string;
  /** Display title of the game */
  readonly title: string;
  /** Console type this game runs on */
  readonly console: ConsoleType;
  /** Path to ROM file relative to public/roms directory */
  readonly romPath: string;
  /** Path to cover art image (optional) */
  readonly coverPath?: string;
  /** Game description or synopsis */
  readonly description?: string;
  /** Original release year */
  readonly releaseYear?: number;
  /** Primary genre */
  readonly genre?: GameGenre;
  /** Number of supported players */
  readonly players?: PlayerCount;
  /** Region code (e.g., 'US', 'EU', 'JP') */
  readonly region?: string;
  /** Developer name */
  readonly developer?: string;
  /** Publisher name */
  readonly publisher?: string;
  /** Tags for additional categorization */
  readonly tags?: readonly string[];
  /** Date when game was added to library */
  readonly addedAt?: string;
}

/**
 * Extended game information including runtime data
 */
export interface GameWithMetadata extends Game {
  /** Last time this game was played */
  lastPlayed?: Date;
  /** Total play time in seconds */
  totalPlayTime?: number;
  /** Whether this game is in favorites */
  isFavorite?: boolean;
  /** Number of save states for this game */
  saveStateCount?: number;
}

/**
 * Manifest file structure for games library
 * This is loaded from a JSON file to populate the game list
 */
export interface GamesManifest {
  /** Schema version for compatibility checking */
  readonly version: string;
  /** ISO timestamp of last update */
  readonly lastUpdated: string;
  /** Array of all games in the library */
  readonly games: readonly Game[];
  /** Optional metadata about the manifest */
  readonly metadata?: {
    /** Total number of games */
    readonly totalGames: number;
    /** Games count per console */
    readonly byConsole: Readonly<Record<ConsoleType, number>>;
    /** Description of this game collection */
    readonly description?: string;
  };
}

/**
 * Filter criteria for game search and filtering
 */
export interface GameFilter {
  /** Filter by specific console */
  console?: ConsoleType;
  /** Search text to match against title */
  search?: string;
  /** Filter by genre */
  genre?: GameGenre;
  /** Filter by player count */
  players?: PlayerCount;
  /** Filter by release year range */
  releaseYearRange?: {
    min?: number;
    max?: number;
  };
  /** Filter by region */
  region?: string;
  /** Show only favorites */
  favoritesOnly?: boolean;
  /** Field to sort by */
  sortBy: GameSortField;
  /** Sort direction */
  sortOrder: SortOrder;
}

/**
 * Default filter configuration
 */
export const DEFAULT_GAME_FILTER: GameFilter = {
  sortBy: 'title',
  sortOrder: 'asc',
} as const;

/**
 * Result of applying filters to game list
 */
export interface FilteredGamesResult {
  /** Filtered and sorted games */
  games: GameWithMetadata[];
  /** Total count before filtering */
  totalCount: number;
  /** Count after filtering */
  filteredCount: number;
  /** Active filters applied */
  activeFilters: Partial<GameFilter>;
}

/**
 * Game search result with relevance scoring
 */
export interface GameSearchResult {
  /** The matching game */
  game: Game;
  /** Search relevance score (0-1) */
  relevance: number;
  /** Matched field(s) */
  matchedFields: readonly ('title' | 'description' | 'tags')[];
}

/**
 * Type guard to check if an object is a valid Game
 */
export function isValidGame(obj: unknown): obj is Game {
  if (typeof obj !== 'object' || obj === null) return false;
  const game = obj as Record<string, unknown>;
  return (
    typeof game.id === 'string' &&
    typeof game.title === 'string' &&
    typeof game.console === 'string' &&
    typeof game.romPath === 'string'
  );
}

/**
 * Type guard to check if an object is a valid GamesManifest
 */
export function isValidGamesManifest(obj: unknown): obj is GamesManifest {
  if (typeof obj !== 'object' || obj === null) return false;
  const manifest = obj as Record<string, unknown>;
  return (
    typeof manifest.version === 'string' &&
    typeof manifest.lastUpdated === 'string' &&
    Array.isArray(manifest.games) &&
    manifest.games.every(isValidGame)
  );
}

/**
 * Create a new Game object with required fields
 */
export function createGame(
  id: string,
  title: string,
  console: ConsoleType,
  romPath: string,
  options?: Partial<Omit<Game, 'id' | 'title' | 'console' | 'romPath'>>
): Game {
  return {
    id,
    title,
    console,
    romPath,
    ...options,
  };
}
