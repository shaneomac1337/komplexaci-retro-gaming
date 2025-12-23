/**
 * FavoriteGames Component
 * Section displaying user's favorite games in a carousel
 */

import { memo, useMemo } from 'react';
import clsx from 'clsx';
import { useFavorites } from '@/hooks/useFavorites';
import { useGameStore } from '@/stores/gameStore';
import { SectionHeader } from '../SectionHeader';
import { GameCarousel } from '../GameCarousel';
import styles from './FavoriteGames.module.css';

export interface FavoriteGamesProps {
  /** Maximum number of games to display (default: 6) */
  limit?: number;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Filled heart icon for the section header
 */
const HeartFilledIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
  </svg>
);

/**
 * FavoriteGames section component
 * Displays a carousel of favorite games using the useFavorites hook
 */
export const FavoriteGames = memo(function FavoriteGames({
  limit = 6,
  className,
}: FavoriteGamesProps) {
  const { favorites, isLoading, count } = useFavorites();
  const games = useGameStore((state) => state.games);

  // Cross-reference favorite IDs with full game objects from the store
  const favoriteGames = useMemo(() => {
    if (!games.length || !favorites.length) return [];

    const gamesMap = new Map(games.map((game) => [game.id, game]));
    return favorites
      .map((id) => gamesMap.get(id))
      .filter((game): game is NonNullable<typeof game> => game !== undefined)
      .slice(0, limit);
  }, [games, favorites, limit]);

  const hasMoreGames = count > limit;

  return (
    <section
      className={clsx(styles.section, className)}
      aria-labelledby="favorites-title"
    >
      <SectionHeader
        title="Your Favorites"
        subtitle={count > 0 ? `${count} game${count !== 1 ? 's' : ''} saved` : undefined}
        icon={<HeartFilledIcon />}
        action={
          hasMoreGames
            ? {
                label: 'See All',
                to: '/favorites',
              }
            : undefined
        }
      />

      <GameCarousel
        games={favoriteGames}
        isLoading={isLoading}
        emptyMessage="No favorites yet. Heart a game to save it!"
      />
    </section>
  );
});
