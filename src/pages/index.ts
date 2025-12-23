/**
 * Pages Index
 * Central export point for all page components with lazy loading support
 *
 * Pages are lazy-loaded using React.lazy() for code splitting.
 * This improves initial bundle size and loading performance.
 */

import { lazy } from 'react';

// =============================================================================
// Lazy-Loaded Page Components
// =============================================================================

/**
 * HomePage - Main landing page with hero, stats, and game sections
 * @see src/pages/HomePage/HomePage.tsx
 */
export const HomePage = lazy(() => import('./HomePage'));

/**
 * BrowsePage - Game browsing with filters, search, and grid/list views
 * @see src/pages/BrowsePage/BrowsePage.tsx
 */
export const BrowsePage = lazy(() => import('./BrowsePage'));

/**
 * PlayPage - Game emulator page
 * @see src/pages/PlayPage/PlayPage.tsx
 */
export const PlayPage = lazy(() => import('./PlayPage'));

/**
 * FavoritesPage - User's favorite games collection
 * @see src/pages/FavoritesPage/FavoritesPage.tsx
 */
export const FavoritesPage = lazy(() => import('./FavoritesPage'));

/**
 * SettingsPage - Application settings and preferences
 * @see src/pages/SettingsPage/SettingsPage.tsx
 */
export const SettingsPage = lazy(() => import('./SettingsPage'));

/**
 * NotFoundPage - 404 error page with retro styling
 * @see src/pages/NotFoundPage/NotFoundPage.tsx
 */
export const NotFoundPage = lazy(() => import('./NotFoundPage'));

// =============================================================================
// Type Exports (for TypeScript consumers)
// =============================================================================

export type { HomePageProps } from './HomePage';
export type { BrowsePageProps } from './BrowsePage';
export type { FavoritesPageProps } from './FavoritesPage';
export type { NotFoundPageProps } from './NotFoundPage';
