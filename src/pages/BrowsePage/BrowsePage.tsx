/**
 * BrowsePage Component
 * Game browsing page with filters, search, and grid/list views
 */

import { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { GameFilters } from '@/components/games/GameFilters';
import { GameGrid } from '@/components/games/GameGrid';
import { GameList } from '@/components/games/GameList';
import { GameDetailModal } from '@/components/games/GameDetailModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DevRomUploader } from '@/components/dev';
import {
  useGameStore,
  selectViewMode,
  selectTotalGameCount,
} from '@/stores/gameStore';
import type { ConsoleType, Game } from '@/types';
import styles from './BrowsePage.module.css';

export interface BrowsePageProps {
  /** Additional CSS class name */
  className?: string;
}

/**
 * Hook for updating document title
 */
function useDocumentTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

/**
 * Valid console types for URL params
 */
const VALID_CONSOLES: ConsoleType[] = ['ps1', 'nes', 'snes', 'n64', 'gb', 'gba'];

/**
 * BrowsePage component
 * Allows users to browse, filter, and search games
 */
const BrowsePage = memo(function BrowsePage({ className }: BrowsePageProps) {
  const [searchParams] = useSearchParams();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle opening game detail modal
  const handleGameInfoClick = useCallback((game: Game) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  }, []);

  // Handle closing game detail modal
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Get store state and actions
  const {
    games,
    isLoading,
    error,
    selectedConsole,
    fetchGames,
    setSelectedConsole,
    getFilteredGames,
  } = useGameStore();

  const viewMode = useGameStore(selectViewMode);
  const totalCount = useGameStore(selectTotalGameCount);

  // Get filtered games
  const filteredGames = useMemo(() => getFilteredGames(), [getFilteredGames]);
  const filteredCount = filteredGames.length;

  // Update document title based on selected console
  const pageTitle = useMemo(() => {
    if (selectedConsole) {
      const consoleNames: Record<ConsoleType, string> = {
        ps1: 'PlayStation',
        nes: 'NES',
        snes: 'SNES',
        n64: 'Nintendo 64',
        gb: 'Game Boy',
        gba: 'Game Boy Advance',
      };
      return `${consoleNames[selectedConsole]} Games - Retro Gaming Hub`;
    }
    return 'Browse Games - Retro Gaming Hub';
  }, [selectedConsole]);

  useDocumentTitle(pageTitle);

  // Handle URL params for console filter on mount
  useEffect(() => {
    const consoleParam = searchParams.get('console');

    if (consoleParam && VALID_CONSOLES.includes(consoleParam as ConsoleType)) {
      setSelectedConsole(consoleParam as ConsoleType);
    }
  }, [searchParams, setSelectedConsole]);

  // Fetch games on mount if not already loaded
  useEffect(() => {
    if (games.length === 0 && !isLoading && !error) {
      fetchGames();
    }
  }, [games.length, isLoading, error, fetchGames]);

  // Show loading state
  if (isLoading && games.length === 0) {
    return (
      <div className={clsx(styles.browse, styles.loading, className)}>
        <div className={styles.loadingContent}>
          <LoadingSpinner size="lg" />
          <p className={styles.loadingText}>Loading games...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && games.length === 0) {
    return (
      <div className={clsx(styles.browse, styles.error, className)}>
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className={styles.errorTitle}>Failed to Load Games</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => fetchGames()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles.browse, className)}>
      {/* Page Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Browse Games</h1>
          <p className={styles.subtitle}>
            {filteredCount === totalCount ? (
              <>{totalCount} games available</>
            ) : (
              <>
                Showing <strong>{filteredCount}</strong> of {totalCount} games
              </>
            )}
          </p>
        </div>
      </header>

      {/* Dev ROM Uploader - only visible in development */}
      <DevRomUploader />

      {/* Filters Bar */}
      <GameFilters
        totalCount={totalCount}
        filteredCount={filteredCount}
        className={styles.filters}
      />

      {/* Games Display */}
      <main className={styles.content}>
        {viewMode === 'grid' ? (
          <GameGrid
            games={filteredGames}
            isLoading={isLoading}
            emptyMessage="No games match your filters. Try adjusting your search."
            columns={4}
            showConsole
            onGameInfoClick={handleGameInfoClick}
          />
        ) : (
          <GameList
            games={filteredGames}
            isLoading={isLoading}
            emptyMessage="No games match your filters. Try adjusting your search."
          />
        )}
      </main>

      {/* Decorative elements */}
      <div className={styles.gridLines} aria-hidden="true" />

      {/* Game Detail Modal */}
      <GameDetailModal
        game={selectedGame}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
});

export default BrowsePage;
