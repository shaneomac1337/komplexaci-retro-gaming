/**
 * FavoriteButton Component
 * Heart toggle button for favoriting games with animated states
 */

import { memo, useCallback, type MouseEvent } from 'react';
import clsx from 'clsx';
import { Icon } from '../../common';
import { useFavoriteStatus } from '@/hooks/useFavorites';
import styles from './FavoriteButton.module.css';

export interface FavoriteButtonProps {
  /** Game ID to track favorite status */
  gameId: string;
  /** Button size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show text label alongside icon */
  showLabel?: boolean;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Favorite button with animated heart icon
 * Uses useFavoriteStatus for efficient single-game tracking
 */
export const FavoriteButton = memo(function FavoriteButton({
  gameId,
  size = 'md',
  showLabel = false,
  className,
}: FavoriteButtonProps) {
  const { isFavorite, isLoading, toggle } = useFavoriteStatus(gameId);

  const handleClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      // Prevent event bubbling to parent elements (e.g., card click)
      event.preventDefault();
      event.stopPropagation();

      try {
        await toggle();
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
      }
    },
    [toggle]
  );

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 28 : 20;

  const ariaLabel = isFavorite
    ? 'Remove from favorites'
    : 'Add to favorites';

  return (
    <button
      type="button"
      className={clsx(
        styles.favoriteButton,
        styles[size],
        {
          [styles.active]: isFavorite,
          [styles.loading]: isLoading,
        },
        className
      )}
      onClick={handleClick}
      disabled={isLoading}
      aria-label={ariaLabel}
      aria-pressed={isFavorite}
      title={ariaLabel}
    >
      <span className={styles.iconWrapper}>
        <Icon
          name={isFavorite ? 'heart-filled' : 'heart'}
          size={iconSize}
          className={styles.icon}
          aria-hidden
        />
      </span>
      {showLabel && (
        <span className={styles.label}>
          {isFavorite ? 'Favorited' : 'Favorite'}
        </span>
      )}
    </button>
  );
});
