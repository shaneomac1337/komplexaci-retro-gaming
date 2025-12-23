/**
 * HeroSection Component
 * Immersive hero with featured games, particles, and neon effects
 */

import { memo, useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { useGameStore } from '@/stores/gameStore';
import type { Game } from '@/types';
import styles from './HeroSection.module.css';

// Seeded random function for deterministic particle placement
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export interface HeroSectionProps {
  className?: string;
}

/**
 * Floating particles component
 */
const Particles = memo(function Particles() {
  // Memoize particle data to prevent regeneration on re-render
  const particleData = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      delay: seededRandom(i * 1) * 20,
      duration: 15 + seededRandom(i * 2) * 20,
      xStart: seededRandom(i * 3) * 100,
      xEnd: seededRandom(i * 4) * 100,
      size: 2 + seededRandom(i * 5) * 4,
      opacity: 0.3 + seededRandom(i * 6) * 0.5,
    })), []);

  return (
    <div className={styles.particles} aria-hidden="true">
      {particleData.map((p) => (
        <div
          key={p.id}
          className={styles.particle}
          style={{
            '--delay': `${p.delay}s`,
            '--duration': `${p.duration}s`,
            '--x-start': `${p.xStart}%`,
            '--x-end': `${p.xEnd}%`,
            '--size': `${p.size}px`,
            '--opacity': `${p.opacity}`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
});

/**
 * Neon light rays
 */
const LightRays = memo(function LightRays() {
  return (
    <div className={styles.lightRays} aria-hidden="true">
      <div className={styles.ray} />
      <div className={styles.ray} />
      <div className={styles.ray} />
    </div>
  );
});

/**
 * Featured game card component
 */
interface FeaturedGameProps {
  game: Game;
  isActive: boolean;
  onClick: () => void;
}

const FeaturedGame = memo(function FeaturedGame({ game, isActive, onClick }: FeaturedGameProps) {
  return (
    <button
      type="button"
      className={clsx(styles.featuredGame, { [styles.active]: isActive })}
      onClick={onClick}
    >
      <div className={styles.featuredCover}>
        {game.coverPath ? (
          <img
            src={game.coverPath}
            alt={game.title}
            crossOrigin="anonymous"
          />
        ) : (
          <div className={styles.placeholderCover}>
            <Icon name="gamepad" size={32} />
          </div>
        )}
      </div>
      <div className={styles.featuredGlow} />
    </button>
  );
});

/**
 * HeroSection with immersive gaming experience
 */
export const HeroSection = memo(function HeroSection({ className }: HeroSectionProps) {
  const navigate = useNavigate();
  const { games } = useGameStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Get featured games (first 5 or all if less)
  const featuredGames = games.slice(0, Math.min(5, games.length));
  const activeGame = featuredGames[activeIndex] || null;

  // Auto-rotate featured games
  useEffect(() => {
    if (featuredGames.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % featuredGames.length);
        setIsTransitioning(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredGames.length]);

  const handleGameSelect = useCallback((index: number) => {
    if (index === activeIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(index);
      setIsTransitioning(false);
    }, 300);
  }, [activeIndex]);

  // Simple handler - React Compiler handles memoization automatically
  const handlePlayNow = () => {
    if (activeGame) {
      navigate(`/play/${activeGame.id}`);
    }
  };

  return (
    <section className={clsx(styles.hero, className)} aria-labelledby="hero-title">
      {/* Background layers */}
      <div className={styles.background}>
        {/* Active game backdrop */}
        {activeGame?.coverPath && (
          <div
            className={clsx(styles.backdrop, { [styles.transitioning]: isTransitioning })}
            style={{ backgroundImage: `url(${activeGame.coverPath})` }}
          />
        )}
        <div className={styles.backdropOverlay} />
        <div className={styles.noiseOverlay} />
        <LightRays />
        <Particles />
        <div className={styles.scanlines} />
        <div className={styles.vignette} />
      </div>

      {/* Main content */}
      <div className={styles.content}>
        {/* Left side - Branding */}
        <div className={styles.branding}>
          <div className={styles.logoMark}>
            <Icon name="gamepad" size={48} />
          </div>

          <h1 id="hero-title" className={styles.title}>
            <span className={styles.titleTop}>Retro</span>
            <span className={styles.titleBottom}>Gaming Hub</span>
          </h1>

          <p className={styles.tagline}>
            Relive the classics. Play legendary games from PlayStation, Nintendo, and more — right in your browser.
          </p>

          <div className={styles.actions}>
            {activeGame ? (
              <Button
                variant="primary"
                size="lg"
                onClick={handlePlayNow}
                leftIcon={<Icon name="play" size={20} />}
              >
                Play {activeGame.title}
              </Button>
            ) : (
              <Link to="/browse">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<Icon name="chevron-right" size={20} />}
                >
                  Browse Games
                </Button>
              </Link>
            )}

            <Link to="/browse">
              <Button variant="ghost" size="lg">
                View All Games
              </Button>
            </Link>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{games.length}</span>
              <span className={styles.statLabel}>Games</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statValue}>6</span>
              <span className={styles.statLabel}>Consoles</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statValue}>100%</span>
              <span className={styles.statLabel}>Free</span>
            </div>
          </div>
        </div>

        {/* Right side - Featured Games */}
        {featuredGames.length > 0 && (
          <div className={styles.showcase}>
            {/* Main featured game display */}
            <div className={styles.mainDisplay}>
              {activeGame && (
                <div className={clsx(styles.mainCover, { [styles.transitioning]: isTransitioning })}>
                  {activeGame.coverPath ? (
                    <img
                      src={activeGame.coverPath}
                      alt={activeGame.title}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className={styles.mainPlaceholder}>
                      <Icon name="gamepad" size={80} />
                    </div>
                  )}
                  <div className={styles.mainGlow} />
                  <div className={styles.mainFrame} />
                </div>
              )}

              {/* Game info overlay */}
              {activeGame && (
                <div className={clsx(styles.gameInfo, { [styles.transitioning]: isTransitioning })}>
                  <span className={styles.gameConsole}>{activeGame.console.toUpperCase()}</span>
                  <h2 className={styles.gameTitle}>{activeGame.title}</h2>
                  {activeGame.releaseYear && (
                    <span className={styles.gameYear}>{activeGame.releaseYear}</span>
                  )}
                </div>
              )}
            </div>

            {/* Game selector dots */}
            {featuredGames.length > 1 && (
              <div className={styles.selector}>
                {featuredGames.map((game, index) => (
                  <FeaturedGame
                    key={game.id}
                    game={game}
                    isActive={index === activeIndex}
                    onClick={() => handleGameSelect(index)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollIndicator} aria-hidden="true">
        <div className={styles.scrollLine} />
        <span className={styles.scrollText}>Scroll</span>
      </div>

      {/* Corner decorations */}
      <div className={styles.cornerTL} aria-hidden="true" />
      <div className={styles.cornerTR} aria-hidden="true" />
      <div className={styles.cornerBL} aria-hidden="true" />
      <div className={styles.cornerBR} aria-hidden="true" />
    </section>
  );
});
