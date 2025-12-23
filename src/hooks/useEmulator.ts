/**
 * Emulator Hook for Retro Gaming Platform
 *
 * Provides integration with EmulatorJS for running retro games.
 * Handles initialization, cleanup, and state management.
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { CONSOLE_CONFIG } from '@/types';
import type { Game, ConsoleType, EmulatorCore } from '@/types';

/**
 * CDN base URL for EmulatorJS assets
 * Using 'latest' for best VSync and performance features
 */
const CDN_BASE_URL = 'https://cdn.emulatorjs.org/latest/data/';

/**
 * Global flag to track if EmulatorJS script has been loaded
 * This prevents the "redeclaration of let EJS_STORAGE" error
 */
let emulatorJsLoaded = false;
let emulatorJsLoading = false;
let emulatorJsLoadPromise: Promise<void> | null = null;


/**
 * Mapping from our console types to EmulatorJS core names
 */
const CORE_MAPPING: Record<ConsoleType, EmulatorCore> = {
  // Note: mednafen_psx_hw has WebAssembly issues in EmulatorJS (function signature mismatch)
  // Using pcsx_rearmed which also supports BIOS and is more stable in browsers
  ps1: 'pcsx_rearmed',
  nes: 'nes',
  snes: 'snes',
  n64: 'n64',
  gb: 'gb',
  gba: 'gba',
};

/**
 * Global EmulatorJS configuration interface
 */
declare global {
  interface Window {
    /** Target element ID for the emulator player */
    EJS_player: string;
    /** URL to the game ROM file */
    EJS_gameUrl: string;
    /** EmulatorJS core to use for this console */
    EJS_core: string;
    /** Path to EmulatorJS data files */
    EJS_pathtodata: string;
    /** Optional BIOS file URL */
    EJS_biosUrl?: string;
    /** UI accent color */
    EJS_color: string;
    /** Enable multi-threading */
    EJS_threads: boolean;
    /** Game display name */
    EJS_gameName?: string;
    /** Default volume (0-1) */
    EJS_volume?: number;
    /** Callback when emulator is ready */
    EJS_ready?: () => void;
    /** Callback when game starts playing */
    EJS_onGameStart?: () => void;
    /** Callback when save state is created */
    EJS_onSaveState?: (state: ArrayBuffer) => void;
    /** Callback when save state is loaded */
    EJS_onLoadState?: () => void;
    /** Auto-start game when loaded (skip "Start Game" button) */
    EJS_startOnLoaded?: boolean;
    /** Cache size limit in bytes */
    EJS_CacheLimit?: number;
    /** Enable background blur effect */
    EJS_backgroundBlur?: boolean;
    /** Custom starting state */
    EJS_loadStateURL?: string;
    /** Old save state format support */
    EJS_oldEJSNetplayServer?: boolean;
    /** Default control mappings per player */
    EJS_defaultControls?: Record<number, Record<number, { value: string; value2: string }>>;
    /** Emulator instance reference */
    EJS_emulator?: {
      pause: () => void;
      play: () => void;
      mute: () => void;
      unmute: () => void;
      setVolume: (volume: number) => void;
      toggleFullscreen?: () => void;
      elements: {
        menu: HTMLElement;
        fullscreen: HTMLElement;
      };
      gameManager: {
        saveState: () => Promise<ArrayBuffer>;
        loadState: (data: ArrayBuffer) => Promise<void>;
      };
    };
  }
}

/**
 * Emulator hook return type
 */
interface UseEmulatorReturn {
  /** Initialize the emulator with a game */
  initializeEmulator: (game: Game) => Promise<void>;
  /** Clean up emulator resources */
  cleanup: () => void;
  /** Whether the emulator is ready to play */
  isReady: boolean;
  /** Whether the emulator is currently loading */
  isLoading: boolean;
  /** Error message if initialization failed */
  error: string | null;
  /** Pause the game */
  pause: () => void;
  /** Resume the game */
  resume: () => void;
  /** Toggle mute state */
  toggleMute: () => void;
  /** Set volume (0-1) */
  setVolume: (volume: number) => void;
  /** Toggle fullscreen mode */
  toggleFullscreen: () => void;
  /** Toggle settings menu */
  toggleMenu: () => void;
  /** Save current state */
  saveState: () => Promise<ArrayBuffer | null>;
  /** Load a saved state */
  loadState: (data: ArrayBuffer) => Promise<void>;
}

