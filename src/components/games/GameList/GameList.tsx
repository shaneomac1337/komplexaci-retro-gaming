/**
 * GameList Component
 * Table/list view for displaying games with sortable columns
 */

import { memo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Badge, Icon } from '../../common';
import { FavoriteButton } from '../FavoriteButton';
import { useGameStore } from '@/stores/gameStore';
import { CONSOLE_CONFIG } from '@/services/emulator/coreConfig';
import type { Game, ConsoleType, GameSortField, SortOrder } from '@/types';
import styles from './GameList.module.css';

export interface GameListProps {
  /** Array of games to display */
  games: Game[];
  /** Show loading state */
  isLoading?: boolean;
  /** Message to display when no games */
  emptyMessage?: string;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Sortable column header component
 */
interface SortableHeaderProps {
  label: string;
  field: GameSortField;
  currentField: GameSortField;
  currentOrder: SortOrder;
  onSort: (field: GameSortField) => void;
}

const SortableHeader = memo(function SortableHeader({
  label,
  field,
  currentField,
  currentOrder,
  onSort,
}: SortableHeaderProps) {
  const isActive = currentField === field;

  const handleClick = useCallback(() => {
    onSort(field);
  }, [field, onSort]);

  return (
    <th
      className={clsx(styles.th, styles.sortable, { [styles.active]: isActive })}
      onClick={handleClick}
      role="columnheader"
      aria-sort={
        isActive
          ? currentOrder === 'asc'
            ? 'ascending'
            : 'descending'
          : 'none'
      }
    >
      <button type="button" className={styles.sortButton}>
        <span>{label}</span>
        {isActive && (
          <Icon
            name={currentOrder === 'asc' ? 'chevron-left' : 'chevron-right'}
            size={14}
            className={styles.sortIcon}
            aria-hidden
          />
        )}
      </button>
    </th>
  );
});

/**
 * Game list row component
 */
interface GameRowProps {
  game: Game;
  onNavigate: (gameId: string) => void;
}

const GameRow = memo(function GameRow({ game, onNavigate }: GameRowProps) {
  const [imageError, setImageError] = useState(false);

  const consoleConfig = CONSOLE_CONFIG[game.console as ConsoleType];
  const consoleName = consoleConfig?.name ?? game.console.toUpperCase();

  // Cover URL (already includes CDN base from gameStore)
  const coverUrl = game.coverPath || null;

  const handleClick = useCallback(() => {
    onNavigate(game.id);
  }, [game.id, onNavigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onNavigate(game.id);
      }
    },
    [game.id, onNavigate]
  );

  return (
    <tr
      className={styles.row}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
    >
      {/* Cover thumbnail */}
      <td className={clsx(styles.td, styles.coverCell)}>
        <div className={styles.thumbnail}>
          {coverUrl && !imageError ? (
            <img
              src={coverUrl}
              alt=""
              loading="lazy"
              crossOrigin="anonymous"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={styles.placeholderThumb}>
              <Icon name="gamepad" size={16} aria-hidden />
            </div>
          )}
        </div>
      </td>

      {/* Title */}
      <td className={clsx(styles.td, styles.titleCell)}>
        <span className={styles.title}>{game.title}</span>
      </td>

      {/* Console */}
      <td className={clsx(styles.td, styles.consoleCell)}>
        <Badge
          variant="console"
          console={game.console as ConsoleType}
          size="sm"
        >
          {consoleName}
        </Badge>
      </td>

      {/* Genre */}
      <td className={clsx(styles.td, styles.genreCell)}>
        {game.genre ? (
          <span className={styles.genre}>
            {game.genre.charAt(0).toUpperCase() + game.genre.slice(1)}
          </span>
        ) : (
          <span className={styles.empty}>-</span>
        )}
      </td>

      {/* Year */}
      <td className={clsx(styles.td, styles.yearCell)}>
        {game.releaseYear ? (
          <span className={styles.year}>{game.releaseYear}</span>
        ) : (
          <span className={styles.empty}>-</span>
        )}
      </td>

      {/* Favorite */}
      <td className={clsx(styles.td, styles.actionCell)}>
        <FavoriteButton gameId={game.id} size="sm" />
      </td>
    </tr>
  );
});

/**
 * GameList component with sortable columns
 * Alternative table view to GameGrid
 */
export const GameList = memo(function GameList({
  games,
  isLoading = false,
  emptyMessage = 'No games found',
  className,
}: GameListProps) {
  const navigate = useNavigate();
  const { sortBy, sortOrder, setSortBy, setSortOrder } = useGameStore();

  /**
   * Handle column sort click
   */
  const handleSort = useCallback(
    (field: GameSortField) => {
      if (sortBy === field) {
        // Toggle order if same field
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        // Set new field with ascending order
        setSortBy(field);
        setSortOrder('asc');
      }
    },
    [sortBy, sortOrder, setSortBy, setSortOrder]
  );

  /**
   * Handle row navigation
   */
  const handleNavigate = useCallback(
    (gameId: string) => {
      navigate(`/play/${gameId}`);
    },
    [navigate]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.loadingWrapper} role="status" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeletonRow}>
            <div className={styles.skeletonCell} style={{ width: '48px' }} />
            <div className={styles.skeletonCell} style={{ flex: 1 }} />
            <div className={styles.skeletonCell} style={{ width: '100px' }} />
            <div className={styles.skeletonCell} style={{ width: '80px' }} />
            <div className={styles.skeletonCell} style={{ width: '60px' }} />
            <div className={styles.skeletonCell} style={{ width: '40px' }} />
          </div>
        ))}
        <span className={styles.srOnly}>Loading games...</span>
      </div>
    );
  }

  // Empty state
  if (games.length === 0) {
    return (
      <div className={styles.emptyState} role="status">
        <Icon name="gamepad" size={48} className={styles.emptyIcon} />
        <p className={styles.emptyMessage}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={clsx(styles.tableWrapper, className)}>
      <table className={styles.table} role="grid" aria-label="Games list">
        <thead className={styles.thead}>
          <tr>
            <th className={styles.th} style={{ width: '48px' }}>
              <span className={styles.srOnly}>Cover</span>
            </th>
            <SortableHeader
              label="Title"
              field="title"
              currentField={sortBy}
              currentOrder={sortOrder}
              onSort={handleSort}
            />
            <SortableHeader
              label="Console"
              field="console"
              currentField={sortBy}
              currentOrder={sortOrder}
              onSort={handleSort}
            />
            <SortableHeader
              label="Genre"
              field="genre"
              currentField={sortBy}
              currentOrder={sortOrder}
              onSort={handleSort}
            />
            <SortableHeader
              label="Year"
              field="releaseYear"
              currentField={sortBy}
              currentOrder={sortOrder}
              onSort={handleSort}
            />
            <th className={styles.th} style={{ width: '60px' }}>
              <span className={styles.srOnly}>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {games.map((game) => (
            <GameRow key={game.id} game={game} onNavigate={handleNavigate} />
          ))}
        </tbody>
      </table>
    </div>
  );
});
