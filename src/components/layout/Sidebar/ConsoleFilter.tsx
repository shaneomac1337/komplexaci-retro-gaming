/**
 * ConsoleFilter Component
 * Console selection buttons with icons and game counts
 */

import { useMemo } from 'react';
import { CONSOLE_CONFIG, type ConsoleType } from '../../../types';
import styles from './ConsoleFilter.module.css';

export interface ConsoleFilterProps {
  /** Currently selected console (null for "All") */
  selectedConsole: ConsoleType | null;
  /** Callback when a console is selected */
  onSelect: (console: ConsoleType | null) => void;
  /** Game count per console */
  gameCounts?: Partial<Record<ConsoleType, number>>;
  /** Total game count */
  totalGameCount?: number;
  /** Whether the sidebar is collapsed */
  isCollapsed?: boolean;
}

/**
 * Console icon SVG components
 */
const ConsoleIcon = ({
  console: consoleType,
  className,
}: {
  console: ConsoleType | 'all';
  className?: string;
}) => {
  const baseClass = `${styles.consoleIcon} ${className || ''}`;

  switch (consoleType) {
    case 'all':
      return (
        <svg
          className={baseClass}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z" />
        </svg>
      );
    case 'ps1':
      return (
        <svg
          className={baseClass}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M19 5h-6v6h6V5zm-6 8h1.5v1.5H13V13zm1.5 1.5H16V16h-1.5v-1.5zM16 13h1.5v1.5H16V13zm-3 3h1.5v1.5H13V16zm1.5 1.5H16V19h-1.5v-1.5zM16 16h1.5v1.5H16V16zm1.5-1.5H19V16h-1.5v-1.5zm0 3H19V19h-1.5v-1.5zM19 13h-1.5v1.5H19V13z" />
        </svg>
      );
    case 'nes':
      return (
        <svg
          className={baseClass}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM6 13H4v-2h2v2zm3 0H7v-2h2v2zm6 1h-2v-1h-1v-2h1v-1h2v1h1v2h-1v1zm3 0h-1v-1h-1v-1h1v-1h1v1h1v1h-1v1z" />
        </svg>
      );
    case 'snes':
      return (
        <svg
          className={baseClass}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.5 7A1.5 1.5 0 0 1 19 8.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 15.5v-7A1.5 1.5 0 0 1 6.5 7h11m0-2h-11A3.5 3.5 0 0 0 3 8.5v7A3.5 3.5 0 0 0 6.5 19h11a3.5 3.5 0 0 0 3.5-3.5v-7A3.5 3.5 0 0 0 17.5 5zM9 12H7v2H9v-2zm-2-2h2v-2H7v2zm10 2h-2v2h2v-2zm-2-2h2v-2h-2v2z" />
        </svg>
      );
    case 'n64':
      return (
        <svg
          className={baseClass}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2L1 12h3v9h16v-9h3L12 2zm0 2.83L18.17 11H5.83L12 4.83zM17 19H7v-6h10v6zm-8-4v2h2v-2H9zm4 0v2h2v-2h-2z" />
        </svg>
      );
    case 'gb':
      return (
        <svg
          className={baseClass}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4 17H9v-2h4v2zm3-5H8V6h8v8zm-1-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
        </svg>
      );
    case 'gba':
      return (
        <svg
          className={baseClass}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M20 7H4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-12 6H6v-2h2v2zm10-1h-2v1h-1v-1h-2v-1h2v-1h1v1h2v1zm-4-1a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
        </svg>
      );
    default:
      return null;
  }
};

/**
 * Console filter configuration including "All" option
 */
interface ConsoleFilterItem {
  id: ConsoleType | 'all';
  label: string;
  color: string;
}

/**
 * ConsoleFilter Component
 * Displays console filter buttons with active state and game counts
 */
export function ConsoleFilter({
  selectedConsole,
  onSelect,
  gameCounts = {},
  totalGameCount = 0,
  isCollapsed = false,
}: ConsoleFilterProps) {
  // Build filter items from console config
  const filterItems: ConsoleFilterItem[] = useMemo(() => {
    const items: ConsoleFilterItem[] = [
      { id: 'all', label: 'All Consoles', color: '#00ffff' },
    ];

    // Add all supported consoles
    Object.entries(CONSOLE_CONFIG).forEach(([key, config]) => {
      items.push({
        id: key as ConsoleType,
        label: config.name,
        color: config.color,
      });
    });

    return items;
  }, []);

  // Get game count for a console
  const getGameCount = (id: ConsoleType | 'all'): number => {
    if (id === 'all') {
      return totalGameCount;
    }
    return gameCounts[id] ?? 0;
  };

  return (
    <div
      className={`${styles.consoleFilter} ${isCollapsed ? styles.collapsed : ''}`}
      role="group"
      aria-label="Filter by console"
    >
      <h3 className={styles.filterTitle}>
        {isCollapsed ? '' : 'Consoles'}
      </h3>
      <ul className={styles.filterList}>
        {filterItems.map((item) => {
          const isActive =
            item.id === 'all'
              ? selectedConsole === null
              : selectedConsole === item.id;
          const count = getGameCount(item.id);

          return (
            <li key={item.id} className={styles.filterItem}>
              <button
                type="button"
                className={`${styles.filterButton} ${isActive ? styles.active : ''}`}
                onClick={() => onSelect(item.id === 'all' ? null : item.id)}
                aria-pressed={isActive}
                style={
                  {
                    '--console-color': item.color,
                  } as React.CSSProperties
                }
                title={isCollapsed ? `${item.label} (${count})` : undefined}
              >
                <ConsoleIcon console={item.id} />
                {!isCollapsed && (
                  <>
                    <span className={styles.filterLabel}>{item.label}</span>
                    <span className={styles.filterCount}>{count}</span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ConsoleFilter;
