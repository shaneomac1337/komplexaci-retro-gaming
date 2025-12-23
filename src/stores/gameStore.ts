/**
 * Game Store - Zustand v5
 * Manages game data, filtering, sorting, and view preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Game,
  ConsoleType,
  GameSortField,
  SortOrder,
  ViewMode,
  GamesManifest,
} from '../types';

// CDN Base URL from environment
const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || '';

// =============================================================================
// Types
// =============================================================================

interface GameStoreState {
  // Data
  games: Game[];
  isLoading: boolean;
  error: string | null;

  // Filters
  selectedConsole: ConsoleType | null;
  searchQuery: string;
  sortBy: GameSortField;
  sortOrder: SortOrder;
  viewMode: ViewMode;

  // Actions
  fetchGames: () => Promise<void>;
  setGames: (games: Game[]) => void;
  setSelectedConsole: (console: ConsoleType | null) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: GameSortField) => void;
  setSortOrder: (order: SortOrder) => void;
  setViewMode: (mode: ViewMode) => void;
  resetFilters: () => void;

  // Computed (implemented as methods for direct access)
  getFilteredGames: () => Game[];
  getGameById: (id: string) => Game | undefined;
}

// =============================================================================
// Default Values
// =============================================================================

const DEFAULT_SORT_BY: GameSortField = 'title';
const DEFAULT_SORT_ORDER: SortOrder = 'asc';
const DEFAULT_VIEW_MODE: ViewMode = 'grid';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Filter games based on console and search query
 */
