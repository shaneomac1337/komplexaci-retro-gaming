/**
 * CyberpunkBackground Component
 * Creates an immersive multi-layered cyberpunk background
 * with grid, particles, scanlines, and ambient effects
 */

import { memo, useMemo } from 'react';
import styles from './CyberpunkBackground.module.css';

// Seeded random function for deterministic particle placement
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export interface CyberpunkBackgroundProps {
  /** Enable/disable specific layers */
  layers?: {
    grid?: boolean;
    scanlines?: boolean;
    particles?: boolean;
    vignette?: boolean;
    ambientGlow?: boolean;
    noise?: boolean;
  };
  /** Overall intensity (0-1) */
  intensity?: number;
  /** Animation speed multiplier */
  speed?: number;
  /** Primary color theme */
  primaryColor?: 'cyan' | 'magenta' | 'purple';
}

/**
 * CyberpunkBackground - Immersive multi-layer background
 * Perfect for hero sections, modals, or fullscreen experiences
 */
export const CyberpunkBackground = memo(function CyberpunkBackground({
  layers = {
    grid: true,
    scanlines: true,
    particles: true,
    vignette: true,
    ambientGlow: true,
    noise: true,
  },
  intensity = 1,
  speed = 1,
  primaryColor = 'cyan',
}: CyberpunkBackgroundProps) {
  const colorMap = {
    cyan: 'rgba(0, 255, 255, ',
    magenta: 'rgba(255, 0, 255, ',
    purple: 'rgba(157, 78, 221, ',
  };

  const color = colorMap[primaryColor];

  // Memoize particle data to prevent regeneration on re-render
  const particleData = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      delay: seededRandom(i * 1) * 5,
      duration: 8 + seededRandom(i * 2) * 7,
      x: seededRandom(i * 3) * 100,
      drift: (seededRandom(i * 4) - 0.5) * 200,
    })), []);

  return (
    <div
      className={styles.background}
      style={
        {
          '--intensity': intensity,
          '--speed': speed,
          '--primary-color': color + '1)',
          '--primary-color-alpha': color,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      {/* Animated Grid Layer */}
      {layers.grid && (
        <div className={styles.gridLayer}>
          <div className={styles.grid} />
          <div className={styles.gridGlow} />
        </div>
      )}

      {/* Scanlines Layer */}
      {layers.scanlines && (
        <div className={styles.scanlinesLayer}>
          <div className={styles.scanlines} />
          <div className={styles.scanlineMoving} />
        </div>
      )}

      {/* Particle Layer */}
      {layers.particles && (
        <div className={styles.particlesLayer}>
          {particleData.map((p) => (
            <div
              key={p.id}
              className={styles.particle}
              style={
                {
                  '--particle-delay': `${p.delay}s`,
                  '--particle-duration': `${p.duration}s`,
                  '--particle-x': `${p.x}%`,
                  '--particle-drift': `${p.drift}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {/* Vignette Layer */}
      {layers.vignette && <div className={styles.vignette} />}

      {/* Ambient Glow Layer */}
      {layers.ambientGlow && (
        <div className={styles.ambientGlow}>
          <div className={styles.glow1} />
          <div className={styles.glow2} />
          <div className={styles.glow3} />
        </div>
      )}

      {/* Noise Texture Layer */}
      {layers.noise && <div className={styles.noise} />}
    </div>
  );
});
