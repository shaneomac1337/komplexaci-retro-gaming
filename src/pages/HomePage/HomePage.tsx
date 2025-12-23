/**
 * HomePage Component
 * Main landing page with hero section, stats, and game sections
 */

import { useEffect, memo } from 'react';
import clsx from 'clsx';
import { HeroSection } from '@/components/sections/HeroSection';
import { StatsBar } from '@/components/sections/StatsBar';
import { RecentlyPlayed } from '@/components/sections/RecentlyPlayed';
import { FavoriteGames } from '@/components/sections/FavoriteGames';
import { ConsoleCarousel } from '@/components/sections/ConsoleCarousel';
import { useGameStore } from '@/stores/gameStore';
import { useRecentlyPlayed } from '@/hooks/useRecentlyPlayed';
import { useFavorites } from '@/hooks/useFavorites';
import styles from './HomePage.module.css';

export interface HomePageProps {
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
 * HomePage component
 * Displays hero section, stats bar, and various game sections
 */
const HomePage = memo(function HomePage({ className }: HomePageProps) {
  // Update document title
  useDocumentTitle('Retro Gaming Hub - Play Classic Games');

  // Load games on mount
  const { games, isLoading, fetchGames } = useGameStore();

  // Get recent and favorites data to determine which sections to show
  const { recentGameIds, isLoading: recentLoading } = useRecentlyPlayed(6);
  const { favorites, isLoading: favoritesLoading } = useFavorites();

  useEffect(() => {
    // Fetch games if not already loaded
    if (games.length === 0 && !isLoading) {
      fetchGames();
    }
  }, [games.length, isLoading, fetchGames]);

  // Determine which sections to show
  const hasRecentlyPlayed = recentGameIds.length > 0 || recentLoading;
  const hasFavorites = favorites.length > 0 || favoritesLoading;

  return (
    <div className={clsx(styles.home, className)}>
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Bar */}
      <StatsBar className={styles.statsBar} />

      {/* Main Content Sections */}
      <div className={styles.content}>
        {/* Recently Played Section - only shown if user has played games */}
        {hasRecentlyPlayed && (
          <section id="recently-played" className={styles.section}>
            <RecentlyPlayed limit={6} />
          </section>
        )}

        {/* Favorites Section - only shown if user has favorites */}
        {hasFavorites && (
          <section id="favorites" className={styles.section}>
            <FavoriteGames limit={6} />
          </section>
        )}

        {/* Console Carousel - always shown */}
        <section id="consoles" className={styles.section}>
          <ConsoleCarousel />
        </section>
      </div>

      {/* Decorative background elements */}
      <div className={styles.backgroundGrid} aria-hidden="true" />
    </div>
  );
});

export default HomePage;
