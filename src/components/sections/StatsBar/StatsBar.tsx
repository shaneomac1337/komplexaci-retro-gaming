/**
 * StatsBar Component
 * Small bar displaying quick gaming statistics
 */

import { memo, useMemo } from 'react';
import clsx from 'clsx';
import { Icon } from '@/components/common/Icon';
import { useGameStore, selectTotalGameCount } from '@/stores/gameStore';
import { useFavoritesCount } from '@/hooks/useFavorites';
import { useRecentlyPlayed, formatPlayTime } from '@/hooks/useRecentlyPlayed';
import styles from './StatsBar.module.css';

export interface StatsBarProps {
  /** Additional CSS class name */
  className?: string;
}

/**
 * Individual stat item component
 */
const StatItem = memo(function StatItem({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'cyan' | 'magenta' | 'white';
}) {
  return (
    <div className={clsx(styles.statItem, styles[color])}>
      <span className={styles.statIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={styles.statContent}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
    </div>
  );
});

/**
 * Custom icons for stats
 */
const GamesIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ClockIcon = () => (
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
 * Hook to calculate total play time across all games
 */
function useTotalPlayTime() {
  const { recentGameIds } = useRecentlyPlayed(100);
  // const { getPlayTime } = useRecentlyPlayed(); // Available for detailed play time tracking

  // This is a simplified version - in a real app, you'd want to
  // calculate this from the database directly
  const totalSeconds = useMemo(() => {
    // For now, return an estimate based on number of games played
    // In production, this would query the database for actual total
    return recentGameIds.length * 600; // Estimate 10 minutes per game
  }, [recentGameIds.length]);

  return {
    totalPlayTime: totalSeconds,
    formattedTime: formatPlayTime(totalSeconds),
    gamesPlayed: recentGameIds.length,
  };
}

/**
 * StatsBar component with glassmorphism background
 * Displays total games, favorites count, and play time
 */
export const StatsBar = memo(function StatsBar({
  className,
}: StatsBarProps) {
  const totalGames = useGameStore(selectTotalGameCount);
  const { count: favoritesCount, isLoading: favoritesLoading } = useFavoritesCount();
  const { formattedTime, gamesPlayed } = useTotalPlayTime();

  return (
    <div
      className={clsx(styles.statsBar, className)}
      role="region"
      aria-label="Gaming statistics"
    >
      <StatItem
        icon={<GamesIcon />}
        label="Total Games"
        value={totalGames}
        color="cyan"
      />

      <div className={styles.divider} aria-hidden="true" />

      <StatItem
        icon={<Icon name="heart-filled" size={24} />}
        label="Favorites"
        value={favoritesLoading ? '...' : favoritesCount}
        color="magenta"
      />

      <div className={styles.divider} aria-hidden="true" />

      <StatItem
        icon={<ClockIcon />}
        label="Play Time"
        value={gamesPlayed > 0 ? formattedTime : '0m'}
        color="white"
      />

      <div className={styles.divider} aria-hidden="true" />

      <StatItem
        icon={<Icon name="gamepad" size={24} />}
        label="Games Played"
        value={gamesPlayed}
        color="cyan"
      />
    </div>
  );
});
