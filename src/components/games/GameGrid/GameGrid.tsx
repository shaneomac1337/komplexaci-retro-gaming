/**
 * GameGrid Component
 * Responsive grid layout for displaying game cards
 */

import { memo, useMemo } from 'react';
import clsx from 'clsx';
import { GameCard } from '../GameCard';
import { GameCardSkeleton } from '../GameCardSkeleton';
import type { Game } from '@/types';
import styles from './GameGrid.module.css';

export interface GameGridProps {
  /** Array of games to display */
  games: Game[];
  /** Show loading skeleton state */
  isLoading?: boolean;
  /** Message to display when no games */
  emptyMessage?: string;
  /** Number of columns for the grid */
  columns?: 2 | 3 | 4 | 5 | 6;
  /** Size variant for game cards */
  cardSize?: 'sm' | 'md' | 'lg';
  /** Show console badges on cards */
  showConsole?: boolean;
  /** Show description on cards */
  showDescription?: boolean;
  /** Number of skeleton cards to show when loading */
  skeletonCount?: number;
  /** Handler for game info button click */
  onGameInfoClick?: (game: Game) => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * GameGrid component with responsive layout
 * Uses CSS Grid with auto-fill for responsive columns
 * Memoized to prevent unnecessary re-renders
 */
export const GameGrid = memo(function GameGrid({
  games,
  isLoading = false,
  emptyMessage = 'No games found',
  columns = 4,
  cardSize = 'md',
  showConsole = true,
  showDescription = false,
  skeletonCount = 8,
  onGameInfoClick,
  className,
}: GameGridProps) {
  // Generate skeleton array only when needed
  const skeletons = useMemo(() => {
    if (!isLoading) return [];
    return Array.from({ length: skeletonCount }, (_, i) => i);
  }, [isLoading, skeletonCount]);

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={clsx(styles.grid, styles[`cols${columns}`], className)}
        role="status"
        aria-label="Loading games"
        aria-busy="true"
      >
        {skeletons.map((index) => (
          <GameCardSkeleton key={`skeleton-${index}`} size={cardSize} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (games.length === 0) {
    return (
      <div className={styles.emptyState} role="status">
        <div className={styles.emptyIcon}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z"
            />
          </svg>
        </div>
        <p className={styles.emptyMessage}>{emptyMessage}</p>
      </div>
    );
  }

  // Render game grid
  return (
    <div
      className={clsx(styles.grid, styles[`cols${columns}`], className)}
      role="list"
      aria-label="Games grid"
    >
      {games.map((game) => (
        <div key={game.id} role="listitem">
          <GameCard
            game={game}
            size={cardSize}
            showConsole={showConsole}
            showDescription={showDescription}
            onInfoClick={onGameInfoClick}
          />
        </div>
      ))}
    </div>
  );
});
