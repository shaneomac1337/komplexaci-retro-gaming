/**
 * EmulatorBezel Component
 *
 * Decorative arcade-style bezel that wraps around the emulator.
 * Features CRT monitor aesthetics with neon accents.
 */

import { memo, type ReactNode } from 'react';
import type { ConsoleType } from '@/types';
import { CONSOLE_CONFIG } from '@/types';
import { useGamepad } from '@/hooks/useGamepad';
import styles from './EmulatorBezel.module.css';

export interface EmulatorBezelProps {
  /** The emulator content to wrap */
  children: ReactNode;
  /** Game title to display */
  gameTitle?: string;
  /** Console type for theming */
  console?: ConsoleType;
  /** Optional className */
  className?: string;
}

/**
 * Console-specific accent colors
 */
const CONSOLE_COLORS: Record<ConsoleType, string> = {
  nes: '#E60012',
  snes: '#7B5AA6',
  n64: '#009E60',
  gb: '#8B956D',
  gba: '#5A2D82',
  ps1: '#003087',
};

function EmulatorBezelComponent({
  children,
  gameTitle,
  console: consoleType,
  className = '',
}: EmulatorBezelProps) {
  const accentColor = consoleType ? CONSOLE_COLORS[consoleType] : '#00ffff';
  const consoleName = consoleType ? CONSOLE_CONFIG[consoleType].name : 'RETRO';
  const { hasGamepad, primaryGamepad } = useGamepad();

  return (
    <div
      className={`${styles.bezel} ${className}`}
      style={{ '--accent-color': accentColor } as React.CSSProperties}
    >
      {/* Top bezel section */}
      <div className={styles.topBezel}>
        <div className={styles.topLeft}>
          <div className={styles.ventLines}>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div className={styles.topCenter}>
          <div className={styles.logoArea}>
            <span className={styles.brand}>KOMPLEXACI</span>
            <span className={styles.model}>{consoleName}</span>
          </div>
          {gameTitle && (
            <div className={styles.gameTitle}>
              <span className={styles.nowPlaying}>NOW PLAYING</span>
              <span className={styles.titleText}>{gameTitle}</span>
            </div>
          )}
        </div>

        <div className={styles.topRight}>
          {/* Gamepad indicator */}
          <div
            className={`${styles.gamepadIndicator} ${hasGamepad ? styles.connected : ''}`}
            title={hasGamepad ? `Controller: ${primaryGamepad?.id?.split('(')[0]?.trim() || 'Connected'}` : 'No controller - plug in gamepad for best experience'}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className={styles.gamepadIcon}>
              <path d="M21 6H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4-3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
            </svg>
            <span className={styles.gamepadStatus}>{hasGamepad ? 'READY' : 'PLUG IN'}</span>
          </div>
          <div className={styles.ledIndicators}>
            <div className={styles.led} data-status="power"></div>
            <div className={styles.led} data-status="active"></div>
          </div>
        </div>
      </div>

      {/* Main screen area with side bezels */}
      <div className={styles.screenWrapper}>
        {/* Left bezel */}
        <div className={styles.sideBezel + ' ' + styles.leftBezel}>
          <div className={styles.sideDecoration}>
            <div className={styles.stripe}></div>
            <div className={styles.stripe}></div>
            <div className={styles.stripe}></div>
          </div>
          <div className={styles.speakerGrill}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.grillLine}></div>
            ))}
          </div>
        </div>

        {/* Screen container */}
        <div className={styles.screenContainer}>
          <div className={styles.screenInner}>
            {/* CRT effect overlays */}
            <div className={styles.crtOverlay}>
              <div className={styles.scanlines}></div>
              <div className={styles.screenGlow}></div>
            </div>
            {/* Actual emulator content */}
            <div className={styles.screenContent}>
              {children}
            </div>
          </div>
          {/* Screen frame/border */}
          <div className={styles.screenFrame}></div>
        </div>

        {/* Right bezel */}
        <div className={styles.sideBezel + ' ' + styles.rightBezel}>
          <div className={styles.sideDecoration}>
            <div className={styles.stripe}></div>
            <div className={styles.stripe}></div>
            <div className={styles.stripe}></div>
          </div>
          <div className={styles.speakerGrill}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.grillLine}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bezel section */}
      <div className={styles.bottomBezel}>
        <div className={styles.bottomLeft}>
          <div className={styles.portLabel}>PLAYER 1</div>
        </div>

        <div className={styles.bottomCenter}>
          <div className={styles.controlHints}>
            <div className={styles.keyboardHelp}>
              <span className={styles.keyHint}><kbd>↑↓←→</kbd> D-Pad</span>
              <span className={styles.keyHint}><kbd>A</kbd><kbd>S</kbd><kbd>Z</kbd><kbd>X</kbd> Buttons</span>
              <span className={styles.keyHint}><kbd>Enter</kbd> Start</span>
              <span className={styles.keyHint}><kbd>ESC</kbd> Menu</span>
            </div>
          </div>
        </div>

        <div className={styles.bottomRight}>
          <div className={styles.portLabel}>PLAYER 2</div>
        </div>
      </div>

      {/* Corner decorations */}
      <div className={styles.corner + ' ' + styles.cornerTL}></div>
      <div className={styles.corner + ' ' + styles.cornerTR}></div>
      <div className={styles.corner + ' ' + styles.cornerBL}></div>
      <div className={styles.corner + ' ' + styles.cornerBR}></div>
    </div>
  );
}

export const EmulatorBezel = memo(EmulatorBezelComponent);
EmulatorBezel.displayName = 'EmulatorBezel';

export default EmulatorBezel;
