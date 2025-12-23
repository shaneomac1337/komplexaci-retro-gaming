/**
 * EmulatorBezel Component
 *
 * Decorative arcade-style bezel that wraps around the emulator.
 * Features CRT monitor aesthetics with neon accents and arcade cabinet styling.
 */

import { memo, type ReactNode, useState, useEffect } from 'react';
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

/**
 * Console-specific secondary colors for gradients
 */
const CONSOLE_SECONDARY_COLORS: Record<ConsoleType, string> = {
  nes: '#8B0000',
  snes: '#4B2A66',
  n64: '#006030',
  gb: '#5B654D',
  gba: '#3A1D52',
  ps1: '#001057',
};

/**
 * PlayStation button symbols component
 */
function PlayStationButtons({ className }: { className?: string }) {
  return (
    <div className={`${styles.psButtons} ${className || ''}`}>
      <span className={styles.psTriangle}>△</span>
      <span className={styles.psCircle}>○</span>
      <span className={styles.psCross}>✕</span>
      <span className={styles.psSquare}>□</span>
    </div>
  );
}

function EmulatorBezelComponent({
  children,
  gameTitle,
  console: consoleType,
  className = '',
}: EmulatorBezelProps) {
  const accentColor = consoleType ? CONSOLE_COLORS[consoleType] : '#00ffff';
  const secondaryColor = consoleType ? CONSOLE_SECONDARY_COLORS[consoleType] : '#006666';
  const consoleName = consoleType ? CONSOLE_CONFIG[consoleType].name : 'RETRO';
  const { hasGamepad, primaryGamepad } = useGamepad();
  const isPlayStation = consoleType === 'ps1';

  // Animated play time counter
  const [playTime, setPlayTime] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setPlayTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`${styles.bezel} ${className}`}
      style={{
        '--accent-color': accentColor,
        '--secondary-color': secondaryColor,
      } as React.CSSProperties}
    >
      {/* Decorative screws */}
      <div className={`${styles.screw} ${styles.screwTL}`} />
      <div className={`${styles.screw} ${styles.screwTR}`} />
      <div className={`${styles.screw} ${styles.screwBL}`} />
      <div className={`${styles.screw} ${styles.screwBR}`} />

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
          {/* Manufacturer badge */}
          <div className={styles.manufacturerBadge}>
            <span className={styles.badgeText}>EST. 2024</span>
          </div>
        </div>

        <div className={styles.topCenter}>
          <div className={styles.logoArea}>
            <span className={styles.brand}>KOMPLEXACI</span>
            <span className={styles.model}>{consoleName}</span>
            {isPlayStation && <PlayStationButtons className={styles.logoButtons} />}
          </div>
          {gameTitle && (
            <div className={styles.gameTitle}>
              <span className={styles.nowPlaying}>NOW PLAYING</span>
              <span className={styles.titleText}>{gameTitle}</span>
            </div>
          )}
        </div>

        <div className={styles.topRight}>
          {/* Session timer */}
          <div className={styles.sessionTimer}>
            <span className={styles.timerLabel}>SESSION</span>
            <span className={styles.timerValue}>{formatTime(playTime)}</span>
          </div>
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

          {/* Decorative sticker */}
          <div className={styles.arcadeSticker}>
            <span className={styles.stickerIcon}>🎮</span>
            <span className={styles.stickerText}>PRESS START</span>
          </div>

          <div className={styles.speakerGrill}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.grillLine}></div>
            ))}
          </div>

          {/* Volume indicator */}
          <div className={styles.volumeIndicator}>
            <svg viewBox="0 0 24 24" fill="currentColor" className={styles.volumeIcon}>
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <div className={styles.volumeBars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={styles.volumeBar} data-active={i < 4 ? 'true' : 'false'}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Screen container */}
        <div className={styles.screenContainer}>
          <div className={styles.screenInner}>
            {/* CRT effect overlays */}
            <div className={styles.crtOverlay}>
              <div className={styles.scanlines}></div>
              <div className={styles.screenGlow}></div>
              <div className={styles.crtCurvature}></div>
            </div>
            {/* Actual emulator content */}
            <div className={styles.screenContent}>
              {children}
            </div>
          </div>
          {/* Screen frame/border */}
          <div className={styles.screenFrame}></div>
          {/* CRT brand label */}
          <div className={styles.crtBrand}>
            <span>TRINITRON</span>
          </div>
        </div>

        {/* Right bezel */}
        <div className={styles.sideBezel + ' ' + styles.rightBezel}>
          <div className={styles.sideDecoration}>
            <div className={styles.stripe}></div>
            <div className={styles.stripe}></div>
            <div className={styles.stripe}></div>
          </div>

          {/* Quality seal */}
          <div className={styles.qualitySeal}>
            <div className={styles.sealInner}>
              <span className={styles.sealText}>HD</span>
              <span className={styles.sealSubtext}>READY</span>
            </div>
          </div>

          <div className={styles.speakerGrill}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.grillLine}></div>
            ))}
          </div>

          {/* Signal strength indicator */}
          <div className={styles.signalIndicator}>
            <svg viewBox="0 0 24 24" fill="currentColor" className={styles.signalIcon}>
              <path d="M12 3C7.46 3 3.34 4.78.29 7.67c-.18.18-.29.43-.29.71 0 .28.11.53.29.71l11 11c.19.19.44.29.71.29s.52-.1.71-.29l11-11c.18-.18.29-.43.29-.71 0-.28-.11-.53-.29-.71C20.66 4.78 16.54 3 12 3z"/>
            </svg>
            <div className={styles.signalBars}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.signalBar} style={{ height: `${(i + 1) * 25}%` }} data-active="true"></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bezel section */}
      <div className={styles.bottomBezel}>
        <div className={styles.bottomLeft}>
          <div className={styles.playerPort}>
            <div className={styles.portConnector}>
              <div className={styles.connectorPin}></div>
              <div className={styles.connectorPin}></div>
              <div className={styles.connectorPin}></div>
            </div>
            <div className={styles.portLabel}>PLAYER 1</div>
            <div className={styles.portStatus} data-connected={hasGamepad ? 'true' : 'false'}></div>
          </div>
        </div>

        <div className={styles.bottomCenter}>
          {/* Arcade-style control panel */}
          <div className={styles.controlPanel}>
            <div className={styles.controlPanelHeader}>
              <span className={styles.controlPanelTitle}>CONTROLS</span>
              <span className={styles.controlPanelSubtitle}>KEYBOARD / GAMEPAD</span>
            </div>
            <div className={styles.controlHints}>
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>MOVE</span>
                <div className={styles.keyGroup}>
                  <kbd className={styles.arrowKeys}>↑↓←→</kbd>
                </div>
              </div>
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>ACTION</span>
                <div className={styles.keyGroup}>
                  {isPlayStation ? (
                    <>
                      <kbd className={styles.psKey} data-button="cross">✕</kbd>
                      <kbd className={styles.psKey} data-button="circle">○</kbd>
                      <kbd className={styles.psKey} data-button="square">□</kbd>
                      <kbd className={styles.psKey} data-button="triangle">△</kbd>
                    </>
                  ) : (
                    <>
                      <kbd>Z</kbd>
                      <kbd>X</kbd>
                      <kbd>A</kbd>
                      <kbd>S</kbd>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>SYSTEM</span>
                <div className={styles.keyGroup}>
                  <kbd>Enter</kbd>
                  <kbd>ESC</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottomRight}>
          <div className={styles.playerPort}>
            <div className={styles.portConnector}>
              <div className={styles.connectorPin}></div>
              <div className={styles.connectorPin}></div>
              <div className={styles.connectorPin}></div>
            </div>
            <div className={styles.portLabel}>PLAYER 2</div>
            <div className={styles.portStatus} data-connected="false"></div>
          </div>
        </div>
      </div>

      {/* Arcade T-molding edge */}
      <div className={styles.tMolding}></div>

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
