/**
 * Emulator Store - Zustand v5
 * Manages emulator state, game loading, and playback settings
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Game } from '../types';

// =============================================================================
// Types
// =============================================================================

interface EmulatorStoreState {
  // Current game
  currentGame: Game | null;
  isPlaying: boolean;
  isLoading: boolean;
  loadProgress: number;

  // Settings
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  showVirtualGamepad: boolean;

  // Actions
  loadGame: (game: Game) => void;
  unloadGame: () => void;
  setPlaying: (playing: boolean) => void;
  setLoading: (loading: boolean, progress?: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setFullscreen: (isFullscreen: boolean) => void;
  toggleVirtualGamepad: () => void;
}

// =============================================================================
// Default Values
// =============================================================================

const DEFAULT_VOLUME = 0.7;
const MIN_VOLUME = 0;
const MAX_VOLUME = 1;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Clamp volume value between 0 and 1
 */
function clampVolume(volume: number): number {
  return Math.max(MIN_VOLUME, Math.min(MAX_VOLUME, volume));
}

/**
 * Clamp progress value between 0 and 100
 */
function clampProgress(progress: number): number {
  return Math.max(0, Math.min(100, progress));
}

// =============================================================================
// Store Definition
// =============================================================================

export const useEmulatorStore = create<EmulatorStoreState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentGame: null,
      isPlaying: false,
      isLoading: false,
      loadProgress: 0,
      volume: DEFAULT_VOLUME,
      isMuted: false,
      isFullscreen: false,
      showVirtualGamepad: false,

      // Actions
      loadGame: (game: Game) => {
        // Reset state when loading a new game
        set({
          currentGame: game,
          isPlaying: false,
          isLoading: true,
          loadProgress: 0,
          isFullscreen: false,
        });
      },

      unloadGame: () => {
        set({
          currentGame: null,
          isPlaying: false,
          isLoading: false,
          loadProgress: 0,
          isFullscreen: false,
        });
      },

      setPlaying: (playing: boolean) => {
        const { currentGame, isLoading } = get();

        // Can only play if a game is loaded and not currently loading
        if (playing && (!currentGame || isLoading)) {
          return;
        }

        set({ isPlaying: playing });
      },

      setLoading: (loading: boolean, progress?: number) => {
        const updates: Partial<EmulatorStoreState> = {
          isLoading: loading,
        };

        if (progress !== undefined) {
          updates.loadProgress = clampProgress(progress);
        }

        // If loading is complete, reset progress
        if (!loading) {
          updates.loadProgress = 0;
        }

        set(updates);
      },

      setVolume: (volume: number) => {
        const clampedVolume = clampVolume(volume);

        set({
          volume: clampedVolume,
          // Auto-unmute when setting volume above 0
          isMuted: clampedVolume === 0 ? get().isMuted : false,
        });
      },

      toggleMute: () => {
        set((state) => ({
          isMuted: !state.isMuted,
        }));
      },

      setFullscreen: (isFullscreen: boolean) => {
        set({ isFullscreen });
      },

      toggleVirtualGamepad: () => {
        set((state) => ({
          showVirtualGamepad: !state.showVirtualGamepad,
        }));
      },
    }),
    {
      name: 'retro-gaming-emulator-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist volume and muted state to localStorage
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        showVirtualGamepad: state.showVirtualGamepad,
      }),
    }
  )
);

// =============================================================================
// Selectors (for optimized re-renders)
// =============================================================================

/**
 * Select current game
 */
export const selectCurrentGame = (state: EmulatorStoreState) =>
  state.currentGame;

/**
 * Select playing state
 */
export const selectIsPlaying = (state: EmulatorStoreState) => state.isPlaying;

/**
 * Select loading state
 */
export const selectIsLoading = (state: EmulatorStoreState) => state.isLoading;

/**
 * Select load progress
 */
export const selectLoadProgress = (state: EmulatorStoreState) =>
  state.loadProgress;

/**
 * Select volume settings
 */
export const selectVolumeSettings = (state: EmulatorStoreState) => ({
  volume: state.volume,
  isMuted: state.isMuted,
});

/**
 * Select effective volume (0 if muted)
 */
export const selectEffectiveVolume = (state: EmulatorStoreState) =>
  state.isMuted ? 0 : state.volume;

/**
 * Select fullscreen state
 */
export const selectIsFullscreen = (state: EmulatorStoreState) =>
  state.isFullscreen;

/**
 * Select virtual gamepad visibility
 */
export const selectShowVirtualGamepad = (state: EmulatorStoreState) =>
  state.showVirtualGamepad;

/**
 * Check if a game is currently loaded
 */
export const selectHasGameLoaded = (state: EmulatorStoreState) =>
  state.currentGame !== null;

/**
 * Select current game console type
 */
export const selectCurrentConsole = (state: EmulatorStoreState) =>
  state.currentGame?.console ?? null;

/**
 * Select emulator ready state (game loaded and not loading)
 */
export const selectIsReady = (state: EmulatorStoreState) =>
  state.currentGame !== null && !state.isLoading;
