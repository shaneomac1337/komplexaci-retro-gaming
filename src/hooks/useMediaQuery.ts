/**
 * Media Query Hooks for Retro Gaming Platform
 *
 * Provides responsive breakpoint detection and media query matching.
 * SSR-safe with proper hydration handling.
 */

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

/**
 * Standard breakpoints matching common CSS frameworks
 */
const BREAKPOINTS = {
  sm: '(min-width: 480px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const;

/**
 * Breakpoint key type
 */
type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Creates a subscription function for media query changes.
 * Used with useSyncExternalStore for optimal React 18+ integration.
 */
function createMediaQuerySubscription(query: string) {
  return (callback: () => void) => {
    // SSR guard
    if (typeof window === 'undefined') {
      return () => {};
    }

    const mediaQueryList = window.matchMedia(query);

    // Modern browsers use addEventListener
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', callback);
      return () => mediaQueryList.removeEventListener('change', callback);
    }

    // Fallback for older browsers (Safari < 14)
    mediaQueryList.addListener(callback);
    return () => mediaQueryList.removeListener(callback);
  };
}

/**
 * Creates a snapshot function for media query state.
 * Used with useSyncExternalStore.
 */
function createMediaQuerySnapshot(query: string) {
  return () => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  };
}

/**
 * Server snapshot that returns false (safe default).
 */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Checks if a media query matches the current viewport.
 * Uses useSyncExternalStore for optimal performance and consistency.
 *
 * @param query - CSS media query string
 * @returns boolean indicating if the query matches
 *
 * @example
 * ```tsx
 * function ResponsiveLayout() {
 *   const isLargeScreen = useMediaQuery('(min-width: 1024px)');
 *   const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 *   const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 *
 *   return (
 *     <div className={isLargeScreen ? 'sidebar-layout' : 'stack-layout'}>
 *       {isLargeScreen && <Sidebar />}
 *       <MainContent animate={!prefersReducedMotion} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => createMediaQuerySubscription(query)(callback),
    [query]
  );

  const getSnapshot = useCallback(
    () => createMediaQuerySnapshot(query)(),
    [query]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Alternative implementation using useState/useEffect for broader compatibility.
 * Useful when you need more control over the initial state.
 *
 * @param query - CSS media query string
 * @param defaultValue - Default value to use on server/initial render
 * @returns boolean indicating if the query matches
 */
export function useMediaQueryWithDefault(query: string, defaultValue: boolean = false): boolean {
  // Initialize with computed value if window is available
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    // Handler for media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Subscribe to changes
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(handleChange);
    }

    // Cleanup subscription
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange);
      } else {
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Returns current breakpoint information based on viewport width.
 * Provides convenient boolean flags for common responsive patterns.
 *
 * @returns Object with breakpoint information
 *
 * @example
 * ```tsx
 * function GameGrid() {
 *   const { isMobile, isTablet, isDesktop, breakpoint } = useBreakpoint();
 *
 *   const columns = isMobile ? 2 : isTablet ? 3 : 5;
 *
 *   return (
 *     <div className={`grid-cols-${columns}`}>
 *       {isMobile && <MobileNav />}
 *       {isDesktop && <Sidebar />}
 *       <GameList breakpoint={breakpoint} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useBreakpoint(): {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: BreakpointKey;
} {
  const isSm = useMediaQuery(BREAKPOINTS.sm);
  const isMd = useMediaQuery(BREAKPOINTS.md);
  const isLg = useMediaQuery(BREAKPOINTS.lg);
  const isXl = useMediaQuery(BREAKPOINTS.xl);
  const is2xl = useMediaQuery(BREAKPOINTS['2xl']);

  // Determine current breakpoint (largest matching)
  let breakpoint: BreakpointKey = 'sm';
  if (is2xl) {
    breakpoint = '2xl';
  } else if (isXl) {
    breakpoint = 'xl';
  } else if (isLg) {
    breakpoint = 'lg';
  } else if (isMd) {
    breakpoint = 'md';
  } else if (isSm) {
    breakpoint = 'sm';
  }

  return {
    // Mobile: below md breakpoint (< 768px)
    isMobile: !isMd,
    // Tablet: md to lg breakpoint (768px - 1023px)
    isTablet: isMd && !isLg,
    // Desktop: lg and above (>= 1024px)
    isDesktop: isLg,
    // Current breakpoint name
    breakpoint,
  };
}

/**
 * Returns viewport dimensions with debounced updates.
 * Useful for responsive calculations that need exact pixel values.
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns Object with width and height
 *
 * @example
 * ```tsx
 * function GameCanvas() {
 *   const { width, height } = useViewportSize(150);
 *   const aspectRatio = width / height;
 *
 *   return (
 *     <canvas
 *       width={width}
 *       height={height}
 *       style={{ aspectRatio }}
 *     />
 *   );
 * }
 * ```
 */
export function useViewportSize(debounceMs: number = 100): {
  width: number;
  height: number;
} {
  // Initialize with computed value
  const [size, setSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceMs);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [debounceMs]);

  return size;
}

/**
 * Detects user's preference for reduced motion.
 * Important for accessibility compliance.
 *
 * @returns boolean indicating if reduced motion is preferred
 *
 * @example
 * ```tsx
 * function AnimatedGameCard({ game }) {
 *   const prefersReducedMotion = usePrefersReducedMotion();
 *
 *   return (
 *     <motion.div
 *       animate={prefersReducedMotion ? undefined : { scale: [1, 1.05, 1] }}
 *     >
 *       <GameCard game={game} />
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Detects user's color scheme preference (light/dark mode).
 *
 * @returns 'light' | 'dark' based on system preference
 *
 * @example
 * ```tsx
 * function ThemeProvider({ children }) {
 *   const colorScheme = usePrefersColorScheme();
 *
 *   return (
 *     <ThemeContext.Provider value={{ theme: colorScheme }}>
 *       {children}
 *     </ThemeContext.Provider>
 *   );
 * }
 * ```
 */
export function usePrefersColorScheme(): 'light' | 'dark' {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  return prefersDark ? 'dark' : 'light';
}

// Export breakpoints for external use
export { BREAKPOINTS };
export type { BreakpointKey };
