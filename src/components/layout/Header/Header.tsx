/**
 * Header Component
 * Cyberpunk-themed sticky header with glassmorphism effect
 * Contains logo, navigation, search, and mobile menu toggle
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../../../stores';
import { useDebounce } from '../../../hooks';
import { Navigation } from './Navigation';
import styles from './Header.module.css';

export interface HeaderProps {
  /** Callback when mobile menu button is toggled */
  onMenuToggle?: () => void;
  /** Whether the mobile menu is currently open */
  isMenuOpen?: boolean;
}

/**
 * Search icon SVG component
 */
const SearchIcon = () => (
  <svg
    className={styles.searchIcon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

/**
 * Hamburger menu icon SVG component
 */
const MenuIcon = () => (
  <svg
    className={styles.menuIcon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

/**
 * Header Component
 * Main application header with navigation, search, and responsive menu
 */
export function Header({ onMenuToggle, isMenuOpen = false }: HeaderProps) {
  const setSearchQuery = useGameStore((state) => state.setSearchQuery);
  const searchQuery = useGameStore((state) => state.searchQuery);

  // Local state for the input value
  const [inputValue, setInputValue] = useState(searchQuery);
  // Track previous searchQuery to detect external changes
  const prevSearchQueryRef = useRef(searchQuery);

  // Debounce the search query to avoid too many updates
  const debouncedValue = useDebounce(inputValue, 300);

  // Update the store when debounced value changes
  useEffect(() => {
    setSearchQuery(debouncedValue);
  }, [debouncedValue, setSearchQuery]);

  // Sync input with store if it changes externally (e.g., filter reset)
  useEffect(() => {
    // Only react when searchQuery changes from outside (e.g., reset button)
    if (prevSearchQueryRef.current !== searchQuery && searchQuery === '' && inputValue !== '') {
      // Use setTimeout to make the state update async
      setTimeout(() => setInputValue(''), 0);
    }
    prevSearchQueryRef.current = searchQuery;
  }, [searchQuery, inputValue]);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value);
    },
    []
  );

  const handleMenuToggle = useCallback(() => {
    onMenuToggle?.();
  }, [onMenuToggle]);

  return (
    <header className={styles.header} role="banner">
      {/* Logo */}
      <Link to="/" className={styles.logo} aria-label="RETRO GAMING - Home">
        <span className={styles.logoText}>RETRO GAMING</span>
      </Link>

      {/* Center Section: Navigation and Search */}
      <div className={styles.centerSection}>
        <Navigation />

        {/* Search Input */}
        <div className={styles.searchContainer}>
          <SearchIcon />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search games..."
            value={inputValue}
            onChange={handleSearchChange}
            aria-label="Search games"
          />
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        type="button"
        className={styles.menuButton}
        onClick={handleMenuToggle}
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-menu"
      >
        <MenuIcon />
      </button>
    </header>
  );
}

export default Header;
