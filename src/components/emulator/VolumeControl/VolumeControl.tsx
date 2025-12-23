/**
 * VolumeControl Component
 *
 * Volume slider with mute toggle button for the emulator.
 * Features dynamic volume icons and neon cyan accent styling.
 */

import { memo, useCallback, useId } from 'react';
import styles from './VolumeControl.module.css';

export interface VolumeControlProps {
  /** Current volume level (0-100) */
  volume: number;
  /** Whether audio is currently muted */
  isMuted: boolean;
  /** Callback when volume level changes */
  onVolumeChange: (volume: number) => void;
  /** Callback when mute is toggled */
  onMuteToggle: () => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Volume High Icon (volume > 50%)
 */
function VolumeHighIcon() {
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
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" />
      <path d="M19.07,4.93a10,10,0,0,1,0,14.14" />
      <path d="M15.54,8.46a5,5,0,0,1,0,7.07" />
    </svg>
  );
}

/**
 * Volume Medium Icon (volume 1-50%)
 */
function VolumeMediumIcon() {
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
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" />
      <path d="M15.54,8.46a5,5,0,0,1,0,7.07" />
    </svg>
  );
}

/**
 * Volume Off/Muted Icon
 */
function VolumeMutedIcon() {
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
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

/**
 * Selects the appropriate volume icon based on volume level and mute state.
 */
function getVolumeIcon(volume: number, isMuted: boolean) {
  if (isMuted || volume === 0) {
    return <VolumeMutedIcon />;
  }
  if (volume > 50) {
    return <VolumeHighIcon />;
  }
  return <VolumeMediumIcon />;
}

/**
 * Volume control component with slider and mute button.
 * Click on the volume icon to toggle mute.
 */
function VolumeControlComponent({
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle,
  className = '',
}: VolumeControlProps) {
  const sliderId = useId();
  const clampedVolume = Math.max(0, Math.min(100, volume));
  const displayVolume = isMuted ? 0 : clampedVolume;

  const handleSliderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseInt(event.target.value, 10);
      onVolumeChange(newVolume);
    },
    [onVolumeChange]
  );

  const handleIconClick = useCallback(() => {
    onMuteToggle();
  }, [onMuteToggle]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Allow M key to toggle mute when focused on the component
      if (event.key === 'm' || event.key === 'M') {
        event.preventDefault();
        onMuteToggle();
      }
    },
    [onMuteToggle]
  );

  return (
    <div
      className={`${styles.container} ${className}`}
      onKeyDown={handleKeyDown}
      role="group"
      aria-label="Volume controls"
    >
      {/* Mute Button */}
      <button
        type="button"
        className={styles.muteButton}
        onClick={handleIconClick}
        aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        aria-pressed={isMuted}
        title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
      >
        <span className={styles.icon}>{getVolumeIcon(clampedVolume, isMuted)}</span>
      </button>

      {/* Volume Slider */}
      <div className={styles.sliderContainer}>
        <input
          id={sliderId}
          type="range"
          className={styles.slider}
          min={0}
          max={100}
          value={displayVolume}
          onChange={handleSliderChange}
          aria-label="Volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={displayVolume}
          aria-valuetext={`${displayVolume}% volume`}
          disabled={isMuted}
          style={
            {
              '--volume-percent': `${displayVolume}%`,
            } as React.CSSProperties
          }
        />
        <div
          className={styles.sliderFill}
          style={{ width: `${displayVolume}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export const VolumeControl = memo(VolumeControlComponent);
VolumeControl.displayName = 'VolumeControl';
