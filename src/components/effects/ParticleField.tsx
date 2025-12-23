/**
 * ParticleField Component
 * Creates an animated particle field effect for immersive backgrounds
 */

import { memo, useEffect, useRef } from 'react';
import styles from './ParticleField.module.css';

export interface ParticleFieldProps {
  /** Number of particles to generate */
  particleCount?: number;
  /** Color scheme: 'cyan', 'magenta', 'mixed' */
  colorScheme?: 'cyan' | 'magenta' | 'mixed';
  /** Animation speed multiplier */
  speed?: number;
  /** Particle size in pixels */
  size?: number;
  /** Z-index layer */
  zIndex?: number;
  /** Opacity (0-1) */
  opacity?: number;
}

/**
 * Generate random number between min and max
 */
const random = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * ParticleField - Creates floating neon particles
 * Perfect for hero sections and immersive backgrounds
 */
export const ParticleField = memo(function ParticleField({
  particleCount = 50,
  colorScheme = 'mixed',
  speed = 1,
  size = 2,
  zIndex = 1,
  opacity = 0.6,
}: ParticleFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const particles: HTMLDivElement[] = [];

    // Generate particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = styles.particle;

      // Random positioning
      particle.style.left = `${random(0, 100)}%`;
      particle.style.top = `${random(0, 100)}%`;

      // Random size variation
      const particleSize = size * random(0.5, 1.5);
      particle.style.width = `${particleSize}px`;
      particle.style.height = `${particleSize}px`;

      // Color assignment
      let color: string;
      if (colorScheme === 'cyan') {
        color = 'rgba(0, 255, 255, ';
      } else if (colorScheme === 'magenta') {
        color = 'rgba(255, 0, 255, ';
      } else {
        color = Math.random() > 0.5 ? 'rgba(0, 255, 255, ' : 'rgba(255, 0, 255, ';
      }
      particle.style.background = color + opacity + ')';
      particle.style.boxShadow = `0 0 ${particleSize * 2}px ${color + (opacity * 0.8) + ')'}`;

      // Random animation duration and delay
      const duration = random(5, 15) / speed;
      const delay = random(0, 5);
      particle.style.animationDuration = `${duration}s`;
      particle.style.animationDelay = `${delay}s`;

      // Random drift direction
      particle.style.setProperty('--drift', `${random(-200, 200)}px`);

      container.appendChild(particle);
      particles.push(particle);
    }

    // Cleanup
    return () => {
      particles.forEach(p => p.remove());
    };
  }, [particleCount, colorScheme, speed, size, opacity]);

  return (
    <div
      ref={containerRef}
      className={styles.particleField}
      style={{ zIndex }}
      aria-hidden="true"
    />
  );
});
