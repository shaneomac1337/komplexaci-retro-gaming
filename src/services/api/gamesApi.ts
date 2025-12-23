/**
 * Games API Service
 * Fetches and caches the games manifest from the server.
 *
 * @module services/api/gamesApi
 */

import type { Game, GamesManifest, ConsoleType } from '@/types';
import { isValidGamesManifest } from '@/types';

/** URL to fetch the games manifest from */
const MANIFEST_URL = '/games.json';

/** LocalStorage key for caching the manifest */
const CACHE_KEY = 'games_manifest';

/** Cache duration in milliseconds (30 minutes) */
const CACHE_DURATION = 1000 * 60 * 30;

/**
 * Cached manifest structure stored in localStorage
 */
interface CachedManifest {
  /** The cached manifest data */
  manifest: GamesManifest;
  /** Timestamp when the cache was created */
  cachedAt: number;
}

/**
 * Games API service for fetching and managing game data
 */
export const gamesApi = {
  /**
   * Fetches the games list from server, utilizing cache when available.
   * First checks localStorage cache, then fetches from server if cache is expired.
   *
   * @returns Promise resolving to array of games
   * @throws Error if fetch fails and no cached data is available
   */
  async fetchGames(): Promise<Game[]> {
    // Check cache first
    const cached = this.getFromCache();
    if (cached) {
      return [...cached.games];
    }

    // Fetch from server
    try {
      const response = await fetch(MANIFEST_URL);

      if (!response.ok) {
        throw new Error(`Failed to fetch games manifest: ${response.status} ${response.statusText}`);
      }

      const data: unknown = await response.json();

      // Validate the response
      if (!isValidGamesManifest(data)) {
        throw new Error('Invalid games manifest format');
      }

      // Cache the result
      this.setCache(data);

      return [...data.games];
    } catch (error) {
      // If fetch fails, try to return stale cache if available
      const staleCache = this.getFromCache(true);
      if (staleCache) {
        console.warn('Using stale cache due to fetch error:', error);
        return [...staleCache.games];
      }

      throw error;
    }
  },

  /**
   * Retrieves the cached games manifest from localStorage.
   *
   * @param ignoreExpiry - If true, returns cache even if expired
   * @returns The cached manifest or null if not available/expired
   */
  getFromCache(ignoreExpiry = false): GamesManifest | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        return null;
      }

      const parsed: CachedManifest = JSON.parse(cached);

      // Check if cache is expired
      if (!ignoreExpiry && Date.now() - parsed.cachedAt > CACHE_DURATION) {
        return null;
      }

      // Validate the cached data
      if (!isValidGamesManifest(parsed.manifest)) {
        this.clearCache();
        return null;
      }

      return parsed.manifest;
    } catch (error) {
      console.error('Error reading games cache:', error);
      this.clearCache();
      return null;
    }
  },

  /**
   * Caches the games manifest to localStorage.
   *
   * @param manifest - The games manifest to cache
   */
  setCache(manifest: GamesManifest): void {
    try {
      const cached: CachedManifest = {
        manifest,
        cachedAt: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch (error) {
      // localStorage might be full or disabled
      console.error('Error caching games manifest:', error);
    }
  },

  /**
   * Clears the games manifest cache from localStorage.
   */
  clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Error clearing games cache:', error);
    }
  },

  /**
   * Retrieves a single game by its ID.
   *
   * @param id - The game ID to look up
   * @returns Promise resolving to the game or null if not found
   */
  async getGameById(id: string): Promise<Game | null> {
    const games = await this.fetchGames();
    return games.find((game) => game.id === id) ?? null;
  },

  /**
   * Retrieves all games for a specific console type.
   *
   * @param console - The console type to filter by
   * @returns Promise resolving to array of games for that console
   */
  async getGamesByConsole(console: ConsoleType): Promise<Game[]> {
    const games = await this.fetchGames();
    return games.filter((game) => game.console === console);
  },

  /**
   * Retrieves the raw games manifest with metadata.
   *
   * @returns Promise resolving to the full games manifest
   */
  async getManifest(): Promise<GamesManifest> {
    // First try to get from cache
    const cached = this.getFromCache();
    if (cached) {
      return cached;
    }

    // Fetch and cache
    await this.fetchGames();
    const manifest = this.getFromCache();

    if (!manifest) {
      throw new Error('Failed to fetch games manifest');
    }

    return manifest;
  },

  /**
   * Forces a refresh of the games cache by clearing it and fetching fresh data.
   *
   * @returns Promise resolving to the fresh games array
   */
  async refreshGames(): Promise<Game[]> {
    this.clearCache();
    return this.fetchGames();
  },

  /**
   * Gets the cache status for debugging/UI purposes.
   *
   * @returns Object with cache status information
   */
  getCacheStatus(): { isCached: boolean; cachedAt: Date | null; isExpired: boolean } {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        return { isCached: false, cachedAt: null, isExpired: false };
      }

      const parsed: CachedManifest = JSON.parse(cached);
      const isExpired = Date.now() - parsed.cachedAt > CACHE_DURATION;

      return {
        isCached: true,
        cachedAt: new Date(parsed.cachedAt),
        isExpired,
      };
    } catch {
      return { isCached: false, cachedAt: null, isExpired: false };
    }
  },
};
