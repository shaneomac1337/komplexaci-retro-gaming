/**
 * GameCardSkeleton Component
 * Loading placeholder that matches GameCard layout with shimmer effect
 */

import { memo } from 'react';
import clsx from 'clsx';
import styles from './GameCardSkeleton.module.css';

export interface GameCardSkeletonProps {
  /** Size variant to match GameCard */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS class name */
  className?: string;
}

/**
 * Skeleton loading state for GameCard
 * Displays shimmer animation while actual content loads
 */
export const GameCardSkeleton = memo(function GameCardSkeleton({
  size = 'md',
  className,
}: GameCardSkeletonProps) {
  return (
    <div
      className={clsx(styles.skeleton, styles[size], className)}
      role="status"
      aria-label="Loading game"
      aria-busy="true"
    >
      {/* Cover image placeholder */}
      <div className={styles.cover}>
        <div className={styles.shimmer} />
      </div>

      {/* Content area */}
      <div className={styles.content}>
        {/* Badge placeholder */}
        <div className={styles.badgePlaceholder}>
          <div className={styles.shimmer} />
        </div>

        {/* Title placeholder */}
        <div className={styles.titlePlaceholder}>
          <div className={styles.shimmer} />
        </div>

        {/* Description placeholder (only for md and lg) */}
        {size !== 'sm' && (
          <div className={styles.descriptionPlaceholder}>
            <div className={styles.descriptionLine}>
              <div className={styles.shimmer} />
            </div>
            <div className={clsx(styles.descriptionLine, styles.short)}>
              <div className={styles.shimmer} />
            </div>
          </div>
        )}
      </div>

      {/* Screen reader only text */}
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );
});
