/**
 * GameCarousel Component
 * Reusable horizontal scroll carousel for displaying game cards
 */

import { memo, useRef, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import type { Game } from '@/types';
import { Card } from '@/components/common/Card';
import { Icon } from '@/components/common/Icon';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useFavoriteStatus } from '@/hooks/useFavorites';
import { CONSOLE_CONFIG } from '@/types';
import styles from './GameCarousel.module.css';

export interface GameCarouselProps {
  /** Array of games to display */
  games: Game[];
  /** Whether the data is loading */
  isLoading?: boolean;
  /** Message to display when there are no games */
  emptyMessage?: string;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Individual game card component for the carousel
 */
const GameCarouselCard = memo(function GameCarouselCard({
  game,
}: {
  game: Game;
}) {
  const { isFavorite, toggle, isLoading } = useFavoriteStatus(game.id);
  const consoleConfig = CONSOLE_CONFIG[game.console];

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isLoading) {
        toggle();
      }
    },
    [toggle, isLoading]
  );

  return (
    <Link to={`/game/${game.id}`} className={styles.cardLink}>
      <Card variant="interactive" padding="none" className={styles.card}>
        <div className={styles.cardImage}>
          {game.coverPath ? (
            <img
              src={game.coverPath}
              alt=""
              className={styles.coverImage}
              loading="lazy"
            />
          ) : (
            <div
              className={styles.placeholderImage}
              style={{
                '--console-color': consoleConfig.color,
              } as React.CSSProperties}
            >
              <Icon name="gamepad" size={48} />
            </div>
          )}
          <button
            type="button"
            className={clsx(styles.favoriteButton, {
              [styles.favorited]: isFavorite,
            })}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            disabled={isLoading}
          >
            <Icon name={isFavorite ? 'heart-filled' : 'heart'} size={20} />
          </button>
          <div className={styles.playOverlay}>
            <Icon name="play" size={32} />
          </div>
        </div>
        <div className={styles.cardContent}>
          <h3 className={styles.cardTitle}>{game.title}</h3>
          <span
            className={styles.consoleBadge}
            style={{
              '--console-color': consoleConfig.color,
            } as React.CSSProperties}
          >
            {consoleConfig.name}
          </span>
        </div>
      </Card>
    </Link>
  );
});

/**
 * GameCarousel component with horizontal scrolling and navigation arrows
 * Features smooth scroll snap, touch support, and gradient edge fades
 */
export const GameCarousel = memo(function GameCarousel({
  games,
  isLoading = false,
  emptyMessage = 'No games to display',
  className,
}: GameCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Update scroll button states
  const updateScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Initialize and listen for scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollButtons();
    container.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      container.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons, games]);

  // Scroll handlers
  const scroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 220; // Approximate card width including gap
    const scrollAmount = cardWidth * 2; // Scroll 2 cards at a time
    const newScrollLeft =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={clsx(styles.container, styles.loading, className)}>
        <LoadingSpinner size="lg" text="Loading games..." />
      </div>
    );
  }

  // Empty state
  if (games.length === 0) {
    return (
      <div className={clsx(styles.container, styles.empty, className)}>
        <div className={styles.emptyContent}>
          <Icon name="gamepad" size={48} className={styles.emptyIcon} />
          <p className={styles.emptyMessage}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, className)}>
      {/* Left Navigation Arrow */}
      <button
        type="button"
        className={clsx(styles.navButton, styles.navLeft)}
        onClick={() => scroll('left')}
        disabled={!canScrollLeft}
        aria-label="Scroll left"
      >
        <Icon name="chevron-left" size={24} />
      </button>

      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className={styles.scrollContainer}
        role="list"
        aria-label="Games carousel"
      >
        {games.map((game) => (
          <div key={game.id} className={styles.cardWrapper} role="listitem">
            <GameCarouselCard game={game} />
          </div>
        ))}
      </div>

      {/* Right Navigation Arrow */}
      <button
        type="button"
        className={clsx(styles.navButton, styles.navRight)}
        onClick={() => scroll('right')}
        disabled={!canScrollRight}
        aria-label="Scroll right"
      >
        <Icon name="chevron-right" size={24} />
      </button>

      {/* Gradient Fades */}
      {canScrollLeft && <div className={clsx(styles.fade, styles.fadeLeft)} aria-hidden="true" />}
      {canScrollRight && <div className={clsx(styles.fade, styles.fadeRight)} aria-hidden="true" />}
    </div>
  );
});
