/**
 * Favorites Hook for Retro Gaming Platform
 *
 * Provides reactive favorites management using Dexie live queries.
 * Automatically updates when favorites change in the database.
 */

import { useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services/database';

/**
 * Return type for useFavorites hook
 */
interface UseFavoritesReturn {
  /** Array of favorite game IDs */
  favorites: string[];
  /** Whether the favorites are still loading */
  isLoading: boolean;
  /** Check if a specific game is in favorites */
  isFavorite: (gameId: string) => boolean;
  /** Toggle favorite status for a game */
  toggleFavorite: (gameId: string) => Promise<boolean>;
  /** Add a game to favorites */
  addFavorite: (gameId: string) => Promise<void>;
  /** Remove a game from favorites */
  removeFavorite: (gameId: string) => Promise<void>;
  /** Total number of favorites */
  count: number;
}

/**
 * Hook for managing user's favorite games with reactive updates.
 * Uses Dexie's useLiveQuery for automatic re-rendering when data changes.
 *
 * @returns Object with favorites data and management functions
 *
 * @example
 * ```tsx
 * function FavoriteButton({ gameId }: { gameId: string }) {
 *   const { isFavorite, toggleFavorite, isLoading } = useFavorites();
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <button
 *       onClick={() => toggleFavorite(gameId)}
 *       className={isFavorite(gameId) ? 'favorited' : ''}
 *     >
 *       {isFavorite(gameId) ? 'Remove from Favorites' : 'Add to Favorites'}
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function FavoritesPage() {
 *   const { favorites, isLoading, count } = useFavorites();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *
 *   return (
 *     <div>
 *       <h1>Favorites ({count})</h1>
 *       <GameGrid gameIds={favorites} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useFavorites(): UseFavoritesReturn {
  // Live query for favorites - automatically updates when data changes
  const favoritesData = useLiveQuery(
    async () => {
      const favorites = await db.getFavorites();
      return favorites.map((f) => f.gameId);
    },
    [], // Dependencies
    [] // Default value while loading
  );

  // Determine loading state (undefined means still loading)
  const isLoading = favoritesData === undefined;

  // Ensure favorites is always an array - memoize to prevent new reference on each render
  const favorites = useMemo(() => favoritesData ?? [], [favoritesData]);

  // Create a Set for O(1) lookup performance
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  /**
   * Check if a game is in favorites
   */
  const isFavorite = useCallback(
    (gameId: string): boolean => {
      return favoritesSet.has(gameId);
    },
    [favoritesSet]
  );

  /**
   * Toggle favorite status for a game
   * @returns New favorite status (true if now favorited)
   */
  const toggleFavorite = useCallback(async (gameId: string): Promise<boolean> => {
    try {
      return await db.toggleFavorite(gameId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }, []);

  /**
   * Add a game to favorites
   */
  const addFavorite = useCallback(async (gameId: string): Promise<void> => {
    try {
      await db.addFavorite(gameId);
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  }, []);

  /**
   * Remove a game from favorites
   */
  const removeFavorite = useCallback(async (gameId: string): Promise<void> => {
    try {
      await db.removeFavorite(gameId);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  }, []);

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    count: favorites.length,
  };
}

/**
 * Hook to check if a single game is favorited.
 * More efficient than useFavorites when you only need to check one game.
 *
 * @param gameId - The game ID to check
 * @returns Object with isFavorite status and toggle function
 *
 * @example
 * ```tsx
 * function GameCard({ game }: { game: Game }) {
 *   const { isFavorite, toggle, isLoading } = useFavoriteStatus(game.id);
 *
 *   return (
 *     <div className="game-card">
 *       <img src={game.coverPath} alt={game.title} />
 *       <button onClick={toggle} disabled={isLoading}>
 *         {isFavorite ? '★' : '☆'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFavoriteStatus(gameId: string): {
  isFavorite: boolean;
  isLoading: boolean;
  toggle: () => Promise<boolean>;
} {
  // Live query for single favorite status
  const favoriteData = useLiveQuery(
    async () => {
      return await db.isFavorite(gameId);
    },
    [gameId],
    false // Default to false while loading
  );

  const isLoading = favoriteData === undefined;
  const isFavorite = favoriteData ?? false;

  const toggle = useCallback(async (): Promise<boolean> => {
    try {
      return await db.toggleFavorite(gameId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }, [gameId]);

  return {
    isFavorite,
    isLoading,
    toggle,
  };
}

/**
 * Hook to get the count of favorites.
 * Useful for displaying badge counts.
 *
 * @returns Object with count and loading state
 *
 * @example
 * ```tsx
 * function NavBar() {
 *   const { count, isLoading } = useFavoritesCount();
 *
 *   return (
 *     <nav>
 *       <Link to="/favorites">
 *         Favorites {!isLoading && count > 0 && <Badge>{count}</Badge>}
 *       </Link>
 *     </nav>
 *   );
 * }
 * ```
 */
export function useFavoritesCount(): {
  count: number;
  isLoading: boolean;
} {
  const countData = useLiveQuery(
    async () => {
      return await db.favorites.count();
    },
    [],
    0
  );

  return {
    count: countData ?? 0,
    isLoading: countData === undefined,
  };
}

/**
 * Hook for bulk favorite operations.
 * Useful for selecting multiple games to favorite at once.
 *
 * @returns Object with bulk operation functions
 *
 * @example
 * ```tsx
 * function GameSelectionToolbar({ selectedIds }: { selectedIds: string[] }) {
 *   const { addMany, removeMany, isProcessing } = useBulkFavorites();
 *
 *   return (
 *     <div className="toolbar">
 *       <button
 *         onClick={() => addMany(selectedIds)}
 *         disabled={isProcessing}
 *       >
 *         Add All to Favorites
 *       </button>
 *       <button
 *         onClick={() => removeMany(selectedIds)}
 *         disabled={isProcessing}
 *       >
 *         Remove All from Favorites
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBulkFavorites(): {
  addMany: (gameIds: string[]) => Promise<void>;
  removeMany: (gameIds: string[]) => Promise<void>;
  isProcessing: boolean;
} {
  // Note: For a production app, you'd want to track processing state
  // This is a simplified implementation

  const addMany = useCallback(async (gameIds: string[]): Promise<void> => {
    try {
      await db.transaction('rw', db.favorites, async () => {
        for (const gameId of gameIds) {
          await db.addFavorite(gameId);
        }
      });
    } catch (error) {
      console.error('Failed to add favorites:', error);
      throw error;
    }
  }, []);

  const removeMany = useCallback(async (gameIds: string[]): Promise<void> => {
    try {
      await db.transaction('rw', db.favorites, async () => {
        for (const gameId of gameIds) {
          await db.removeFavorite(gameId);
        }
      });
    } catch (error) {
      console.error('Failed to remove favorites:', error);
      throw error;
    }
  }, []);

  return {
    addMany,
    removeMany,
    isProcessing: false, // Simplified - would need state tracking for real implementation
  };
}
