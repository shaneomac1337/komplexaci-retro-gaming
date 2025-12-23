/**
 * EmulatorControls Component
 *
 * Control bar below the emulator with volume, fullscreen, save/load,
 * and playback controls. Connects to the emulator store for state management.
 */

import { memo, useCallback, useEffect, useRef } from 'react';
import { useEmulatorStore } from '@/stores/emulatorStore';
import { useFullscreen } from '@/hooks/useFullscreen';
import { VolumeControl } from '../VolumeControl';
import styles from './EmulatorControls.module.css';

export interface EmulatorControlsProps {
  /** Callback when save panel toggle is requested */
  onToggleSavePanel?: () => void;
  /** Ref to the emulator container for fullscreen */
  emulatorRef?: React.RefObject<HTMLElement | null>;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Play icon
 */
function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <polygon points="5,3 19,12 5,21 5,3" />
    </svg>
  );
}

/**
 * Pause icon
 */
function PauseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

/**
 * Save icon
 */
function SaveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19,21H5a2,2,0,0,1-2-2V5A2,2,0,0,1,5,3H16l5,5V19A2,2,0,0,1,19,21Z" />
      <polyline points="17,21 17,13 7,13 7,21" />
      <polyline points="7,3 7,8 15,8" />
    </svg>
  );
}

/**
 * Settings icon
 */
function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4,15a1.65,1.65,0,0,0,.33,1.82l.06.06a2,2,0,0,1,0,2.83,2,2,0,0,1-2.83,0l-.06-.06a1.65,1.65,0,0,0-1.82-.33,1.65,1.65,0,0,0-1,1.51V21a2,2,0,0,1-4,0v-.09A1.65,1.65,0,0,0,9,19.4a1.65,1.65,0,0,0-1.82.33l-.06.06a2,2,0,0,1-2.83,0,2,2,0,0,1,0-2.83l.06-.06a1.65,1.65,0,0,0,.33-1.82,1.65,1.65,0,0,0-1.51-1H3a2,2,0,0,1,0-4h.09A1.65,1.65,0,0,0,4.6,9a1.65,1.65,0,0,0-.33-1.82l-.06-.06a2,2,0,0,1,2.83-2.83l.06.06a1.65,1.65,0,0,0,1.82.33H9a1.65,1.65,0,0,0,1-1.51V3a2,2,0,0,1,4,0v.09a1.65,1.65,0,0,0,1,1.51,1.65,1.65,0,0,0,1.82-.33l.06-.06a2,2,0,0,1,2.83,2.83l-.06.06a1.65,1.65,0,0,0-.33,1.82V9a1.65,1.65,0,0,0,1.51,1H21a2,2,0,0,1,0,4h-.09A1.65,1.65,0,0,0,19.4,15Z" />
    </svg>
  );
}

/**
 * Gamepad icon
 */
function GamepadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="15" y1="13" x2="15.01" y2="13" />
      <line x1="18" y1="11" x2="18.01" y2="11" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  );
}

/**
 * Fullscreen expand icon
 */
function ExpandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15,3 21,3 21,9" />
      <polyline points="9,21 3,21 3,15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

/**
 * Fullscreen compress icon
 */
function CompressIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="4,14 10,14 10,20" />
      <polyline points="20,10 14,10 14,4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

/**
 * Emulator controls component with playback, volume, and fullscreen controls.
 */
