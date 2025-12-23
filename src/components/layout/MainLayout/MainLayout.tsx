/**
 * MainLayout Component
 * Main application layout with Header, Sidebar, Main content, and Footer
 * Uses CSS Grid for responsive layout
 */

import { useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useUIStore, selectIsSidebarOpen, selectIsSidebarCollapsed } from '../../../stores';
import { useMediaQuery } from '../../../hooks';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { Footer } from '../Footer';
import styles from './MainLayout.module.css';

/**
 * MainLayout Component
 * Provides the main application structure with responsive sidebar behavior
 *
 * Layout structure:
 * - Desktop: Header (full width) + Sidebar (left) + Main (center) + Footer (full width)
 * - Tablet: Same as desktop but with collapsible sidebar
 * - Mobile: Header + Main (sidebar hidden, opens as overlay)
 */
export function MainLayout() {
  // Get sidebar state from store
  const isSidebarOpen = useUIStore(selectIsSidebarOpen);
  const isSidebarCollapsed = useUIStore(selectIsSidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);

  // Check for mobile breakpoints
  const isMobile = useMediaQuery('(max-width: 768px)');
  // const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)'); // Reserved for responsive layouts

  // Handle mobile menu toggle
  const handleMenuToggle = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(!isSidebarOpen);
    } else {
      toggleSidebar();
    }
  }, [isMobile, isSidebarOpen, setSidebarOpen, toggleSidebar]);

  // Handle sidebar close (mobile overlay)
  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  // Handle sidebar collapse toggle (desktop/tablet)
  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed(!isSidebarCollapsed);
  }, [isSidebarCollapsed, setSidebarCollapsed]);

  // Determine if sidebar should be visible
  const showSidebar = !isMobile || isSidebarOpen;

  // Get layout class based on sidebar state
  const getLayoutClass = () => {
    const classes = [styles.layout];

    if (isMobile) {
      classes.push(styles.layoutMobile);
    } else if (isSidebarCollapsed) {
      classes.push(styles.layoutCollapsed);
    }

    return classes.join(' ');
  };

  return (
    <div className={getLayoutClass()}>
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      {/* Header */}
      <Header onMenuToggle={handleMenuToggle} isMenuOpen={isMobile && isSidebarOpen} />

      {/* Sidebar */}
      <Sidebar
        isOpen={showSidebar}
        onClose={handleSidebarClose}
        isCollapsed={!isMobile && isSidebarCollapsed}
        onToggleCollapse={!isMobile ? handleToggleCollapse : undefined}
      />

      {/* Main Content */}
      <main className={styles.main} id="main-content" role="main">
        <div className={styles.mainContent}>
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default MainLayout;
