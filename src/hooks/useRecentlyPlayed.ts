/**
 * Recently Played Hook for Retro Gaming Platform
 *
 * Provides reactive tracking of recently played games using Dexie live queries.
 * Handles play session recording and automatic duration tracking.
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services/database';
import type { PlaySession } from '@/services/database';

/**
 * Return type for useRecentlyPlayed hook
 */
interface UseRecentlyPlayedReturn {
  /** Array of recently played game IDs (most recent first) */
  recentGameIds: string[];
  /** Whether the data is still loading */
  isLoading: boolean;
  /** Start a new play session and return the session ID */
  recordPlay: (gameId: string) => Promise<number>;
  /** End an active play session */
  endSession: (sessionId: number) => Promise<void>;
  /** Get total play time for a game in seconds */
  getPlayTime: (gameId: string) => Promise<number>;
}

/**
 * Hook for tracking and displaying recently played games.
 * Uses Dexie's useLiveQuery for automatic updates when sessions change.
 *
 * @param limit - Maximum number of recent games to return (default: 10)
 * @returns Object with recent game IDs and session management functions
 *
 * @example
 * ```tsx
 * function RecentGames() {
 *   const { recentGameIds, isLoading } = useRecentlyPlayed(5);
 *
 *   if (isLoading) return <Skeleton count={5} />;
 *
 *   return (
 *     <section>
 *       <h2>Continue Playing</h2>
 *       <GameCarousel gameIds={recentGameIds} />
 *     </section>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function GamePlayer({ game }: { game: Game }) {
 *   const { recordPlay, endSession } = useRecentlyPlayed();
 *   const sessionIdRef = useRef<number | null>(null);
 *
 *   useEffect(() => {
 *     // Start session when game loads
 *     recordPlay(game.id).then(id => {
 *       sessionIdRef.current = id;
 *     });
 *
 *     // End session when component unmounts
 *     return () => {
 *       if (sessionIdRef.current) {
 *         endSession(sessionIdRef.current);
 *       }
 *     };
 *   }, [game.id]);
 *
 *   return <EmulatorView game={game} />;
 * }
 * ```
 */
export function useRecentlyPlayed(limit: number = 10): UseRecentlyPlayedReturn {
  // Live query for recently played games
  const recentData = useLiveQuery(
    async () => {
      return await db.getRecentlyPlayedGames(limit);
    },
    [limit],
    [] // Default empty array while loading
  );

  const isLoading = recentData === undefined;
  const recentGameIds = recentData ?? [];

  /**
   * Record a new play session for a game
   * @returns The session ID for later ending the session
   */
  const recordPlay = useCallback(async (gameId: string): Promise<number> => {
    try {
      return await db.startPlaySession(gameId);
    } catch (error) {
      console.error('Failed to start play session:', error);
      throw error;
    }
  }, []);

  /**
   * End an active play session
   */
  const endSession = useCallback(async (sessionId: number): Promise<void> => {
    try {
      await db.endPlaySession(sessionId);
    } catch (error) {
      console.error('Failed to end play session:', error);
      throw error;
    }
  }, []);

  /**
   * Get total play time for a game
   */
  const getPlayTime = useCallback(async (gameId: string): Promise<number> => {
    try {
      return await db.getTotalPlayTime(gameId);
    } catch (error) {
      console.error('Failed to get play time:', error);
      return 0;
    }
  }, []);

  return {
    recentGameIds,
    isLoading,
    recordPlay,
    endSession,
    getPlayTime,
  };
}

