/**
 * GameFilters Component
 * Filter bar with view mode toggle, sort controls, and results count
 */

import { memo, useCallback } from 'react';
import clsx from 'clsx';
import { Icon } from '../../common';
import { useGameStore } from '@/stores/gameStore';
import type { GameSortField, ViewMode } from '@/types';
import styles from './GameFilters.module.css';

export interface GameFiltersProps {
  /** Total count of games before filtering */
  totalCount: number;
  /** Count of games after filtering */
  filteredCount: number;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Sort option configuration
 */
interface SortOption {
  value: GameSortField;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'title', label: 'Title' },
  { value: 'console', label: 'Console' },
  { value: 'releaseYear', label: 'Year' },
  { value: 'lastPlayed', label: 'Recent' },
];

/**
 * GameFilters component with view mode and sort controls
 * Connected to useGameStore for state management
 */
export const GameFilters = memo(function GameFilters({
  totalCount,
  filteredCount,
  className,
}: GameFiltersProps) {
  const {
    viewMode,
    sortBy,
    sortOrder,
    setViewMode,
    setSortBy,
    setSortOrder,
    resetFilters,
  } = useGameStore();

  /**
   * Handle view mode toggle
   */
  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
    },
    [setViewMode]
  );

  /**
   * Handle sort field change
   */
  const handleSortByChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSortBy(event.target.value as GameSortField);
    },
    [setSortBy]
  );

  /**
   * Handle sort order toggle
   */
  const handleSortOrderToggle = useCallback(() => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder, setSortOrder]);

  /**
   * Handle reset filters
   */
  const handleReset = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  // Check if filters are active (showing subset of total)
  const hasActiveFilters = filteredCount < totalCount;

  return (
    <div className={clsx(styles.filters, className)}>
      {/* Left side: Results count */}
      <div className={styles.resultsCount}>
        <span className={styles.count}>
          {filteredCount === totalCount ? (
            <>{totalCount} games</>
          ) : (
            <>
              <strong>{filteredCount}</strong> of {totalCount} games
            </>
          )}
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            className={styles.resetButton}
            onClick={handleReset}
            aria-label="Reset all filters"
          >
            Reset
          </button>
        )}
      </div>

      {/* Right side: Controls */}
      <div className={styles.controls}>
        {/* Sort dropdown */}
        <div className={styles.sortControl}>
          <label htmlFor="sort-select" className={styles.srOnly}>
            Sort by
          </label>
          <select
            id="sort-select"
            className={styles.sortSelect}
            value={sortBy}
            onChange={handleSortByChange}
            aria-label="Sort games by"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Sort order toggle */}
          <button
            type="button"
            className={clsx(styles.sortOrderButton, {
              [styles.desc]: sortOrder === 'desc',
            })}
            onClick={handleSortOrderToggle}
            aria-label={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}. Click to toggle.`}
            title={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
          >
            <Icon
              name={sortOrder === 'asc' ? 'chevron-left' : 'chevron-right'}
              size={16}
              className={styles.sortOrderIcon}
              aria-hidden
            />
          </button>
        </div>

        {/* View mode toggle */}
        <div className={styles.viewModeToggle} role="group" aria-label="View mode">
          <button
            type="button"
            className={clsx(styles.viewModeButton, {
              [styles.active]: viewMode === 'grid',
            })}
            onClick={() => handleViewModeChange('grid')}
            aria-pressed={viewMode === 'grid'}
            title="Grid view"
          >
            <Icon name="grid" size={18} aria-hidden />
            <span className={styles.srOnly}>Grid view</span>
          </button>
          <button
            type="button"
            className={clsx(styles.viewModeButton, {
              [styles.active]: viewMode === 'list',
            })}
            onClick={() => handleViewModeChange('list')}
            aria-pressed={viewMode === 'list'}
            title="List view"
          >
            <Icon name="list" size={18} aria-hidden />
            <span className={styles.srOnly}>List view</span>
          </button>
        </div>
      </div>
    </div>
  );
});
