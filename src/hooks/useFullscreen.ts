/**
 * Fullscreen Hook for Retro Gaming Platform
 *
 * Provides a wrapper around the Fullscreen API for managing fullscreen mode.
 * Essential for immersive emulator gameplay experience.
 */

import { useState, useCallback, useEffect, type RefObject } from 'react';

/**
 * Vendor-prefixed fullscreen methods interface.
 * Different browsers use different method names.
 */
interface FullscreenMethods {
  requestFullscreen: string;
  exitFullscreen: string;
  fullscreenElement: string;
  fullscreenEnabled: string;
  fullscreenChange: string;
  fullscreenError: string;
}

/**
 * Detects and returns the appropriate fullscreen API methods for the current browser.
 */
function getFullscreenMethods(): FullscreenMethods | null {
  if (typeof document === 'undefined') {
    return null;
  }

  // Standard API
  if ('fullscreenEnabled' in document) {
    return {
      requestFullscreen: 'requestFullscreen',
      exitFullscreen: 'exitFullscreen',
      fullscreenElement: 'fullscreenElement',
      fullscreenEnabled: 'fullscreenEnabled',
      fullscreenChange: 'fullscreenchange',
      fullscreenError: 'fullscreenerror',
    };
  }

  // Webkit (Safari, older Chrome)
  if ('webkitFullscreenEnabled' in document) {
    return {
      requestFullscreen: 'webkitRequestFullscreen',
      exitFullscreen: 'webkitExitFullscreen',
      fullscreenElement: 'webkitFullscreenElement',
      fullscreenEnabled: 'webkitFullscreenEnabled',
      fullscreenChange: 'webkitfullscreenchange',
      fullscreenError: 'webkitfullscreenerror',
    };
  }

  // Mozilla (older Firefox)
  if ('mozFullScreenEnabled' in document) {
    return {
      requestFullscreen: 'mozRequestFullScreen',
      exitFullscreen: 'mozCancelFullScreen',
      fullscreenElement: 'mozFullScreenElement',
      fullscreenEnabled: 'mozFullScreenEnabled',
      fullscreenChange: 'mozfullscreenchange',
      fullscreenError: 'mozfullscreenerror',
    };
  }

  // Microsoft (IE/Edge legacy)
  if ('msFullscreenEnabled' in document) {
    return {
      requestFullscreen: 'msRequestFullscreen',
      exitFullscreen: 'msExitFullscreen',
      fullscreenElement: 'msFullscreenElement',
      fullscreenEnabled: 'msFullscreenEnabled',
      fullscreenChange: 'MSFullscreenChange',
      fullscreenError: 'MSFullscreenError',
    };
  }

  return null;
}

