/**
 * History Service
 * Tracks play sessions and gameplay history using Dexie IndexedDB.
 *
 * @module services/storage/historyService
 */

import { db } from '../database/db';

/**
 * Play statistics summary
 */
interface PlayStats {
  /** Total number of unique games played */
  totalGames: number;
  /** Total play time in seconds */
  totalTime: number;
  /** Total number of play sessions */
  totalSessions: number;
}

/**
 * History and play session tracking service
 */
export const historyService = {
  /**
   * Starts a new play session for a game.
   * Call this when a game is launched.
   *
   * @param gameId - The ID of the game being played
   * @returns The session ID for tracking
   */
  async startSession(gameId: string): Promise<number> {
    try {
      return await db.startPlaySession(gameId);
    } catch (error) {
      console.error('Error starting session:', error);
      throw new Error(`Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Ends an active play session.
   * Call this when a game is exited.
   *
   * @param sessionId - The session ID returned from startSession
   */
  async endSession(sessionId: number): Promise<void> {
    try {
      await db.endPlaySession(sessionId);
    } catch (error) {
      console.error('Error ending session:', error);
      throw new Error(`Failed to end session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Gets recently played game IDs.
   * Returns unique game IDs ordered by most recently played.
   *
   * @param limit - Maximum number of games to return (default: 10)
   * @returns Array of game IDs ordered by most recent play
   */
  async getRecentlyPlayed(limit = 10): Promise<string[]> {
    try {
      return await db.getRecentlyPlayedGames(limit);
    } catch (error) {
      console.error('Error getting recently played:', error);
      return [];
    }
  },

  /**
   * Gets the total play time for a specific game.
   *
   * @param gameId - The ID of the game
   * @returns Total play time in seconds
   */
  async getTotalPlayTime(gameId: string): Promise<number> {
    try {
      return await db.getTotalPlayTime(gameId);
    } catch (error) {
      console.error('Error getting total play time:', error);
      return 0;
    }
  },

  /**
   * Gets overall play statistics.
   *
   * @returns Object containing total games, total time, and total sessions
   */
  async getStats(): Promise<PlayStats> {
    try {
      const stats = await db.getStats();

      // Get unique games count by getting all sessions and counting unique gameIds
      const recentGames = await db.getRecentlyPlayedGames(1000);

      // Calculate total time by getting all sessions
      let totalTime = 0;
      for (const gameId of recentGames) {
        totalTime += await db.getTotalPlayTime(gameId);
      }

      return {
        totalGames: recentGames.length,
        totalTime,
        totalSessions: stats.playSessions,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalGames: 0,
        totalTime: 0,
        totalSessions: 0,
      };
    }
  },

  /**
   * Clears all play history.
   * This removes all play sessions from the database.
   */
  async clearHistory(): Promise<void> {
    try {
      await db.playSessions.clear();
    } catch (error) {
      console.error('Error clearing history:', error);
      throw new Error(`Failed to clear history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Gets the last played date for a specific game.
   *
   * @param gameId - The ID of the game
   * @returns The last played date, or null if never played
   */
  async getLastPlayed(gameId: string): Promise<Date | null> {
    try {
      const sessions = await db.getPlaySessionsForGame(gameId);
      if (sessions.length === 0) {
        return null;
      }

      // Sessions are ordered by startedAt descending
      return sessions[0].startedAt;
    } catch (error) {
      console.error('Error getting last played:', error);
      return null;
    }
  },

  /**
   * Gets the play session count for a specific game.
   *
   * @param gameId - The ID of the game
   * @returns Number of play sessions
   */
  async getSessionCount(gameId: string): Promise<number> {
    try {
      const sessions = await db.getPlaySessionsForGame(gameId);
      return sessions.length;
    } catch (error) {
      console.error('Error getting session count:', error);
      return 0;
    }
  },

  /**
   * Formats play time for display.
   * Converts seconds to a human-readable format.
   *
   * @param seconds - Total seconds played
   * @returns Formatted time string (e.g., "2h 30m", "45m", "30s")
   */
  formatPlayTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.floor(seconds)}s`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
  },

  /**
   * Checks if a game has been played before.
   *
   * @param gameId - The ID of the game
   * @returns True if the game has any play history
   */
  async hasBeenPlayed(gameId: string): Promise<boolean> {
    try {
      const sessions = await db.getPlaySessionsForGame(gameId);
      return sessions.length > 0;
    } catch (error) {
      console.error('Error checking play history:', error);
      return false;
    }
  },

  /**
   * Gets detailed statistics for a specific game.
   *
   * @param gameId - The ID of the game
   * @returns Detailed play statistics for the game
   */
  async getGameStats(gameId: string): Promise<{
    totalPlayTime: number;
    sessionCount: number;
    lastPlayed: Date | null;
    averageSessionTime: number;
  }> {
    try {
      const sessions = await db.getPlaySessionsForGame(gameId);

      if (sessions.length === 0) {
        return {
          totalPlayTime: 0,
          sessionCount: 0,
          lastPlayed: null,
          averageSessionTime: 0,
        };
      }

      const totalPlayTime = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
      const averageSessionTime = totalPlayTime / sessions.length;

      return {
        totalPlayTime,
        sessionCount: sessions.length,
        lastPlayed: sessions[0].startedAt,
        averageSessionTime,
      };
    } catch (error) {
      console.error('Error getting game stats:', error);
      return {
        totalPlayTime: 0,
        sessionCount: 0,
        lastPlayed: null,
        averageSessionTime: 0,
      };
    }
  },
};
