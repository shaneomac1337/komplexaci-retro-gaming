/**
 * GameCard Component
 * Displays a game with cover art, title, console badge, and interactive elements
 */

import { memo, useState, useCallback, type MouseEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Badge, Icon } from '../../common';
import { FavoriteButton } from '../FavoriteButton';
import { CONSOLE_CONFIG } from '@/services/emulator/coreConfig';
import type { Game, ConsoleType } from '@/types';
import styles from './GameCard.module.css';

export interface GameCardProps {
  /** Game data to display */
  game: Game;
  /** Show console badge */
  showConsole?: boolean;
  /** Show game description */
  showDescription?: boolean;
  /** Card size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler (alternative to navigation) */
  onClick?: () => void;
  /** Handler for info button click */
  onInfoClick?: (game: Game) => void;
}

/**
 * Fallback placeholder image for games without covers
 */
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" fill="%231e293b"%3E%3Crect width="300" height="400"/%3E%3Ctext x="150" y="200" text-anchor="middle" fill="%2364748b" font-size="48"%3E?%3C/text%3E%3C/svg%3E';

/**
 * GameCard component with hover effects and lazy loading
 * Features neon glow, play overlay, and favorite button
 */
export const GameCard = memo(function GameCard({
  game,
  showConsole = true,
  showDescription = false,
  size = 'md',
  onClick,
  onInfoClick,
}: GameCardProps) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Cover URL (already includes CDN base from gameStore)
  const coverUrl = game.coverPath || PLACEHOLDER_IMAGE;

  // Get console configuration for styling
  const consoleConfig = CONSOLE_CONFIG[game.console as ConsoleType];
  const consoleName = consoleConfig?.name ?? game.console.toUpperCase();
  const consoleColor = consoleConfig?.color ?? '#6366f1';

  /**
   * Handle image load error
   */
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  /**
   * Handle image loaded successfully
   */
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  /**
   * Handle play button click
   */
  const handlePlayClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      navigate(`/play/${game.id}`);
    },
    [navigate, game.id]
  );

  /**
   * Handle card click
   */
  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  /**
   * Handle info button click
   */
  const handleInfoClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onInfoClick?.(game);
    },
    [onInfoClick, game]
  );

  // Common card content
  const cardContent: ReactNode = (
    <>
      {/* Cover Image */}
      <div className={styles.coverWrapper}>
        <img
          src={imageError ? PLACEHOLDER_IMAGE : coverUrl}
          alt={`${game.title} cover`}
          className={clsx(styles.cover, {
            [styles.loaded]: imageLoaded,
          })}
          loading="lazy"
          crossOrigin="anonymous"
          onError={handleImageError}
          onLoad={handleImageLoad}
        />

        {/* Loading shimmer overlay */}
        {!imageLoaded && !imageError && (
          <div className={styles.coverLoading} aria-hidden="true" />
        )}

        {/* Hover overlay with play button */}
        <div className={styles.hoverOverlay}>
          <button
            type="button"
            className={styles.playButton}
            onClick={handlePlayClick}
            aria-label={`Play ${game.title}`}
          >
            <Icon name="play" size={size === 'sm' ? 24 : 32} />
          </button>
        </div>

        {/* Action buttons in top-right corner */}
        <div className={styles.actionWrapper}>
          {onInfoClick && (
            <button
              type="button"
              className={styles.infoButton}
              onClick={handleInfoClick}
              aria-label={`View details for ${game.title}`}
            >
              <Icon name="info" size={size === 'lg' ? 18 : 16} />
            </button>
          )}
          <FavoriteButton
            gameId={game.id}
            size={size === 'lg' ? 'md' : 'sm'}
          />
        </div>
      </div>

      {/* Card content */}
      <div className={styles.content}>
        {/* Console badge */}
        {showConsole && (
          <Badge
            variant="console"
            console={game.console as ConsoleType}
            size="sm"
            className={styles.consoleBadge}
          >
            {consoleName}
          </Badge>
        )}

        {/* Game title */}
        <h3 className={styles.title} title={game.title}>
          {game.title}
        </h3>

        {/* Optional description */}
        {showDescription && game.description && (
          <p className={styles.description}>{game.description}</p>
        )}

        {/* Optional metadata row */}
        {size === 'lg' && (
          <div className={styles.metadata}>
            {game.releaseYear && (
              <span className={styles.year}>{game.releaseYear}</span>
            )}
            {game.genre && (
              <span className={styles.genre}>
                {game.genre.charAt(0).toUpperCase() + game.genre.slice(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  // Common style props
  const styleProps = {
    className: clsx(styles.gameCard, styles[size]),
    style: { '--console-color': consoleColor } as React.CSSProperties,
  };

  // Render as div with onClick handler
  if (onClick) {
    return (
      <div
        {...styleProps}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        {cardContent}
      </div>
    );
  }

  // Render as Link for navigation
  return (
    <Link to={`/play/${game.id}`} {...styleProps}>
      {cardContent}
    </Link>
  );
});
