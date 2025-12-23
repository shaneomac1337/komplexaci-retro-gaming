/**
 * Sidebar Component
 * Responsive sidebar with console filters
 * Desktop: Collapsible sidebar
 * Mobile: Full-screen overlay
 */

import { useCallback, useEffect, useRef } from 'react';
import { useGameStore, selectSelectedConsole, selectGameCountByConsole, selectTotalGameCount } from '../../../stores';
import { ConsoleFilter } from './ConsoleFilter';
import type { ConsoleType } from '../../../types';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  /** Whether the sidebar is open (for mobile overlay) */
  isOpen: boolean;
  /** Callback to close the sidebar */
  onClose?: () => void;
  /** Whether the sidebar is collapsed (desktop only) */
  isCollapsed?: boolean;
  /** Callback to toggle collapsed state */
  onToggleCollapse?: () => void;
}

/**
 * Close icon SVG component
 */
const CloseIcon = () => (
  <svg
    className={styles.closeIcon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/**
 * Collapse toggle icon SVG component
 */
const CollapseIcon = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <svg
    className={`${styles.collapseIcon} ${isCollapsed ? styles.collapsed : ''}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

/**
 * Sidebar Component
 * Contains console filters and can be collapsed on desktop or used as overlay on mobile
 */
export function Sidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null);

  // Store connections
  const selectedConsole = useGameStore(selectSelectedConsole);
  const gameCounts = useGameStore(selectGameCountByConsole);
  const totalGameCount = useGameStore(selectTotalGameCount);
  const setSelectedConsole = useGameStore((state) => state.setSelectedConsole);

  // Handle console selection
  const handleConsoleSelect = useCallback(
    (console: ConsoleType | null) => {
      setSelectedConsole(console);
      // On mobile, close the sidebar after selection
      if (window.innerWidth <= 768) {
        onClose?.();
      }
    },
    [setSelectedConsole, onClose]
  );

  // Handle escape key to close overlay
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Trap focus within sidebar when open as overlay
  useEffect(() => {
    if (!isOpen || !sidebarRef.current) return;

    const sidebar = sidebarRef.current;
    const focusableElements = sidebar.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when opened
    firstElement?.focus();

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    sidebar.addEventListener('keydown', handleTabKey);
    return () => sidebar.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay backdrop (mobile only) */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        id="sidebar"
        className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${isCollapsed ? styles.sidebarCollapsed : ''}`}
        role="complementary"
        aria-label="Sidebar"
        aria-hidden={!isOpen && window.innerWidth <= 768}
      >
        {/* Close button (mobile only) */}
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <CloseIcon />
        </button>

        {/* Sidebar content */}
        <div className={styles.sidebarContent}>
          <ConsoleFilter
            selectedConsole={selectedConsole}
            onSelect={handleConsoleSelect}
            gameCounts={gameCounts}
            totalGameCount={totalGameCount}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Collapse toggle button (desktop only) */}
        {onToggleCollapse && (
          <button
            type="button"
            className={styles.collapseButton}
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
          >
            <CollapseIcon isCollapsed={isCollapsed} />
          </button>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
