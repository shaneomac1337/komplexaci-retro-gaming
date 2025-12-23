/**
 * useSound Hook
 * Manage sound effects for UI interactions
 */

import { useCallback, useRef, useEffect } from 'react';

export interface SoundConfig {
  volume?: number;
  playbackRate?: number;
  loop?: boolean;
}

export interface SoundLibrary {
  [key: string]: string; // key: sound name, value: audio file path
}

/**
 * Default sound library paths
 * Replace these with your actual sound file paths
 */
const DEFAULT_SOUNDS: SoundLibrary = {
  hover: '/sounds/hover.mp3',
  click: '/sounds/click.mp3',
  whoosh: '/sounds/whoosh.mp3',
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  transition: '/sounds/transition.mp3',
  play: '/sounds/play.mp3',
  favorite: '/sounds/favorite.mp3',
};

/**
 * useSound Hook
 * Provides sound playback functionality with volume control and caching
 */
export function useSound(customSounds?: SoundLibrary) {
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const sounds = { ...DEFAULT_SOUNDS, ...customSounds };

  // Preload audio files
  useEffect(() => {
    Object.entries(sounds).forEach(([key, path]) => {
      if (!audioCache.current.has(key)) {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audioCache.current.set(key, audio);
      }
    });

    // Cleanup
    return () => {
      audioCache.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioCache.current.clear();
    };
  }, [sounds]);

  /**
   * Play a sound by name
   */
  const play = useCallback(
    (soundName: string, config: SoundConfig = {}) => {
      const audio = audioCache.current.get(soundName);
      if (!audio) {
        console.warn(`Sound "${soundName}" not found in library`);
        return;
      }

      // Clone the audio to allow overlapping plays
      const clone = audio.cloneNode(true) as HTMLAudioElement;

      // Apply configuration
      clone.volume = config.volume ?? 0.3;
      clone.playbackRate = config.playbackRate ?? 1;
      clone.loop = config.loop ?? false;

      // Play with error handling
      clone.play().catch((error) => {
        // Silently ignore autoplay policy errors
        if (error.name !== 'NotAllowedError') {
          console.error(`Error playing sound "${soundName}":`, error);
        }
      });

      // Cleanup after playback
      if (!config.loop) {
        clone.addEventListener('ended', () => {
          clone.remove();
        });
      }

      return clone;
    },
    []
  );

  /**
   * Stop a specific sound or all sounds
   */
  const stop = useCallback((soundName?: string) => {
    if (soundName) {
      const audio = audioCache.current.get(soundName);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    } else {
      // Stop all sounds
      audioCache.current.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    }
  }, []);

  /**
   * Set global volume for all future sounds
   */
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    audioCache.current.forEach((audio) => {
      audio.volume = clampedVolume;
    });
  }, []);

  return {
    play,
    stop,
    setVolume,
  };
}

/**
 * Predefined sound effect helpers
 */
export function useSoundEffects() {
  const { play } = useSound();

  return {
    playHover: () => play('hover', { volume: 0.2 }),
    playClick: () => play('click', { volume: 0.3 }),
    playWhoosh: () => play('whoosh', { volume: 0.25 }),
    playSuccess: () => play('success', { volume: 0.4 }),
    playError: () => play('error', { volume: 0.4 }),
    playTransition: () => play('transition', { volume: 0.3 }),
    playGameStart: () => play('play', { volume: 0.5 }),
    playFavorite: () => play('favorite', { volume: 0.3 }),
  };
}

/**
 * Example usage:
 *
 * function GameCard() {
 *   const { playHover, playClick } = useSoundEffects();
 *
 *   return (
 *     <div
 *       onMouseEnter={playHover}
 *       onClick={playClick}
 *     >
 *       Game Card
 *     </div>
 *   );
 * }
 */
