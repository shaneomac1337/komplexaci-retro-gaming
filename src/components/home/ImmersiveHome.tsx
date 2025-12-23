/**
 * Immersive Home Page Component
 * A visually stunning cyberpunk-themed landing page
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../../stores';
import styles from './ImmersiveHome.module.css';

// Console icons as SVG
const consoleIcons = {
  ps1: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.5 6.5v4.5l-5 2.5v-4.5l5-2.5zm9 0l-5 2.5v4.5l5-2.5v-4.5zm-4.5 7.5v4l-4.5-2.25v-4l4.5 2.25z"/>
    </svg>
  ),
  nes: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="7" width="20" height="10" rx="2"/>
      <circle cx="7" cy="12" r="2"/>
      <rect x="14" y="10" width="6" height="4" rx="1"/>
    </svg>
  ),
  snes: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="1" y="8" width="22" height="8" rx="2"/>
      <circle cx="6" cy="12" r="2"/>
      <circle cx="18" cy="10" r="1.5"/>
      <circle cx="18" cy="14" r="1.5"/>
      <circle cx="16" cy="12" r="1.5"/>
      <circle cx="20" cy="12" r="1.5"/>
    </svg>
  ),
  n64: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.5L19 8l-7 3.5L5 8l7-3.5z"/>
    </svg>
  ),
  gb: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <rect x="7" y="4" width="10" height="8" rx="1"/>
      <circle cx="9" cy="16" r="2"/>
      <circle cx="15" cy="16" r="1"/>
    </svg>
  ),
  gba: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="1" y="6" width="22" height="12" rx="3"/>
      <rect x="6" y="8" width="6" height="5" rx="1"/>
      <circle cx="17" cy="11" r="2"/>
    </svg>
  ),
};

// Floating particle component
function Particle({ delay, duration, size, left, color }: {
  delay: number;
  duration: number;
  size: number;
  left: number;
  color: string;
}) {
  return (
    <div
      className={styles.particle}
      style={{
        '--delay': `${delay}s`,
        '--duration': `${duration}s`,
        '--size': `${size}px`,
        '--left': `${left}%`,
        '--color': color,
      } as React.CSSProperties}
    />
  );
}

// Floating console icon
function FloatingIcon({ icon, delay, x, y }: {
  icon: keyof typeof consoleIcons;
  delay: number;
  x: number;
  y: number;
}) {
  return (
    <div
      className={styles.floatingIcon}
      style={{
        '--delay': `${delay}s`,
        '--x': `${x}%`,
        '--y': `${y}%`,
      } as React.CSSProperties}
    >
      {consoleIcons[icon]}
    </div>
  );
}

export function ImmersiveHome() {
  const games = useGameStore((state) => state.games);
  const isLoading = useGameStore((state) => state.isLoading);
  // Check if we're in a browser environment (for animation start)
  const mounted = typeof window !== 'undefined';

  // Generate random particles - memoized to prevent regeneration on re-render
  const particles = useMemo(() => {
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      delay: seededRandom(i * 1) * 10,
      duration: 10 + seededRandom(i * 2) * 20,
      size: 2 + seededRandom(i * 3) * 4,
      left: seededRandom(i * 4) * 100,
      color: ['#00ffff', '#ff00ff', '#9d4edd'][Math.floor(seededRandom(i * 5) * 3)],
    }));
  }, []);

  return (
    <div className={styles.container}>
      {/* Animated background */}
      <div className={styles.background}>
        {/* Grid */}
        <div className={styles.grid} />

        {/* Scanlines */}
        <div className={styles.scanlines} />

        {/* Gradient overlay */}
        <div className={styles.gradientOverlay} />

        {/* Particles */}
        <div className={styles.particles}>
          {particles.map((p) => (
            <Particle key={p.id} {...p} />
          ))}
        </div>

        {/* Floating console icons */}
        <div className={styles.floatingIcons}>
          <FloatingIcon icon="ps1" delay={0} x={10} y={20} />
          <FloatingIcon icon="nes" delay={1} x={85} y={15} />
          <FloatingIcon icon="snes" delay={2} x={15} y={70} />
          <FloatingIcon icon="n64" delay={3} x={80} y={65} />
          <FloatingIcon icon="gb" delay={4} x={50} y={80} />
          <FloatingIcon icon="gba" delay={5} x={70} y={30} />
        </div>
      </div>

      {/* Hero content */}
      <div className={`${styles.hero} ${mounted ? styles.heroVisible : ''}`}>
        {/* Glowing title */}
        <h1 className={styles.title}>
          <span className={styles.titleLineAccent}>KOMPLEXÁCI</span>
          <span className={styles.titleLine}>RETRO GAMING</span>
        </h1>

        {/* Subtitle with typing effect */}
        <p className={styles.subtitle}>
          Your ultimate destination for classic gaming
        </p>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>
              {isLoading ? '...' : games.length}
            </span>
            <span className={styles.statLabel}>Games</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>6</span>
            <span className={styles.statLabel}>Consoles</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>∞</span>
            <span className={styles.statLabel}>Memories</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className={styles.cta}>
          <Link to="/browse" className={styles.ctaPrimary}>
            <span className={styles.ctaIcon}>▶</span>
            Start Playing
          </Link>
          <Link to="/favorites" className={styles.ctaSecondary}>
            My Favorites
          </Link>
        </div>

        {/* Features */}
        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🎮</div>
            <span>Gamepad Support</span>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>💾</div>
            <span>Save States</span>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>⚡</div>
            <span>Instant Play</span>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📱</div>
            <span>Mobile Ready</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollIndicator}>
        <div className={styles.scrollMouse}>
          <div className={styles.scrollWheel} />
        </div>
        <span>Scroll to explore</span>
      </div>

      {/* Console showcase section */}
      <section className={styles.consolesSection}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionTitleGlow}>SUPPORTED</span> PLATFORMS
        </h2>
        <div className={styles.consoleGrid}>
          {[
            { id: 'ps1', name: 'PlayStation', color: '#003087' },
            { id: 'nes', name: 'NES', color: '#E60012' },
            { id: 'snes', name: 'SNES', color: '#7B7B7B' },
            { id: 'n64', name: 'Nintendo 64', color: '#009E60' },
            { id: 'gb', name: 'Game Boy', color: '#8B956D' },
            { id: 'gba', name: 'GBA', color: '#4F43AE' },
          ].map((console) => (
            <Link
              key={console.id}
              to={`/browse?console=${console.id}`}
              className={styles.consoleCard}
              style={{ '--console-color': console.color } as React.CSSProperties}
            >
              <div className={styles.consoleIconLarge}>
                {consoleIcons[console.id as keyof typeof consoleIcons]}
              </div>
              <span className={styles.consoleName}>{console.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ImmersiveHome;
