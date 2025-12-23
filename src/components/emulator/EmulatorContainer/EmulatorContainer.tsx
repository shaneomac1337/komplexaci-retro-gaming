/**
 * EmulatorContainer Component
 *
 * Main container for the EmulatorJS player.
 * Handles initialization, loading states, error handling, cleanup,
 * and keyboard shortcuts (ESC for menu, F for fullscreen).
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useEmulator } from '@/hooks/useEmulator';
import { useEmulatorStore } from '@/stores/emulatorStore';
import { LoadingOverlay } from '../LoadingOverlay';
import { ErrorOverlay } from '../ErrorOverlay';
import type { Game } from '@/types';
import styles from './EmulatorContainer.module.css';

export interface EmulatorContainerProps {
  /** Game to load and play */
  game: Game;
  /** Callback when emulator is ready to play */
  onReady?: () => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** Callback when user clicks back in error overlay */
  onBack?: () => void;
}

/**
 * Loading status messages based on progress
 */
function getLoadingStatus(progress: number): string {
  if (progress < 15) return 'Initializing emulator...';
  if (progress < 40) return 'Loading core...';
  if (progress < 70) return 'Loading ROM...';
  if (progress < 90) return 'Preparing game...';
  return 'Starting...';
}

/**
 * Main emulator container component.
 * Integrates with EmulatorJS through the useEmulator hook.
 */
function EmulatorContainerComponent({
  game,
  onReady,
  onError,
  onBack,
}: EmulatorContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [showCustomLoader, setShowCustomLoader] = useState(true);

  // Track if loading has been completed to prevent duplicate handling
  // This is needed because EJS_startOnLoaded may cause onGameStart to fire without onReady
  const hasCompletedLoadingRef = useRef(false);

  // Store actions
  const setLoading = useEmulatorStore((state) => state.setLoading);
  const setPlaying = useEmulatorStore((state) => state.setPlaying);
  const loadGame = useEmulatorStore((state) => state.loadGame);
  const unloadGame = useEmulatorStore((state) => state.unloadGame);
  const storeVolume = useEmulatorStore((state) => state.volume);

  /**
   * Complete the loading sequence - called when emulator is ready or game starts.
   * Uses ref to ensure this only runs once even if both callbacks fire.
   */
  const completeLoading = useCallback(() => {
    if (hasCompletedLoadingRef.current) return;
    hasCompletedLoadingRef.current = true;

    setLoadProgress(100);
    // Small delay to show 100% before hiding
    setTimeout(() => {
      setShowCustomLoader(false);
      setLoading(false);
      setPlaying(true);
      onReady?.();
    }, 300);
  }, [setLoading, setPlaying, onReady]);

  // Emulator hook
  const {
    initializeEmulator,
    cleanup,
    isReady,
    error,
    setVolume,
    toggleFullscreen,
    toggleMenu,
  } = useEmulator(containerRef, {
    onReady: () => {
      // Complete loading when emulator signals ready
      completeLoading();
    },
    onGameStart: () => {
      // Also complete loading here - with EJS_startOnLoaded, game may start
      // before or without EJS_ready being called
      completeLoading();
      setPlaying(true);
    },
    onError: (err) => {
      setShowCustomLoader(false);
      setLoading(false);
      setPlaying(false);
      onError?.(err);
    },
    defaultVolume: storeVolume,
    accentColor: '#00ffff',
    enableThreads: false, // Disable threading for better frame pacing on high refresh rate monitors
  });

  // Initialize emulator when game changes or on retry
  useEffect(() => {
    if (!game) return;

    // Reset loading state
    setShowCustomLoader(true);
    setLoadProgress(0);
    hasCompletedLoadingRef.current = false; // Reset completion flag for new game

    loadGame(game);
    setLoading(true);
    initializeEmulator(game);

    return () => {
      cleanup();
      unloadGame();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.id, retryCount]);

  // Animate loading progress smoothly
  useEffect(() => {
    if (!showCustomLoader || isReady) return;

    // Animate progress in stages
    const stages = [
      { target: 10, delay: 100 },
      { target: 25, delay: 400 },
      { target: 45, delay: 800 },
      { target: 65, delay: 1500 },
      { target: 80, delay: 2500 },
      { target: 90, delay: 4000 },
    ];

    const timers: ReturnType<typeof setTimeout>[] = [];

    stages.forEach(({ target, delay }) => {
      const timer = setTimeout(() => {
        if (!isReady) {
          setLoadProgress((prev) => Math.max(prev, target));
        }
      }, delay);
      timers.push(timer);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [showCustomLoader, isReady, game.id, retryCount]);

  // Sync volume with store - delay slightly to ensure emulator module is fully ready
  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        try {
          setVolume(storeVolume);
        } catch (err) {
          console.warn('Failed to set initial volume:', err);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReady, storeVolume, setVolume]);

  // Keyboard shortcuts: F = fullscreen, ESC = menu
  useEffect(() => {
    if (!isReady) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // F key - Toggle EmulatorJS fullscreen
      if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        toggleFullscreen();
        return;
      }

      // ESC - Toggle settings menu
      if (event.key === 'Escape') {
        event.preventDefault();
        toggleMenu();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isReady, toggleFullscreen, toggleMenu]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    cleanup();
    unloadGame();
    onBack?.();
  }, [cleanup, unloadGame, onBack]);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      data-testid="emulator-container"
    >
      {/* EmulatorJS will inject the player here */}
      <div id="emulator-player" className={styles.player} />

      {/* Custom Loading Overlay */}
      {showCustomLoader && !error && (
        <LoadingOverlay
          gameName={game.title}
          progress={loadProgress}
          status={getLoadingStatus(loadProgress)}
        />
      )}

      {/* Error Overlay */}
      {error && (
        <ErrorOverlay
          error={error}
          onRetry={handleRetry}
          onBack={onBack ? handleBack : undefined}
        />
      )}
    </div>
  );
}

export const EmulatorContainer = memo(EmulatorContainerComponent);
EmulatorContainer.displayName = 'EmulatorContainer';
