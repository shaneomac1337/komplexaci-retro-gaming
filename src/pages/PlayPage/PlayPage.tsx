/**
 * PlayPage Component
 *
 * Simple page for playing retro games using EmulatorJS.
 */

import { useCallback, useEffect, useState, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores';
import { usePlaySession } from '@/hooks/useRecentlyPlayed';
import { EmulatorContainer, EmulatorBezel, BrowserWarning } from '@/components/emulator';
import styles from './PlayPage.module.css';

/**
 * Check if EmulatorJS has been previously loaded in this JS context.
 * EmulatorJS uses `let` declarations that can't be redeclared, so we need
 * a fresh page load if the script was already loaded.
 */
function checkEmulatorJsPreviouslyLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  // Check for EmulatorJS internal state that persists between React navigations
  return !!(
    // @ts-expect-error - EmulatorJS internal
    window.EJS_STORAGE ||
    // @ts-expect-error - EmulatorJS internal
    window.EJS_main ||
    // @ts-expect-error - EmulatorJS internal
    window.EJS_GameManager
  );
}

// Track if we've already checked for reload to avoid infinite loops
let hasCheckedForReload = false;

/**
 * PlayPage - Main game playing interface
 */
export function PlayPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  // Get game from store
  const getGameById = useGameStore((state) => state.getGameById);
  const isGamesLoading = useGameStore((state) => state.isLoading);
  const game = gameId ? getGameById(gameId) : undefined;

  // Track play session (starts automatically when game loads)
  usePlaySession(gameId ?? '', {
    autoStart: !!game,
  });

  // Local state
  const [, setIsEmulatorReady] = useState(false);
  const [browserWarningDismissed, setBrowserWarningDismissed] = useState(false);
  const [shouldShowEmulator, setShouldShowEmulator] = useState(false);

  // Force page reload if EmulatorJS was previously loaded in this JS context
  // This is necessary because EmulatorJS uses `let` declarations that can't be redeclared
  useLayoutEffect(() => {
    // Only check once per page session to avoid infinite reload loops
    if (hasCheckedForReload) return;
    hasCheckedForReload = true;

    if (checkEmulatorJsPreviouslyLoaded()) {
      console.log('[PlayPage] EmulatorJS previously loaded, forcing page reload for fresh context');
      // Use location.reload() to get a fresh JS context
      window.location.reload();
    }
  }, []);

  // Update document title
  useEffect(() => {
    if (game) {
      document.title = `${game.title} - RetroGaming`;
    } else {
      document.title = 'Game Not Found - RetroGaming';
    }

    return () => {
      document.title = 'RetroGaming';
    };
  }, [game]);

  // Redirect if game not found (only after games have loaded)
  useEffect(() => {
    // Don't redirect while games are still loading
    if (isGamesLoading) return;

    if (gameId && !game) {
      // Small delay to ensure store is fully updated
      const timer = setTimeout(() => {
        const currentGame = getGameById(gameId);
        if (!currentGame) {
          navigate('/browse', { replace: true });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [gameId, game, getGameById, navigate, isGamesLoading]);

  // Handle emulator ready
  const handleEmulatorReady = useCallback(() => {
    setIsEmulatorReady(true);
  }, []);

  // Handle emulator error
  const handleEmulatorError = useCallback((errorMessage: string) => {
    setIsEmulatorReady(false);
    console.error('Emulator error:', errorMessage);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate('/browse');
  }, [navigate]);

  // Handle browser warning dismiss (go back)
  const handleBrowserWarningDismiss = useCallback(() => {
    setBrowserWarningDismissed(true);
    navigate('/browse');
  }, [navigate]);

  // Handle browser warning continue
  const handleBrowserWarningContinue = useCallback(() => {
    setBrowserWarningDismissed(true);
    setShouldShowEmulator(true);
  }, []);

  // Show loading state if game not yet loaded
  if (!game) {
    return (
      <div className={styles.loading} role="status" aria-live="polite" aria-busy="true">
        <div className={styles.loadingSpinner} aria-hidden="true" />
        <p>Loading game...</p>
        <span className="sr-only">Loading game, please wait...</span>
      </div>
    );
  }

  // Show browser warning for Firefox users before loading emulator
  if (!browserWarningDismissed && !shouldShowEmulator) {
    return (
      <div className={styles.playSimple}>
        <BrowserWarning
          onDismiss={handleBrowserWarningDismiss}
          onContinue={handleBrowserWarningContinue}
        />
      </div>
    );
  }

  return (
    <div className={styles.playSimple}>
      <EmulatorBezel
        gameTitle={game.title}
        console={game.console}
      >
        <EmulatorContainer
          game={game}
          onReady={handleEmulatorReady}
          onError={handleEmulatorError}
          onBack={handleBack}
        />
      </EmulatorBezel>
    </div>
  );
}

export default PlayPage;
