/**
 * RecentlyPlayed Component
 * Section displaying recently played games in a carousel
 */

import { memo, useMemo } from 'react';
import clsx from 'clsx';
import { useRecentlyPlayed } from '@/hooks/useRecentlyPlayed';
import { useGameStore } from '@/stores/gameStore';
import { SectionHeader } from '../SectionHeader';
import { GameCarousel } from '../GameCarousel';
import styles from './RecentlyPlayed.module.css';

export interface RecentlyPlayedProps {
  /** Maximum number of games to display (default: 6) */
  limit?: number;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Clock/History icon for the section header
 */
const HistoryIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/**
 * RecentlyPlayed section component
 * Displays a carousel of recently played games using the useRecentlyPlayed hook
 */
export const RecentlyPlayed = memo(function RecentlyPlayed({
  limit = 6,
  className,
}: RecentlyPlayedProps) {
  const { recentGameIds, isLoading } = useRecentlyPlayed(limit + 2); // Fetch a few extra
  const games = useGameStore((state) => state.games);

  // Cross-reference game IDs with full game objects from the store
  const recentGames = useMemo(() => {
    if (!games.length || !recentGameIds.length) return [];

    const gamesMap = new Map(games.map((game) => [game.id, game]));
    return recentGameIds
      .map((id) => gamesMap.get(id))
      .filter((game): game is NonNullable<typeof game> => game !== undefined)
      .slice(0, limit);
  }, [games, recentGameIds, limit]);

  const hasMoreGames = recentGameIds.length > limit;

  return (
    <section
      className={clsx(styles.section, className)}
      aria-labelledby="recently-played-title"
    >
      <SectionHeader
        title="Continue Playing"
        subtitle="Pick up where you left off"
        icon={<HistoryIcon />}
        action={
          hasMoreGames
            ? {
                label: 'See All',
                to: '/history',
              }
            : undefined
        }
      />

      <GameCarousel
        games={recentGames}
        isLoading={isLoading}
        emptyMessage="No games played yet. Start playing!"
      />
    </section>
  );
});
