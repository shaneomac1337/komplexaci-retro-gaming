/**
 * NotFoundPage Component
 * 404 error page with cyberpunk glitch effects and retro game references
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import styles from './NotFoundPage.module.css';

export interface NotFoundPageProps {
  /** Additional CSS class name */
  className?: string;
}

/**
 * Retro game references for fun 404 messages
 */
const GAME_REFERENCES = [
  { text: "It's dangerous to go alone without this page!", game: 'The Legend of Zelda' },
  { text: 'This page has gone to another castle.', game: 'Super Mario Bros' },
  { text: 'All your page are belong to us.', game: 'Zero Wing' },
  { text: 'The page you seek is in another dimension.', game: 'Metroid' },
  { text: 'GAME OVER - Page Not Found. Insert coin to continue.', game: 'Arcade Classic' },
  { text: "A winner is you! But not for finding this page.", game: 'Pro Wrestling' },
  { text: '!?', game: 'Metal Gear Solid' },
  { text: 'You died. Page not found.', game: 'Dark Souls' },
];

/**
 * Hook for updating document title
 */
function useDocumentTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

/**
 * NotFoundPage - 404 error page with cyberpunk styling
 */
function NotFoundPage({ className }: NotFoundPageProps) {
  // Update document title
  useDocumentTitle('404 - Page Not Found - Retro Gaming Hub');

  // Random game reference
  const [reference] = useState(() =>
    GAME_REFERENCES[Math.floor(Math.random() * GAME_REFERENCES.length)]
  );

  return (
    <div className={clsx(styles.notFound, className)}>
      <div className={styles.content}>
        {/* Glitch Error Code */}
        <div className={styles.errorCode}>
          <span className={styles.glitch} data-text="404">
            404
          </span>
        </div>

        {/* Message */}
        <h1 className={styles.title}>Page Not Found</h1>

        {/* Retro Game Quote */}
        <div className={styles.retroMessage}>
          <span className={styles.blinkingCursor}>_</span>
          <span>"{reference.text}"</span>
        </div>
        <p className={styles.gameCredit}>- {reference.game}</p>

        <p className={styles.message}>
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>

        {/* Navigation Options */}
        <div className={styles.actions}>
          <Link to="/">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Icon name="gamepad" size={20} />}
            >
              Return Home
            </Button>
          </Link>
          <Link to="/browse">
            <Button
              variant="secondary"
              size="lg"
              rightIcon={<Icon name="chevron-right" size={20} />}
            >
              Browse Games
            </Button>
          </Link>
        </div>

        {/* Hint */}
        <p className={styles.hint}>
          Tip: Maybe try the Konami Code?
        </p>

        {/* Decorative Elements */}
        <div className={styles.decoration}>
          <div className={styles.scanlines} />
          <div className={styles.noise} />
        </div>
      </div>

      {/* Pixel corners */}
      <div className={styles.pixelCorners} aria-hidden="true">
        <div className={styles.corner} data-position="tl" />
        <div className={styles.corner} data-position="tr" />
        <div className={styles.corner} data-position="bl" />
        <div className={styles.corner} data-position="br" />
      </div>
    </div>
  );
}

export { NotFoundPage };
export default NotFoundPage;