/**
 * Hook for integrating EmulatorJS into React components.
 * Handles script loading, configuration, and lifecycle management.
 *
 * @param containerRef - Ref to the container element for the emulator
 * @param options - Configuration options
 * @returns Object with emulator control functions and state
 *
 * @example
 * ```tsx
 * function GamePlayer({ game }: { game: Game }) {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const {
 *     initializeEmulator,
 *     cleanup,
 *     isReady,
 *     isLoading,
 *     error,
 *     saveState,
 *     loadState,
 *   } = useEmulator(containerRef, {
 *     onReady: () => console.log('Emulator ready!'),
 *     onSaveState: (data) => saveToDatabase(game.id, data),
 *   });
 *
 *   useEffect(() => {
 *     initializeEmulator(game);
 *     return cleanup;
 *   }, [game.id]);
 *
 *   if (error) return <ErrorMessage message={error} />;
 *   if (isLoading) return <LoadingSpinner />;
 *
 *   return (
 *     <div ref={containerRef} className="emulator-container">
 *       <div id="emulator-player" />
 *     </div>
 *   );
 * }
 * ```
 */
export function useEmulator(
  containerRef: RefObject<HTMLDivElement | null>,
  options: {
    /** Callback when emulator is ready */
    onReady?: () => void;
    /** Callback when game starts */
    onGameStart?: () => void;
    /** Callback when save state is created */
    onSaveState?: (data: ArrayBuffer) => void;
    /** Callback when save state is loaded */
    onLoadState?: () => void;
    /** Callback on error */
    onError?: (error: string) => void;
    /** Default volume (0-1, default: 0.7) */
    defaultVolume?: number;
    /** UI accent color (default: '#6366f1') */
    accentColor?: string;
    /** Enable multi-threading (default: true) */
    enableThreads?: boolean;
  } = {}
): UseEmulatorReturn {
  const {
    onReady,
    onGameStart,
    onSaveState,
    onLoadState,
    onError,
    defaultVolume = 0.7,
    accentColor = '#6366f1',
    enableThreads = true,
  } = options;

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const isInitializedRef = useRef(false);
  const isCleaningUpRef = useRef(false);
  const isMountedRef = useRef(true);
  const initializationIdRef = useRef(0); // Track which initialization is current
  const callbacksRef = useRef({ onReady, onGameStart, onSaveState, onLoadState, onError });
  const originalGetContextRef = useRef<typeof HTMLCanvasElement.prototype.getContext | null>(null);

  // Track mounted state to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Keep callbacks ref updated
  useEffect(() => {
    callbacksRef.current = { onReady, onGameStart, onSaveState, onLoadState, onError };
  }, [onReady, onGameStart, onSaveState, onLoadState, onError]);

  /**
   * Clean up EmulatorJS resources and state
   */
  const cleanup = useCallback(() => {
    // Mark that we're cleaning up to prevent race conditions
    isCleaningUpRef.current = true;

    // Try to properly terminate EmulatorJS if it's running
    if (typeof window !== 'undefined') {
      try {
        // Try the terminate function (available in some versions)
        const win = window as unknown as { EJS_terminate?: () => void };
        if (typeof win.EJS_terminate === 'function') {
          win.EJS_terminate();
        }
        // Try to pause/stop the emulator
        if (window.EJS_emulator) {
          window.EJS_emulator.pause?.();
          // Some versions have exit/terminate methods
          const emu = window.EJS_emulator as Window['EJS_emulator'] & { exit?: () => void; terminate?: () => void };
          emu.exit?.();
          emu.terminate?.();
        }
      } catch {
        // Ignore errors during cleanup
      }
    }

    // NOTE: Do NOT remove EmulatorJS script - it causes "redeclaration of let EJS_STORAGE" error
    // when the script is loaded again. The script should stay loaded once added.
    scriptRef.current = null;

    // Restore original canvas getContext if we overrode it
    if (originalGetContextRef.current) {
      HTMLCanvasElement.prototype.getContext = originalGetContextRef.current;
      originalGetContextRef.current = null;
    }

    // Clean up global EmulatorJS variables
    if (typeof window !== 'undefined') {
      // @ts-expect-error - Cleaning up EmulatorJS global variables
      window.EJS_player = undefined;
      // @ts-expect-error - Cleaning up EmulatorJS global variables
      window.EJS_gameUrl = undefined;
      // @ts-expect-error - Cleaning up EmulatorJS global variables
      window.EJS_core = undefined;
      // @ts-expect-error - Cleaning up EmulatorJS global variables
      window.EJS_pathtodata = undefined;
      window.EJS_biosUrl = undefined;
      // @ts-expect-error - Cleaning up EmulatorJS global variables
      window.EJS_color = undefined;
      // @ts-expect-error - Cleaning up EmulatorJS global variables
      window.EJS_threads = undefined;
      window.EJS_gameName = undefined;
      window.EJS_volume = undefined;
      window.EJS_ready = undefined;
      window.EJS_onGameStart = undefined;
      window.EJS_onSaveState = undefined;
      window.EJS_onLoadState = undefined;
      window.EJS_emulator = undefined;
      // NOTE: Do NOT delete EJS_STORAGE, EJS_main, EJS_GameManager
      // These are internal EmulatorJS state that should persist to avoid redeclaration errors
    }

    // Clear container content
    if (containerRef.current) {
      const player = containerRef.current.querySelector('#emulator-player');
      if (player) {
        player.innerHTML = '';
      }
    }

    setIsReady(false);
    setIsLoading(false);
    setError(null);
    isInitializedRef.current = false;

    // Reset cleanup flag after a tick to allow new initialization
    setTimeout(() => {
      isCleaningUpRef.current = false;
    }, 0);
  }, [containerRef]);

  /**
   * Initialize the emulator with a game
   */
  const initializeEmulator = useCallback(
    async (game: Game) => {
      if (typeof window === 'undefined') {
        setError('Cannot initialize emulator in SSR environment');
        return;
      }

      // Don't initialize if component is unmounted
      if (!isMountedRef.current) {
        return;
      }

      // If already initialized, cleanup first (synchronously)
      if (isInitializedRef.current || scriptRef.current) {
        // Remove existing script
        if (scriptRef.current && scriptRef.current.parentNode) {
          scriptRef.current.parentNode.removeChild(scriptRef.current);
          scriptRef.current = null;
        }
        // Clear player container
        if (containerRef.current) {
          const player = containerRef.current.querySelector('#emulator-player');
          if (player) {
            player.innerHTML = '';
          }
        }
      }

      // Increment initialization ID to invalidate any pending operations from previous init
      const currentInitId = ++initializationIdRef.current;

      // Clear the player container but DON'T remove the EmulatorJS script
      // Removing and re-adding the script causes "redeclaration of let EJS_STORAGE" error
      const playerElement = document.getElementById('emulator-player');
      if (playerElement) {
        playerElement.innerHTML = '';
      }

      // Small delay to ensure cleanup is complete before reinitializing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if this initialization is still current (not superseded by another init)
      if (currentInitId !== initializationIdRef.current || !isMountedRef.current) {
        return;
      }

      setIsLoading(true);
      setError(null);
      isInitializedRef.current = true;
      isCleaningUpRef.current = false;

      try {
        // Get console configuration
        const consoleConfig = CONSOLE_CONFIG[game.console];
        if (!consoleConfig) {
          throw new Error(`Unknown console type: ${game.console}`);
        }

        // Get EmulatorJS core name
        const coreName = CORE_MAPPING[game.console];
        if (!coreName) {
          throw new Error(`No emulator core available for: ${game.console}`);
        }

        // Ensure container has a player element
        if (containerRef.current) {
          let playerElement = containerRef.current.querySelector('#emulator-player');
          if (!playerElement) {
            playerElement = document.createElement('div');
            playerElement.id = 'emulator-player';
            containerRef.current.appendChild(playerElement);
          }
        }

        // Configure EmulatorJS global variables
        window.EJS_player = '#emulator-player';
        window.EJS_gameUrl = game.romPath;
        window.EJS_core = coreName;
        window.EJS_pathtodata = CDN_BASE_URL;
        window.EJS_color = accentColor;
        window.EJS_threads = enableThreads;
        console.log('[EJS] Core:', coreName, '| Threads:', enableThreads);
        window.EJS_gameName = game.title;
        window.EJS_volume = defaultVolume;
        window.EJS_startOnLoaded = true; // Auto-start game without "Start Game" button
        window.EJS_CacheLimit = 1073741824; // 1GB cache limit

        // Performance settings for smooth frame pacing on high refresh rate monitors
        // @ts-expect-error - EmulatorJS config option
        window.EJS_defaultOptions = {
          'shader': 'crt-mattias.glslp',   // CRT shader for authentic retro look
          // RetroArch core options for frame pacing
          'video_vsync': 'enabled',        // VSync
          'video_frame_delay': '0',        // Minimize input latency
          'video_hard_sync': 'enabled',    // Hard GPU sync for better frame pacing
          'video_max_swapchain_images': '3', // Triple buffering
        };

        // Disable mouse/pointer lock - most retro games don't need it
        // @ts-expect-error - EmulatorJS config option
        window.EJS_mouse = false;

        // Override pointer lock to prevent "page has control over cursor" prompt
        // This applies to any element that tries to request pointer lock
        Element.prototype.requestPointerLock = function() {
          return Promise.resolve();
        };

        // Low-latency canvas optimization for high refresh rate monitors
        // Injects 'desynchronized' flag to bypass compositor for better frame pacing
        // See: https://developer.chrome.com/blog/desynchronized/
        if (!originalGetContextRef.current) {
          originalGetContextRef.current = HTMLCanvasElement.prototype.getContext;
          const originalGetContext = originalGetContextRef.current;
          HTMLCanvasElement.prototype.getContext = function(
            this: HTMLCanvasElement,
            contextType: string,
            contextAttributes?: Record<string, unknown>
          ) {
            if (contextType === 'webgl' || contextType === 'webgl2') {
              const enhancedAttributes = {
                ...contextAttributes,
                desynchronized: true,        // Low-latency mode - bypasses compositor
                preserveDrawingBuffer: true, // Prevents flicker with desynchronized
                powerPreference: 'high-performance', // Prefer discrete GPU
              };
              console.log('[EJS] Canvas context with low-latency mode:', contextType);
              return originalGetContext.call(this, contextType, enhancedAttributes);
            }
            return originalGetContext.call(this, contextType, contextAttributes);
          } as typeof HTMLCanvasElement.prototype.getContext;
        }

        // Configure default gamepad button mappings for PlayStation layout
        // EmulatorJS uses RetroArch/SNES button naming internally:
        //   Index 0 = B (PS Cross ✕)   |  Index 8 = A (PS Circle ○)
        //   Index 1 = Y (PS Square □)  |  Index 9 = X (PS Triangle △)
        // EmulatorJS gamepad button mapping (1-indexed):
        //   BUTTON_1 = Cross  |  BUTTON_2 = Circle  |  BUTTON_3 = Square  |  BUTTON_4 = Triangle
        window.EJS_defaultControls = {
          0: { // Player 1
            // Face buttons - map gamepad buttons to correct RetroArch indices
            0: { value: 'z', value2: 'BUTTON_1' },  // B / Cross ✕
            1: { value: 'a', value2: 'BUTTON_3' },  // Y / Square □
            8: { value: 'x', value2: 'BUTTON_2' },  // A / Circle ○
            9: { value: 's', value2: 'BUTTON_4' },  // X / Triangle △
            // D-Pad
            4: { value: 'up arrow', value2: 'DPAD_UP' },
            5: { value: 'down arrow', value2: 'DPAD_DOWN' },
            6: { value: 'left arrow', value2: 'DPAD_LEFT' },
            7: { value: 'right arrow', value2: 'DPAD_RIGHT' },
            // Start / Select
            2: { value: 'shift', value2: 'SELECT' },
            3: { value: 'enter', value2: 'START' },
            // Shoulder buttons
            10: { value: 'q', value2: 'LEFT_TOP_SHOULDER' },    // L1
            11: { value: 'e', value2: 'RIGHT_TOP_SHOULDER' },   // R1
            12: { value: 'tab', value2: 'LEFT_BOTTOM_SHOULDER' }, // L2
            13: { value: 'r', value2: 'RIGHT_BOTTOM_SHOULDER' }, // R2
            // Stick buttons
            14: { value: '', value2: 'LEFT_STICK' },  // L3
            15: { value: '', value2: 'RIGHT_STICK' }, // R3
            // Left analog stick
            16: { value: 'd', value2: 'LEFT_STICK_X:+1' },
            17: { value: 'g', value2: 'LEFT_STICK_X:-1' },
            18: { value: 'v', value2: 'LEFT_STICK_Y:+1' },
            19: { value: 'b', value2: 'LEFT_STICK_Y:-1' },
            // Right analog stick
            20: { value: 'l', value2: 'RIGHT_STICK_X:+1' },
            21: { value: 'j', value2: 'RIGHT_STICK_X:-1' },
            22: { value: 'k', value2: 'RIGHT_STICK_Y:+1' },
            23: { value: 'i', value2: 'RIGHT_STICK_Y:-1' },
          },
          1: {}, // Player 2 - use defaults
          2: {}, // Player 3 - use defaults
          3: {}, // Player 4 - use defaults
        };

        // Set BIOS URL if required
        if (consoleConfig.requiresBios && consoleConfig.biosFiles?.length) {
          const primaryBios = consoleConfig.biosFiles.find((b) => b.required) || consoleConfig.biosFiles[0];
          if (primaryBios && consoleConfig.biosPath) {
            const biosUrl = `${consoleConfig.biosPath}/${primaryBios.name}`;
            console.log('[EJS] Setting BIOS URL:', biosUrl);
            window.EJS_biosUrl = biosUrl;
          }
        } else {
          console.log('[EJS] No BIOS required for this console');
        }

        // Set up callbacks
        window.EJS_ready = () => {
          // Don't update state if we're cleaning up or unmounted
          if (isCleaningUpRef.current || !isMountedRef.current) return;
          setIsLoading(false);
          setIsReady(true);
          callbacksRef.current.onReady?.();
        };

        window.EJS_onGameStart = () => {
          // Don't fire callback if we're cleaning up or unmounted
          if (isCleaningUpRef.current || !isMountedRef.current) return;
          callbacksRef.current.onGameStart?.();
        };

        window.EJS_onSaveState = (state: ArrayBuffer) => {
          callbacksRef.current.onSaveState?.(state);
        };

        window.EJS_onLoadState = () => {
          callbacksRef.current.onLoadState?.();
        };

        // Load EmulatorJS script - only once to prevent "redeclaration of let EJS_STORAGE" error
        if (emulatorJsLoaded) {
          // Script already loaded - need to reinitialize EmulatorJS
          // EmulatorJS doesn't have a clean reinit API, so we need a workaround
          console.log('[EJS] Script already loaded, attempting reinitialize...');

          // Try to use existing emulator or wait for it to reinitialize
          // EmulatorJS should pick up the new config when the player element is recreated
          const checkReady = () => {
            if (!isMountedRef.current || currentInitId !== initializationIdRef.current) return;

            if (window.EJS_emulator) {
              console.log('[EJS] Emulator instance found');
              setIsLoading(false);
              setIsReady(true);
              callbacksRef.current.onReady?.();
            } else {
              // EmulatorJS may need more time - the fallback detection in EmulatorContainer will help
              console.log('[EJS] Waiting for emulator instance...');
            }
          };

          // Give EmulatorJS time to initialize with new config
          setTimeout(checkReady, 1000);
          setTimeout(checkReady, 2500);
          setTimeout(checkReady, 5000);
        } else if (emulatorJsLoading) {
          // Script is currently loading, wait for it
          console.log('[EJS] Script is loading, waiting...');
          emulatorJsLoadPromise?.then(() => {
            if (!isMountedRef.current || currentInitId !== initializationIdRef.current) return;
            if (window.EJS_emulator) {
              setIsLoading(false);
              setIsReady(true);
              callbacksRef.current.onReady?.();
            }
          });
        } else {
          // First time loading the script
          emulatorJsLoading = true;

          emulatorJsLoadPromise = new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${CDN_BASE_URL}loader.js`;
            script.async = true;

            script.onload = () => {
              emulatorJsLoaded = true;
              emulatorJsLoading = false;
              console.log('[EJS] Script loaded successfully');
              resolve();
            };

            script.onerror = () => {
              emulatorJsLoading = false;
              const errorMessage = 'Failed to load EmulatorJS script. Please refresh the page to retry.';
              setError(errorMessage);
              setIsLoading(false);
              callbacksRef.current.onError?.(errorMessage);
              reject(new Error(errorMessage));
            };

            document.body.appendChild(script);
            scriptRef.current = script;
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error initializing emulator';
        setError(errorMessage);
        setIsLoading(false);
        callbacksRef.current.onError?.(errorMessage);
      }
    },
    [containerRef, accentColor, enableThreads, defaultVolume]
  );

  /**
   * Pause the game
   */
  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && window.EJS_emulator) {
      window.EJS_emulator.pause();
    }
  }, []);

  /**
   * Resume the game
   */
  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && window.EJS_emulator) {
      window.EJS_emulator.play();
    }
  }, []);

  /**
   * Toggle mute state
   */
  const toggleMute = useCallback(() => {
    if (typeof window === 'undefined' || !window.EJS_emulator) {
      return;
    }
    // EmulatorJS doesn't expose isMuted state directly, so we track it
    // This is a simplified implementation
    window.EJS_emulator.mute();
  }, []);

  /**
   * Set volume level
   */
  const setVolume = useCallback((volume: number) => {
    if (typeof window !== 'undefined' && window.EJS_emulator) {
      try {
        window.EJS_emulator.setVolume(Math.max(0, Math.min(1, volume)));
      } catch (err) {
        // Emulator module may not be fully initialized yet
        console.warn('setVolume failed (emulator may not be ready):', err);
      }
    }
  }, []);

  /**
   * Toggle fullscreen mode on the emulator container
   */
  const toggleFullscreen = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      // Find the emulator game container
      const player = document.getElementById('emulator-player');
      const gameContainer = player?.querySelector('#game') as HTMLElement
        || player?.querySelector('canvas')?.parentElement as HTMLElement
        || player;

      if (!gameContainer) return;

      // Toggle fullscreen using browser API
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        gameContainer.requestFullscreen().catch(() => {});
      }
    } catch {
      // Silently ignore fullscreen errors
    }
  }, []);

  /**
   * Toggle settings menu
   */
  const toggleMenu = useCallback(() => {
    if (typeof window !== 'undefined' && window.EJS_emulator?.elements?.menu) {
      try {
        // Click the menu button to toggle it
        window.EJS_emulator.elements.menu.click();
      } catch (err) {
        console.warn('toggleMenu failed:', err);
      }
    }
  }, []);

  /**
   * Create a save state
   */
  const saveState = useCallback(async (): Promise<ArrayBuffer | null> => {
    if (typeof window === 'undefined' || !window.EJS_emulator?.gameManager) {
      return null;
    }

    try {
      return await window.EJS_emulator.gameManager.saveState();
    } catch (err) {
      console.error('Failed to save state:', err);
      return null;
    }
  }, []);

  /**
   * Load a save state
   */
  const loadState = useCallback(async (data: ArrayBuffer): Promise<void> => {
    if (typeof window === 'undefined' || !window.EJS_emulator?.gameManager) {
      throw new Error('Emulator not initialized');
    }

    try {
      await window.EJS_emulator.gameManager.loadState(data);
    } catch (err) {
      console.error('Failed to load state:', err);
      throw err;
    }
  }, []);

  // Clean up on unmount - use a separate effect that doesn't depend on cleanup
  useEffect(() => {
    return () => {
      // Mark as unmounted first
      isMountedRef.current = false;
      isCleaningUpRef.current = true;

      // NOTE: Do NOT remove EmulatorJS script on unmount
      // This causes "redeclaration of let EJS_STORAGE" error on remount
      scriptRef.current = null;

      // Clean up callbacks but preserve internal EJS state
      if (typeof window !== 'undefined') {
        window.EJS_ready = undefined;
        window.EJS_onGameStart = undefined;
        window.EJS_onSaveState = undefined;
        window.EJS_onLoadState = undefined;
        // Don't clear EJS_emulator - let EmulatorJS manage its own lifecycle
      }

      isInitializedRef.current = false;
    };
  }, []);

  return {
    initializeEmulator,
    cleanup,
    isReady,
    isLoading,
    error,
    pause,
    resume,
    toggleMute,
    setVolume,
    toggleFullscreen,
    toggleMenu,
    saveState,
    loadState,
  };
}

/**
 * Hook to check if EmulatorJS is supported in the current browser.
 *
 * @returns boolean indicating EmulatorJS support
 *
 * @example
 * ```tsx
 * function GamePage() {
 *   const isEmulatorSupported = useEmulatorSupport();
 *
 *   if (!isEmulatorSupported) {
 *     return <BrowserNotSupported />;
 *   }
 *
 *   return <GamePlayer />;
 * }
 * ```
 */
export function useEmulatorSupport(): boolean {
  const [supported] = useState(() => {
    // Initial check - runs synchronously during component mount
    if (typeof window === 'undefined') {
      return false;
    }

    const hasWebAssembly = typeof WebAssembly !== 'undefined';
    const hasWorkers = typeof Worker !== 'undefined';
    const hasIndexedDB = typeof indexedDB !== 'undefined';
    const hasCanvas = typeof document !== 'undefined' && !!document.createElement('canvas').getContext;

    return hasWebAssembly && hasWorkers && hasIndexedDB && hasCanvas;
  });

  return supported;
}

// Export CDN URL for external use
export { CDN_BASE_URL, CORE_MAPPING };