function EmulatorControlsComponent({
  onToggleSavePanel,
  emulatorRef,
  className = '',
}: EmulatorControlsProps) {
  const controlsRef = useRef<HTMLDivElement>(null);

  // Store state
  const isPlaying = useEmulatorStore((state) => state.isPlaying);
  const isLoading = useEmulatorStore((state) => state.isLoading);
  const volume = useEmulatorStore((state) => state.volume);
  const isMuted = useEmulatorStore((state) => state.isMuted);
  const showVirtualGamepad = useEmulatorStore((state) => state.showVirtualGamepad);

  // Store actions
  const setPlaying = useEmulatorStore((state) => state.setPlaying);
  const setVolume = useEmulatorStore((state) => state.setVolume);
  const toggleMute = useEmulatorStore((state) => state.toggleMute);
  const toggleVirtualGamepad = useEmulatorStore((state) => state.toggleVirtualGamepad);
  const setFullscreen = useEmulatorStore((state) => state.setFullscreen);

  // Fullscreen hook - use emulatorRef if provided, otherwise use controls parent
  const { isFullscreen, toggleFullscreen, isSupported: isFullscreenSupported } = useFullscreen(
    emulatorRef ?? { current: null }
  );

  // Sync fullscreen state with store
  useEffect(() => {
    setFullscreen(isFullscreen);
  }, [isFullscreen, setFullscreen]);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (typeof window !== 'undefined' && window.EJS_emulator) {
      if (isPlaying) {
        window.EJS_emulator.pause();
        setPlaying(false);
      } else {
        window.EJS_emulator.play();
        setPlaying(true);
      }
    }
  }, [isPlaying, setPlaying]);

  // Handle volume change
  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      // Convert from 0-100 to 0-1 for the emulator
      const normalizedVolume = newVolume / 100;
      setVolume(normalizedVolume);

      if (typeof window !== 'undefined' && window.EJS_emulator) {
        window.EJS_emulator.setVolume(normalizedVolume);
      }
    },
    [setVolume]
  );

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    toggleMute();

    if (typeof window !== 'undefined' && window.EJS_emulator) {
      const newMuted = !isMuted;
      if (newMuted) {
        window.EJS_emulator.mute();
      } else {
        window.EJS_emulator.unmute();
      }
    }
  }, [isMuted, toggleMute]);

  // Handle fullscreen toggle
  const handleFullscreenToggle = useCallback(() => {
    if (isFullscreenSupported) {
      toggleFullscreen();
    }
  }, [isFullscreenSupported, toggleFullscreen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if in input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Skip if loading
      if (isLoading) return;

      switch (event.key.toLowerCase()) {
        case ' ':
          // Space bar toggles play/pause
          event.preventDefault();
          handlePlayPause();
          break;
        case 'm':
          // M toggles mute
          event.preventDefault();
          handleMuteToggle();
          break;
        case 'f':
          // F toggles fullscreen
          event.preventDefault();
          handleFullscreenToggle();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLoading, handlePlayPause, handleMuteToggle, handleFullscreenToggle]);

  // Disable controls while loading
  const isDisabled = isLoading;

  return (
    <div
      ref={controlsRef}
      className={`${styles.controls} ${className}`}
      role="toolbar"
      aria-label="Emulator controls"
    >
      {/* Left Section - Playback Controls */}
      <div className={styles.section}>
        <button
          type="button"
          className={styles.controlButton}
          onClick={handlePlayPause}
          disabled={isDisabled}
          aria-label={isPlaying ? 'Pause game' : 'Resume game'}
          title={isPlaying ? 'Pause (Space)' : 'Resume (Space)'}
        >
          <span className={styles.icon}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </span>
        </button>
      </div>

      {/* Center Section - Volume */}
      <div className={styles.section}>
        <VolumeControl
          volume={Math.round(volume * 100)}
          isMuted={isMuted}
          onVolumeChange={handleVolumeChange}
          onMuteToggle={handleMuteToggle}
        />
      </div>

      {/* Right Section - Additional Controls */}
      <div className={styles.section}>
        {/* Save/Load States */}
        {onToggleSavePanel && (
          <button
            type="button"
            className={styles.controlButton}
            onClick={onToggleSavePanel}
            disabled={isDisabled}
            aria-label="Open save states panel"
            title="Save/Load States"
          >
            <span className={styles.icon}>
              <SaveIcon />
            </span>
          </button>
        )}

        {/* Virtual Gamepad Toggle (for mobile) */}
        <button
          type="button"
          className={`${styles.controlButton} ${showVirtualGamepad ? styles.active : ''}`}
          onClick={toggleVirtualGamepad}
          disabled={isDisabled}
          aria-label={showVirtualGamepad ? 'Hide virtual gamepad' : 'Show virtual gamepad'}
          aria-pressed={showVirtualGamepad}
          title="Virtual Gamepad"
        >
          <span className={styles.icon}>
            <GamepadIcon />
          </span>
        </button>

        {/* Settings (placeholder for future) */}
        <button
          type="button"
          className={styles.controlButton}
          disabled={true}
          aria-label="Settings (coming soon)"
          title="Settings (Coming Soon)"
        >
          <span className={styles.icon}>
            <SettingsIcon />
          </span>
        </button>

        {/* Fullscreen */}
        {isFullscreenSupported && (
          <button
            type="button"
            className={styles.controlButton}
            onClick={handleFullscreenToggle}
            disabled={isDisabled}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-pressed={isFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
          >
            <span className={styles.icon}>
              {isFullscreen ? <CompressIcon /> : <ExpandIcon />}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export const EmulatorControls = memo(EmulatorControlsComponent);
EmulatorControls.displayName = 'EmulatorControls';
