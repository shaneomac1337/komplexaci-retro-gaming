/**
 * PlayPage Component
 *
 * Simple page for playing retro games using EmulatorJS.
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores';
import { usePlaySession } from '@/hooks/useRecentlyPlayed';
import { EmulatorContainer, EmulatorBezel } from '@/components/emulator';
import styles from './PlayPage.module.css';

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
