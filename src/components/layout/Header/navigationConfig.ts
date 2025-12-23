/**
 * Navigation Configuration
 * Defines the navigation links and types for the header navigation
 */

/**
 * Icon name type for navigation items
 */
export type IconName = 'home' | 'grid' | 'heart';

/**
 * Navigation link item configuration
 */
export interface NavLinkItem {
  to: string;
  label: string;
  icon?: IconName;
}

/**
 * Default navigation links
 */
export const NAV_LINKS: NavLinkItem[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/browse', label: 'Browse', icon: 'grid' },
  { to: '/favorites', label: 'Favorites', icon: 'heart' },
];
