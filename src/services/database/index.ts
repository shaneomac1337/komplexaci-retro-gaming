/**
 * Database Module - Public API
 *
 * This module exports the Dexie database instance and all related types
 * for use throughout the RetroGaming application.
 *
 * Usage:
 * ```typescript
 * import { db, type SaveState, type FavoriteGame } from '@/services/database';
 *
 * // Using db instance methods
 * const saves = await db.getSaveStatesForGame('game-123');
 * const favorites = await db.getFavorites();
 * const recentGames = await db.getRecentlyPlayedGames(10);
 *
 * // Direct table access (for complex queries)
 * const customQuery = await db.saveStates
 *   .where('createdAt')
 *   .above(someDate)
 *   .toArray();
 *
 * // With dexie-react-hooks
 * import { useLiveQuery } from 'dexie-react-hooks';
 *
 * function FavoritesList() {
 *   const favorites = useLiveQuery(() => db.getFavorites());
 *   return <ul>{favorites?.map(f => <li key={f.id}>{f.gameId}</li>)}</ul>;
 * }
 * ```
 */

// Database instance and class
export { db, RetroGamingDB } from './db';

// Type exports
export type {
  SaveState,
  FavoriteGame,
  PlaySession,
  UserSettings,
  NewSaveState,
  NewFavoriteGame,
  NewPlaySession,
} from './models';

// Default settings export
export { DEFAULT_USER_SETTINGS } from './models';
