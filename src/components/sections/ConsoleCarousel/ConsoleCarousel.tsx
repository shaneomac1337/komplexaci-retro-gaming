/**
 * ConsoleCarousel Component
 * Horizontal carousel showing console cards for browsing by platform
 */

import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Card } from '@/components/common/Card';
import { useGameStore, selectGameCountByConsole } from '@/stores/gameStore';
import { CONSOLE_CONFIG, type ConsoleType, SUPPORTED_CONSOLES } from '@/types';
import { SectionHeader } from '../SectionHeader';
import styles from './ConsoleCarousel.module.css';

export interface ConsoleCarouselProps {
  /** Additional CSS class name */
  className?: string;
}

/**
 * Console-specific icons as SVG components
 */
const ConsoleIcons: Record<ConsoleType, React.FC<{ className?: string }>> = {
  ps1: ({ className }) => (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className}>
      <path d="M32 4L8 20v24l24 16 24-16V20L32 4zm0 8l16 10.67v16L32 48 16 38.67v-16L32 12z" />
      <path d="M32 20v20l12-8V24l-12-4z" opacity="0.8" />
    </svg>
  ),
  nes: ({ className }) => (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className}>
      <rect x="4" y="16" width="56" height="32" rx="4" />
      <rect x="10" y="26" width="12" height="4" fill="var(--color-bg-primary)" />
      <rect x="14" y="22" width="4" height="12" fill="var(--color-bg-primary)" />
      <circle cx="44" cy="28" r="5" fill="var(--color-bg-primary)" />
      <circle cx="54" cy="32" r="4" fill="var(--color-bg-primary)" />
    </svg>
  ),
  snes: ({ className }) => (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className}>
      <ellipse cx="32" cy="32" rx="28" ry="16" />
      <circle cx="14" cy="32" r="6" fill="var(--color-bg-primary)" />
      <circle cx="48" cy="26" r="3.5" fill="var(--color-neon-magenta)" />
      <circle cx="56" cy="32" r="3.5" fill="var(--color-neon-cyan)" />
      <circle cx="48" cy="38" r="3.5" fill="var(--color-neon-cyan)" />
      <circle cx="40" cy="32" r="3.5" fill="var(--color-neon-magenta)" />
    </svg>
  ),
  n64: ({ className }) => (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className}>
      <path d="M8 28h20v20H8z" />
      <path d="M36 28h20v20H36z" />
      <path d="M24 16h16v28H24z" />
      <circle cx="32" cy="30" r="8" fill="var(--color-bg-primary)" />
      <circle cx="14" cy="38" r="5" fill="var(--color-bg-primary)" />
      <circle cx="50" cy="38" r="5" fill="var(--color-bg-primary)" />
    </svg>
  ),
  gb: ({ className }) => (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className}>
      <rect x="14" y="4" width="36" height="56" rx="4" />
      <rect x="20" y="10" width="24" height="22" rx="2" fill="var(--color-bg-primary)" />
      <circle cx="26" cy="44" r="6" fill="var(--color-bg-primary)" />
      <circle cx="42" cy="42" r="4" fill="var(--color-bg-primary)" />
      <circle cx="38" cy="48" r="4" fill="var(--color-bg-primary)" />
    </svg>
  ),
  gba: ({ className }) => (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className}>
      <rect x="2" y="14" width="60" height="36" rx="6" />
      <rect x="16" y="18" width="32" height="22" rx="2" fill="var(--color-bg-primary)" />
      <circle cx="10" cy="26" r="5" fill="var(--color-bg-primary)" />
      <circle cx="10" cy="38" r="5" fill="var(--color-bg-primary)" />
      <circle cx="54" cy="30" r="4" fill="var(--color-bg-primary)" />
      <circle cx="54" cy="38" r="3" fill="var(--color-bg-primary)" />
    </svg>
  ),
};

/**
 * Gamepad icon for the section header
 */
const GamepadIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
  </svg>
);

/**
 * Individual console card component
 */
const ConsoleCard = memo(function ConsoleCard({
  consoleType,
  gameCount,
}: {
  consoleType: ConsoleType;
  gameCount: number;
}) {
  const config = CONSOLE_CONFIG[consoleType];
  const IconComponent = ConsoleIcons[consoleType];

  return (
    <Link
      to={`/browse?console=${consoleType}`}
      className={styles.cardLink}
    >
      <Card
        variant="interactive"
        padding="none"
        className={styles.card}
        style={{
          '--console-color': config.color,
        } as React.CSSProperties}
      >
        <div className={styles.cardInner}>
          <div className={styles.iconWrapper}>
            <IconComponent className={styles.consoleIcon} />
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.consoleName}>{config.name}</h3>
            <span className={styles.gameCount}>
              {gameCount} {gameCount === 1 ? 'game' : 'games'}
            </span>
          </div>
          <div className={styles.glowEffect} aria-hidden="true" />
        </div>
      </Card>
    </Link>
  );
});

/**
 * ConsoleCarousel section component
 * Displays horizontal cards for each console with game counts
 */
export const ConsoleCarousel = memo(function ConsoleCarousel({
  className,
}: ConsoleCarouselProps) {
  const gameCounts = useGameStore(selectGameCountByConsole);

  // Filter to only show consoles with games and sort by game count
  const consolesWithGames = useMemo(() => {
    return SUPPORTED_CONSOLES
      .map((consoleType) => ({
        consoleType,
        count: gameCounts[consoleType] ?? 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [gameCounts]);

  return (
    <section
      className={clsx(styles.section, className)}
      aria-labelledby="console-carousel-title"
    >
      <SectionHeader
        title="Browse by Console"
        subtitle="Explore games by platform"
        icon={<GamepadIcon />}
        action={{
          label: 'View All',
          to: '/browse',
        }}
      />

      <div className={styles.carousel}>
        {consolesWithGames.map(({ consoleType, count }) => (
          <ConsoleCard
            key={consoleType}
            consoleType={consoleType}
            gameCount={count}
          />
        ))}
      </div>
    </section>
  );
});
