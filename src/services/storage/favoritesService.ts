/**
 * Favorites Service
 * Manages user's favorite games using Dexie IndexedDB.
 *
 * @module services/storage/favoritesService
 */

import { db } from '../database/db';

/**
 * Favorites management service
 */
export const favoritesService = {
  /**
   * Adds a game to the user's favorites.
   * Silently succeeds if the game is already a favorite.
   *
   * @param gameId - The ID of the game to add
   */
  async addFavorite(gameId: string): Promise<void> {
    try {
      await db.addFavorite(gameId);
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw new Error(`Failed to add favorite: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Removes a game from the user's favorites.
   *
   * @param gameId - The ID of the game to remove
   */
  async removeFavorite(gameId: string): Promise<void> {
    try {
      await db.removeFavorite(gameId);
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw new Error(`Failed to remove favorite: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Toggles the favorite status of a game.
   *
   * @param gameId - The ID of the game to toggle
   * @returns True if the game is now a favorite, false if it was removed
   */
  async toggleFavorite(gameId: string): Promise<boolean> {
    try {
      return await db.toggleFavorite(gameId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw new Error(`Failed to toggle favorite: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Checks if a game is in the user's favorites.
   *
   * @param gameId - The ID of the game to check
   * @returns True if the game is a favorite
   */
  async isFavorite(gameId: string): Promise<boolean> {
    try {
      return await db.isFavorite(gameId);
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  },

  /**
   * Gets all favorite game IDs.
   * Returns IDs ordered by most recently added first.
   *
   * @returns Array of game IDs that are favorites
   */
  async getFavoriteIds(): Promise<string[]> {
    try {
      const favorites = await db.getFavorites();
      return favorites.map((fav) => fav.gameId);
    } catch (error) {
      console.error('Error getting favorite IDs:', error);
      return [];
    }
  },

  /**
   * Gets the count of favorite games.
   *
   * @returns Number of favorite games
   */
  async getFavoritesCount(): Promise<number> {
    try {
      const favorites = await db.getFavorites();
      return favorites.length;
    } catch (error) {
      console.error('Error getting favorites count:', error);
      return 0;
    }
  },

  /**
   * Gets the date when a game was added to favorites.
   *
   * @param gameId - The ID of the game
   * @returns The date when the game was added, or null if not a favorite
   */
  async getFavoriteAddedDate(gameId: string): Promise<Date | null> {
    try {
      const favorites = await db.getFavorites();
      const favorite = favorites.find((fav) => fav.gameId === gameId);
      return favorite?.addedAt ?? null;
    } catch (error) {
      console.error('Error getting favorite added date:', error);
      return null;
    }
  },

  /**
   * Checks favorite status for multiple games at once.
   * More efficient than calling isFavorite multiple times.
   *
   * @param gameIds - Array of game IDs to check
   * @returns Map of game ID to favorite status
   */
  async checkFavorites(gameIds: string[]): Promise<Map<string, boolean>> {
    try {
      const favorites = await db.getFavorites();
      const favoriteSet = new Set(favorites.map((fav) => fav.gameId));

      const result = new Map<string, boolean>();
      for (const gameId of gameIds) {
        result.set(gameId, favoriteSet.has(gameId));
      }

      return result;
    } catch (error) {
      console.error('Error checking favorites:', error);
      // Return all false on error
      const result = new Map<string, boolean>();
      for (const gameId of gameIds) {
        result.set(gameId, false);
      }
      return result;
    }
  },

  /**
   * Clears all favorites.
   * Use with caution!
   */
  async clearAllFavorites(): Promise<void> {
    try {
      const favorites = await db.getFavorites();
      for (const favorite of favorites) {
        await db.removeFavorite(favorite.gameId);
      }
    } catch (error) {
      console.error('Error clearing favorites:', error);
      throw new Error(`Failed to clear favorites: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};
