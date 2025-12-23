/**
 * GameInfo Component
 *
 * Displays game information in the PlayPage sidebar including
 * title, console, cover image, description, and metadata.
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import type { Game } from '@/types';
import { CONSOLE_CONFIG } from '@/types';
import { Badge } from '@/components/common';
import styles from './GameInfo.module.css';

export interface GameInfoProps {
  /** Game data to display */
  game: Game;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Format genre for display
 */
function formatGenre(genre: string): string {
  return genre
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * GameInfo component for the PlayPage sidebar
 */
export const GameInfo = memo(function GameInfo({ game, className }: GameInfoProps) {
  const consoleConfig = CONSOLE_CONFIG[game.console];

  return (
    <div className={clsx(styles.gameInfo, className)}>
      {/* Cover Image */}
      {game.coverPath && (
        <div className={styles.coverWrapper}>
          <img
            src={game.coverPath}
            alt={`${game.title} cover`}
            className={styles.coverImage}
            loading="lazy"
          />
        </div>
      )}

      {/* Title and Console */}
      <div className={styles.header}>
        <h1 className={styles.title}>{game.title}</h1>
        <Badge variant="console" console={game.console}>
          {consoleConfig.name}
        </Badge>
      </div>

      {/* Metadata */}
      <div className={styles.metadata}>
        {game.releaseYear && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Release Year</span>
            <span className={styles.metaValue}>{game.releaseYear}</span>
          </div>
        )}

        {game.genre && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Genre</span>
            <span className={styles.metaValue}>{formatGenre(game.genre)}</span>
          </div>
        )}

        {game.developer && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Developer</span>
            <span className={styles.metaValue}>{game.developer}</span>
          </div>
        )}

        {game.publisher && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Publisher</span>
            <span className={styles.metaValue}>{game.publisher}</span>
          </div>
        )}

        {game.players && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Players</span>
            <span className={styles.metaValue}>
              {game.players === 1 ? '1 Player' : `1-${game.players} Players`}
            </span>
          </div>
        )}

        {game.region && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Region</span>
            <span className={styles.metaValue}>{game.region}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {game.description && (
        <div className={styles.description}>
          <h2 className={styles.descriptionTitle}>About</h2>
          <p className={styles.descriptionText}>{game.description}</p>
        </div>
      )}

      {/* Tags */}
      {game.tags && game.tags.length > 0 && (
        <div className={styles.tags}>
          {game.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Browse Similar Link */}
      <Link
        to={`/browse?console=${game.console}`}
        className={styles.similarLink}
      >
        Browse more {consoleConfig.name} games
      </Link>
    </div>
  );
});
