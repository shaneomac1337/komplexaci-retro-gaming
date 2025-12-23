/**
 * Navigation Component
 * Main navigation links with neon active state indicators
 */

import { NavLink } from 'react-router-dom';
import { NAV_LINKS, type IconName } from './navigationConfig';
import styles from './Navigation.module.css';

/**
 * SVG icons for navigation
 */
const NavIcon = ({ name }: { name: IconName }) => {
  switch (name) {
    case 'home':
      return (
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'grid':
      return (
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    case 'heart':
      return (
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    default:
      return null;
  }
};

interface NavigationProps {
  /** Additional CSS class names */
  className?: string;
  /** Callback when a link is clicked (useful for closing mobile menu) */
  onLinkClick?: () => void;
}

/**
 * Navigation Component
 * Renders the main navigation links with active state styling
 */
export function Navigation({ className, onLinkClick }: NavigationProps) {
  return (
    <nav
      className={`${styles.nav} ${className || ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <ul className={styles.navList}>
        {NAV_LINKS.map((link) => (
          <li key={link.to} className={styles.navItem}>
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={onLinkClick}
              end={link.to === '/'}
            >
              {link.icon && <NavIcon name={link.icon} />}
              <span className={styles.navLabel}>{link.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navigation;
