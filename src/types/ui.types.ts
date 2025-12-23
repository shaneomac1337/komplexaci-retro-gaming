/**
 * UI Types for Retro Gaming Platform
 * Defines types for modals, toasts, view modes, and other UI components
 */

import type { ConsoleType } from './console.types';
import type { Game } from './game.types';

/**
 * Modal type identifiers
 */
export type ModalType =
  | 'settings'
  | 'saveState'
  | 'loadState'
  | 'controls'
  | 'confirm'
  | 'gameInfo'
  | 'about'
  | 'keyboard';

/**
 * Toast notification severity types
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast notification configuration
 */
export interface Toast {
  /** Unique identifier for the toast */
  id: string;
  /** Type/severity of the toast */
  type: ToastType;
  /** Message to display */
  message: string;
  /** Optional title for the toast */
  title?: string;
  /** Duration in milliseconds before auto-dismiss (0 for persistent) */
  duration?: number;
  /** Whether the toast can be manually dismissed */
  dismissible?: boolean;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Timestamp when toast was created */
  createdAt: Date;
}

/**
 * Default toast duration in milliseconds
 */
export const DEFAULT_TOAST_DURATION = {
  success: 3000,
  error: 5000,
  info: 4000,
  warning: 4000,
} as const satisfies Record<ToastType, number>;

/**
 * Toast creation input (without auto-generated fields)
 */
export type ToastInput = Omit<Toast, 'id' | 'createdAt'>;

/**
 * View mode for game library display
 */
export type ViewMode = 'grid' | 'list' | 'compact';

/**
 * Sort options for game list
 */
export type SortOption = 'title' | 'console' | 'recent' | 'releaseYear' | 'favorites';

/**
 * Grid size options
 */
export type GridSize = 'small' | 'medium' | 'large';

/**
 * Sidebar state
 */
export type SidebarState = 'expanded' | 'collapsed' | 'hidden';

/**
 * Navigation route paths
 */
export type RoutePath = '/' | '/game/:id' | '/favorites' | '/settings' | '/history';

/**
 * Breadcrumb item
 */
export interface Breadcrumb {
  /** Display label */
  label: string;
  /** Route path */
  path: RoutePath | string;
  /** Whether this is the current page */
  isActive?: boolean;
}

/**
 * Confirmation dialog configuration
 */
export interface ConfirmDialogConfig {
  /** Dialog title */
  title: string;
  /** Dialog message/description */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Whether this is a destructive action */
  isDestructive?: boolean;
  /** Icon to display */
  icon?: 'warning' | 'danger' | 'info' | 'question';
}

/**
 * Modal state configuration
 */
export interface ModalState {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Type of modal to display */
  type: ModalType | null;
  /** Additional data to pass to the modal */
  data?: Record<string, unknown>;
  /** Callback when modal is closed */
  onClose?: () => void;
  /** Callback when modal action is confirmed */
  onConfirm?: (result?: unknown) => void;
}

/**
 * Default modal state
 */
export const DEFAULT_MODAL_STATE: ModalState = {
  isOpen: false,
  type: null,
} as const;

/**
 * Loading state with optional progress
 */
export interface LoadingState {
  /** Whether loading is in progress */
  isLoading: boolean;
  /** Loading progress (0-100), undefined for indeterminate */
  progress?: number;
  /** Loading message to display */
  message?: string;
}

/**
 * Error state with details
 */
export interface ErrorState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** Error message */
  message?: string;
  /** Error code for programmatic handling */
  code?: string;
  /** Whether the error can be retried */
  canRetry?: boolean;
  /** Retry callback */
  onRetry?: () => void;
}

/**
 * Console filter button configuration
 */
export interface ConsoleFilterButton {
  /** Console type */
  console: ConsoleType | 'all';
  /** Display label */
  label: string;
  /** Icon identifier */
  icon: string;
  /** Brand color */
  color: string;
  /** Whether currently selected */
  isActive: boolean;
  /** Game count for this console */
  gameCount: number;
}

/**
 * Game card props for list/grid items
 */
export interface GameCardProps {
  /** Game data */
  game: Game;
  /** View mode */
  viewMode: ViewMode;
  /** Whether the game is favorited */
  isFavorite: boolean;
  /** Whether the game is currently selected */
  isSelected?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Favorite toggle handler */
  onToggleFavorite: () => void;
  /** Play handler */
  onPlay: () => void;
}

/**
 * Pagination state
 */
export interface PaginationState {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Theme mode */
  mode: 'light' | 'dark' | 'system';
  /** Primary accent color */
  primaryColor: string;
  /** Font family */
  fontFamily: string;
  /** Border radius scale */
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  /** Animation preference */
  reduceMotion: boolean;
}

/**
 * Default theme configuration
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'system',
  primaryColor: '#6366f1',
  fontFamily: 'system-ui',
  borderRadius: 'medium',
  reduceMotion: false,
} as const;

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** Unique identifier */
  id: string;
  /** Key combination (e.g., 'ctrl+s', 'f11') */
  keys: string;
  /** Description of the action */
  description: string;
  /** Category for grouping */
  category: 'emulator' | 'navigation' | 'ui';
  /** Whether the shortcut is customizable */
  customizable: boolean;
}

/**
 * Responsive breakpoint values
 */
export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Breakpoint type
 */
export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Screen size hook return type
 */
export interface ScreenSize {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Context menu item
 */
export interface ContextMenuItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon identifier */
  icon?: string;
  /** Keyboard shortcut hint */
  shortcut?: string;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Whether this is a separator */
  isSeparator?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Submenu items */
  submenu?: ContextMenuItem[];
}

/**
 * Context menu state
 */
export interface ContextMenuState {
  /** Whether the menu is visible */
  isVisible: boolean;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Menu items to display */
  items: ContextMenuItem[];
}