/**
 * Hook for managing an active play session.
 * Automatically starts a session on mount and ends on unmount.
 *
 * @param gameId - The game being played
 * @param options - Configuration options
 * @returns Object with session state and controls
 *
 * @example
 * ```tsx
 * function GameSession({ gameId }: { gameId: string }) {
 *   const { isActive, duration, pause, resume } = usePlaySession(gameId, {
 *     autoStart: true,
 *     onEnd: (duration) => console.log(`Played for ${duration} seconds`),
 *   });
 *
 *   return (
 *     <div>
 *       <p>Playing for: {formatDuration(duration)}</p>
 *       <button onClick={isActive ? pause : resume}>
 *         {isActive ? 'Pause' : 'Resume'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePlaySession(
  gameId: string,
  options: {
    /** Automatically start session on mount (default: true) */
    autoStart?: boolean;
    /** Callback when session ends */
    onEnd?: (durationSeconds: number) => void;
  } = {}
): {
  isActive: boolean;
  sessionId: number | null;
  duration: number;
  start: () => Promise<void>;
  end: () => Promise<void>;
} {
  const { autoStart = true, onEnd } = options;

  // Refs drive the start/end logic synchronously; state mirrors them so
  // consumers re-render when the session starts, ticks or ends.
  const sessionIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onEndRef = useRef(onEnd);
  // Bumped by end(); a start() whose DB write resolves after an end() (e.g.
  // unmount mid-start, or StrictMode's double-mount) closes its own session
  // instead of leaving it open forever.
  const generationRef = useRef(0);

  // Keep callback ref updated
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  const start = useCallback(async () => {
    if (sessionIdRef.current) {
      // Already have an active session
      return;
    }

    const generation = generationRef.current;

    try {
      const id = await db.startPlaySession(gameId);
      if (generation !== generationRef.current) {
        await db.endPlaySession(id);
        return;
      }
      sessionIdRef.current = id;
      startTimeRef.current = new Date();
      setSessionId(id);
      setDuration(0);

      // Start duration update interval
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setDuration(
            Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
          );
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }, [gameId]);

  const end = useCallback(async () => {
    generationRef.current += 1;

    if (!sessionIdRef.current) {
      return;
    }

    try {
      await db.endPlaySession(sessionIdRef.current);

      const duration = startTimeRef.current
        ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
        : 0;

      onEndRef.current?.(duration);
    } catch (error) {
      console.error('Failed to end session:', error);
    } finally {
      sessionIdRef.current = null;
      startTimeRef.current = null;
      setSessionId(null);
      setDuration(0);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, []);

  // Auto start/end session
  useEffect(() => {
    if (autoStart) {
      // start() only sets state after awaiting the DB write — not synchronous.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      start();
    }

    return () => {
      // Always call end(): it also cancels a start() still awaiting the DB.
      end();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoStart, start, end]);

  return {
    isActive: sessionId !== null,
    sessionId,
    duration,
    start,
    end,
  };
}

/**
 * Hook to get play statistics for a specific game.
 *
 * @param gameId - The game ID to get stats for
 * @returns Object with play statistics
 *
 * @example
 * ```tsx
 * function GameStats({ gameId }: { gameId: string }) {
 *   const { totalPlayTime, sessionCount, lastPlayed, isLoading } = useGamePlayStats(gameId);
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <div>
 *       <p>Total Time: {formatDuration(totalPlayTime)}</p>
 *       <p>Sessions: {sessionCount}</p>
 *       <p>Last Played: {lastPlayed?.toLocaleDateString()}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useGamePlayStats(gameId: string): {
  totalPlayTime: number;
  sessionCount: number;
  lastPlayed: Date | null;
  sessions: PlaySession[];
  isLoading: boolean;
} {
  const statsData = useLiveQuery(
    async () => {
      const [sessions, totalPlayTime] = await Promise.all([
        db.getPlaySessionsForGame(gameId),
        db.getTotalPlayTime(gameId),
      ]);

      return {
        sessions,
        totalPlayTime,
        sessionCount: sessions.length,
        lastPlayed: sessions.length > 0 ? sessions[0].startedAt : null,
      };
    },
    [gameId],
    {
      sessions: [],
      totalPlayTime: 0,
      sessionCount: 0,
      lastPlayed: null,
    }
  );

  const isLoading = statsData === undefined;

  return {
    totalPlayTime: statsData?.totalPlayTime ?? 0,
    sessionCount: statsData?.sessionCount ?? 0,
    lastPlayed: statsData?.lastPlayed ?? null,
    sessions: statsData?.sessions ?? [],
    isLoading,
  };
}

/**
 * Utility function to format duration in seconds to human-readable string.
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 *
 * @example
 * ```tsx
 * formatPlayTime(3665) // "1h 1m"
 * formatPlayTime(125)  // "2m"
 * formatPlayTime(45)   // "45s"
 * ```
 */
export function formatPlayTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
}