/**
 * Manages fullscreen state for a given element.
 * Handles browser-specific fullscreen API differences.
 *
 * @param elementRef - React ref to the element to make fullscreen
 * @returns Object with fullscreen state and control functions
 *
 * @example
 * ```tsx
 * function EmulatorView() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const {
 *     isFullscreen,
 *     enterFullscreen,
 *     exitFullscreen,
 *     toggleFullscreen,
 *     isSupported,
 *   } = useFullscreen(containerRef);
 *
 *   return (
 *     <div ref={containerRef} className="emulator-container">
 *       <EmulatorCanvas />
 *       <div className="controls">
 *         {isSupported && (
 *           <button onClick={toggleFullscreen}>
 *             {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
 *           </button>
 *         )}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFullscreen(elementRef: RefObject<HTMLElement | null>): {
  isFullscreen: boolean;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  isSupported: boolean;
} {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const methods = getFullscreenMethods();

  // Check if fullscreen is supported
  const isSupported = Boolean(
    methods && typeof document !== 'undefined' && (document as never)[methods.fullscreenEnabled]
  );

  /**
   * Checks if the current element is in fullscreen mode.
   */
  const checkFullscreen = useCallback((): boolean => {
    if (!methods || typeof document === 'undefined') {
      return false;
    }

    const fullscreenElement = (document as never)[methods.fullscreenElement];

    // Check if our element is the fullscreen element
    if (elementRef.current) {
      return fullscreenElement === elementRef.current;
    }

    // If no specific element, check if any element is fullscreen
    return Boolean(fullscreenElement);
  }, [methods, elementRef]);

  /**
   * Requests fullscreen mode for the element.
   */
  const enterFullscreen = useCallback(async (): Promise<void> => {
    if (!methods || !elementRef.current) {
      console.warn('Fullscreen not supported or element not available');
      return;
    }

    try {
      const element = elementRef.current as never;
      const requestMethod = element[methods.requestFullscreen] as (
        options?: FullscreenOptions
      ) => Promise<void>;

      if (typeof requestMethod === 'function') {
        await requestMethod.call(element, { navigationUI: 'hide' });
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      throw error;
    }
  }, [methods, elementRef]);

  /**
   * Exits fullscreen mode.
   */
  const exitFullscreen = useCallback(async (): Promise<void> => {
    if (!methods || typeof document === 'undefined') {
      return;
    }

    try {
      const doc = document as never;
      const exitMethod = doc[methods.exitFullscreen] as () => Promise<void>;

      if (typeof exitMethod === 'function' && checkFullscreen()) {
        await exitMethod.call(document);
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
      throw error;
    }
  }, [methods, checkFullscreen]);

  /**
   * Toggles fullscreen mode.
   */
  const toggleFullscreen = useCallback(async (): Promise<void> => {
    if (checkFullscreen()) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [checkFullscreen, enterFullscreen, exitFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    if (!methods || typeof document === 'undefined') {
      return;
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(checkFullscreen());
    };

    const handleFullscreenError = (event: Event) => {
      console.error('Fullscreen error:', event);
      setIsFullscreen(false);
    };

    document.addEventListener(methods.fullscreenChange, handleFullscreenChange);
    document.addEventListener(methods.fullscreenError, handleFullscreenError);

    // Set initial state - use setTimeout to avoid sync setState in effect
    setTimeout(() => setIsFullscreen(checkFullscreen()), 0);

    return () => {
      document.removeEventListener(methods.fullscreenChange, handleFullscreenChange);
      document.removeEventListener(methods.fullscreenError, handleFullscreenError);
    };
  }, [methods, checkFullscreen]);

  // Handle Escape key to sync state
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        // Browser handles exiting fullscreen, we just need to sync state
        // The fullscreenchange event will update our state
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    isSupported,
  };
}

/**
 * Hook to detect when any element is in fullscreen mode.
 * Useful for showing/hiding UI elements based on fullscreen state.
 *
 * @returns boolean indicating if document is in fullscreen mode
 *
 * @example
 * ```tsx
 * function AppHeader() {
 *   const isDocumentFullscreen = useIsDocumentFullscreen();
 *
 *   // Hide header in fullscreen mode
 *   if (isDocumentFullscreen) {
 *     return null;
 *   }
 *
 *   return <header>...</header>;
 * }
 * ```
 */
export function useIsDocumentFullscreen(): boolean {
  const methods = getFullscreenMethods();
  // Initialize state using a function to compute the initial value
  const [isFullscreen, setIsFullscreen] = useState(() => {
    if (!methods || typeof document === 'undefined') {
      return false;
    }
    return Boolean((document as never)[methods.fullscreenElement]);
  });

  useEffect(() => {
    if (!methods || typeof document === 'undefined') {
      return;
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean((document as never)[methods.fullscreenElement]));
    };

    document.addEventListener(methods.fullscreenChange, handleFullscreenChange);

    return () => {
      document.removeEventListener(methods.fullscreenChange, handleFullscreenChange);
    };
  }, [methods]);

  return isFullscreen;
}

/**
 * Hook that provides keyboard shortcut for fullscreen toggle.
 * Commonly used with F11 key.
 *
 * @param elementRef - Element to make fullscreen
 * @param key - Key to use for toggle (default: 'F11')
 * @returns Fullscreen control object
 *
 * @example
 * ```tsx
 * function GamePlayer() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const fullscreen = useFullscreenWithShortcut(containerRef, 'F11');
 *
 *   return (
 *     <div ref={containerRef}>
 *       <p>Press F11 for fullscreen</p>
 *       <p>Status: {fullscreen.isFullscreen ? 'Fullscreen' : 'Windowed'}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFullscreenWithShortcut(
  elementRef: RefObject<HTMLElement | null>,
  key: string = 'F11'
): ReturnType<typeof useFullscreen> {
  const fullscreen = useFullscreen(elementRef);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === key && !event.repeat) {
        event.preventDefault();
        fullscreen.toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, fullscreen]);

  return fullscreen;
}