function filterGames(
  games: Game[],
  selectedConsole: ConsoleType | null,
  searchQuery: string
): Game[] {
  return games.filter((game) => {
    // Filter by console
    if (selectedConsole && game.console !== selectedConsole) {
      return false;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const titleMatch = game.title.toLowerCase().includes(query);
      const descriptionMatch = game.description?.toLowerCase().includes(query);
      const developerMatch = game.developer?.toLowerCase().includes(query);
      const publisherMatch = game.publisher?.toLowerCase().includes(query);
      const tagsMatch = game.tags?.some((tag) =>
        tag.toLowerCase().includes(query)
      );

      if (
        !titleMatch &&
        !descriptionMatch &&
        !developerMatch &&
        !publisherMatch &&
        !tagsMatch
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort games by field and order
 */
function sortGames(
  games: Game[],
  sortBy: GameSortField,
  sortOrder: SortOrder
): Game[] {
  const sorted = [...games].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;

      case 'console':
        comparison = a.console.localeCompare(b.console);
        // Secondary sort by title when console is the same
        if (comparison === 0) {
          comparison = a.title.localeCompare(b.title);
        }
        break;

      case 'releaseYear': {
        const yearA = a.releaseYear ?? 0;
        const yearB = b.releaseYear ?? 0;
        comparison = yearA - yearB;
        break;
      }

      case 'genre': {
        const genreA = a.genre ?? 'zzz'; // Sort games without genre to end
        const genreB = b.genre ?? 'zzz';
        comparison = genreA.localeCompare(genreB);
        break;
      }

      case 'lastPlayed':
        // This would need additional metadata tracking
        // For now, fall back to title
        comparison = a.title.localeCompare(b.title);
        break;

      case 'addedAt': {
        const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
        const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
        comparison = dateA - dateB;
        break;
      }

      default:
        comparison = a.title.localeCompare(b.title);
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

// =============================================================================
// Store Definition
// =============================================================================

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      // Initial State
      games: [],
      isLoading: false,
      error: null,
      selectedConsole: null,
      searchQuery: '',
      sortBy: DEFAULT_SORT_BY,
      sortOrder: DEFAULT_SORT_ORDER,
      viewMode: DEFAULT_VIEW_MODE,

      // Actions
      fetchGames: async () => {
        set({ isLoading: true, error: null });

        try {
          // Fetch from CDN if configured, otherwise local
          const gamesUrl = CDN_BASE_URL
            ? `${CDN_BASE_URL}/games.json`
            : '/games.json';

          const response = await fetch(gamesUrl);

          if (!response.ok) {
            throw new Error(`Failed to fetch games: ${response.statusText}`);
          }

          const data: GamesManifest = await response.json();

          // Handle both array and manifest formats
          const rawGames = Array.isArray(data) ? data : data.games;

          // Prepend CDN base URL to relative paths
          const games = rawGames.map((game) => ({
            ...game,
            romPath: CDN_BASE_URL && !game.romPath.startsWith('http')
              ? `${CDN_BASE_URL}/${game.romPath}`
              : game.romPath,
            coverPath: CDN_BASE_URL && game.coverPath && !game.coverPath.startsWith('http')
              ? `${CDN_BASE_URL}/${game.coverPath}`
              : game.coverPath,
          }));

          set({
            games: games as Game[],
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to load games';

          set({
            isLoading: false,
            error: errorMessage,
          });

          console.error('Error fetching games:', error);
        }
      },

      setGames: (games: Game[]) => {
        set({ games });
      },

      setSelectedConsole: (selectedConsole: ConsoleType | null) => {
        set({ selectedConsole });
      },

      setSearchQuery: (searchQuery: string) => {
        set({ searchQuery });
      },

      setSortBy: (sortBy: GameSortField) => {
        set({ sortBy });
      },

      setSortOrder: (sortOrder: SortOrder) => {
        set({ sortOrder });
      },

      setViewMode: (viewMode: ViewMode) => {
        set({ viewMode });
      },

      resetFilters: () => {
        set({
          selectedConsole: null,
          searchQuery: '',
          sortBy: DEFAULT_SORT_BY,
          sortOrder: DEFAULT_SORT_ORDER,
        });
      },

      // Computed Getters
      getFilteredGames: () => {
        const { games, selectedConsole, searchQuery, sortBy, sortOrder } =
          get();

        // Apply filters
        const filtered = filterGames(games, selectedConsole, searchQuery);

        // Apply sorting
        const sorted = sortGames(filtered, sortBy, sortOrder);

        return sorted;
      },

      getGameById: (id: string) => {
        const { games } = get();
        return games.find((game) => game.id === id);
      },
    }),
    {
      name: 'retro-gaming-game-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist viewMode to localStorage
      partialize: (state) => ({
        viewMode: state.viewMode,
      }),
    }
  )
);

// =============================================================================
// Selectors (for optimized re-renders)
// =============================================================================

/**
 * Select all games
 */
export const selectGames = (state: GameStoreState) => state.games;

/**
 * Select loading state
 */
export const selectIsLoading = (state: GameStoreState) => state.isLoading;

/**
 * Select error state
 */
export const selectError = (state: GameStoreState) => state.error;

/**
 * Select selected console filter
 */
export const selectSelectedConsole = (state: GameStoreState) =>
  state.selectedConsole;

/**
 * Select search query
 */
export const selectSearchQuery = (state: GameStoreState) => state.searchQuery;

/**
 * Select sort configuration
 */
export const selectSortConfig = (state: GameStoreState) => ({
  sortBy: state.sortBy,
  sortOrder: state.sortOrder,
});

/**
 * Select view mode
 */
export const selectViewMode = (state: GameStoreState) => state.viewMode;

/**
 * Select game count by console
 */
export const selectGameCountByConsole = (
  state: GameStoreState
): Record<ConsoleType, number> => {
  const counts: Partial<Record<ConsoleType, number>> = {};

  for (const game of state.games) {
    counts[game.console] = (counts[game.console] ?? 0) + 1;
  }

  return counts as Record<ConsoleType, number>;
};

/**
 * Select total game count
 */
export const selectTotalGameCount = (state: GameStoreState) =>
  state.games.length;

/**
 * Select filtered game count
 */
export const selectFilteredGameCount = (state: GameStoreState) =>
  state.getFilteredGames().length;

/**
 * Check if any filters are active
 */
export const selectHasActiveFilters = (state: GameStoreState) =>
  state.selectedConsole !== null || state.searchQuery.trim() !== '';
