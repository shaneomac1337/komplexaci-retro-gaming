/**
 * FavoritesPage Component
 * Displays user's favorite games with grid layout
 */

import { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Icon } from '@/components/common/Icon';
import { Button } from '@/components/common/Button';
import { GameGrid } from '@/components/games/GameGrid';
import { GameDetailModal } from '@/components/games/GameDetailModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useFavorites } from '@/hooks/useFavorites';
import { useGameStore } from '@/stores/gameStore';
import type { Game } from '@/types';
import styles from './FavoritesPage.module.css';

export interface FavoritesPageProps {
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
 * Empty state component for when there are no favorites
 */
const EmptyState = memo(function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Icon name="heart" size={64} />
      </div>
      <h2 className={styles.emptyTitle}>No Favorites Yet</h2>
      <p className={styles.emptyDescription}>
        Start building your collection by adding games to your favorites.
        Click the heart icon on any game to save it here.
      </p>
      <Link to="/browse" className={styles.ctaLink}>
        <Button variant="primary" size="lg" rightIcon={<Icon name="chevron-right" size={20} />}>
          Browse Games
        </Button>
      </Link>
    </div>
  );
});

/**
 * FavoritesPage component
 * Shows all games the user has marked as favorites
 */
const FavoritesPage = memo(function FavoritesPage({ className }: FavoritesPageProps) {
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

  // Update document title
  useDocumentTitle('Your Favorites - Retro Gaming Hub');

  // Get favorites from hook
  const { favorites, isLoading: favoritesLoading, count } = useFavorites();

  // Get games from store
  const { games, isLoading: gamesLoading, fetchGames } = useGameStore();

  // Fetch games if not loaded
  useEffect(() => {
    if (games.length === 0 && !gamesLoading) {
      fetchGames();
    }
  }, [games.length, gamesLoading, fetchGames]);

  // Cross-reference favorite IDs with game objects
  const favoriteGames = useMemo(() => {
    if (!games.length || !favorites.length) return [];

    const gamesMap = new Map(games.map((game) => [game.id, game]));
    return favorites
      .map((id) => gamesMap.get(id))
      .filter((game): game is NonNullable<typeof game> => game !== undefined);
  }, [games, favorites]);

  // Determine overall loading state
  const isLoading = favoritesLoading || (gamesLoading && games.length === 0);

  // Show loading state
  if (isLoading) {
    return (
      <div className={clsx(styles.favorites, styles.loading, className)}>
        <div className={styles.loadingContent}>
          <LoadingSpinner size="lg" />
          <p className={styles.loadingText}>Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles.favorites, className)}>
      {/* Page Header */}
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <Icon name="heart-filled" size={32} />
        </div>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Your Favorites</h1>
          {count > 0 && (
            <span className={styles.count}>
              {count} {count === 1 ? 'game' : 'games'}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.content}>
        {favorites.length === 0 ? (
          <EmptyState />
        ) : (
          <GameGrid
            games={favoriteGames}
            isLoading={false}
            emptyMessage="No favorites found"
            columns={4}
            showConsole
            onGameInfoClick={handleGameInfoClick}
          />
        )}
      </main>

      {/* Decorative elements */}
      <div className={styles.backgroundGlow} aria-hidden="true" />
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

export default FavoritesPage;
