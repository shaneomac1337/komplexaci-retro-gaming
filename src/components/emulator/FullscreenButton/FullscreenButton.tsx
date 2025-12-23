/**
 * FullscreenButton Component
 *
 * Simple fullscreen toggle button using the useFullscreen hook.
 * Displays appropriate icon and handles keyboard shortcut (F).
 */

import { memo, useCallback, useEffect, type RefObject } from 'react';
import { useFullscreen } from '@/hooks/useFullscreen';

export interface FullscreenButtonProps {
  /** Ref to the element to make fullscreen */
  targetRef: RefObject<HTMLElement | null>;
  /** Additional CSS class name */
  className?: string;
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
      style={{ width: '20px', height: '20px' }}
    >
      <polyline points="15,3 21,3 21,9" />
      <polyline points="9,21 3,21 3,15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

/**
 * Fullscreen compress/exit icon
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
      style={{ width: '20px', height: '20px' }}
    >
      <polyline points="4,14 10,14 10,20" />
      <polyline points="20,10 14,10 14,4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

const buttonStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  padding: 0,
  background: 'transparent',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  color: 'rgba(255, 255, 255, 0.8)',
  transition: 'all 0.2s ease',
};

const buttonHoverStyles: React.CSSProperties = {
  background: 'rgba(0, 255, 255, 0.1)',
  color: '#00ffff',
};

/**
 * Fullscreen toggle button component.
 * Uses the F key as keyboard shortcut for toggling fullscreen.
 */
function FullscreenButtonComponent({ targetRef, className = '' }: FullscreenButtonProps) {
  const { isFullscreen, toggleFullscreen, isSupported } = useFullscreen(targetRef);

  const handleClick = useCallback(() => {
    toggleFullscreen();
  }, [toggleFullscreen]);

  // Handle keyboard shortcut (F key)
  useEffect(() => {
    if (!isSupported) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if F is pressed without modifiers and not in an input
      if (
        (event.key === 'f' || event.key === 'F') &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSupported, toggleFullscreen]);

  // Don't render if fullscreen is not supported
  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      className={className}
      style={buttonStyles}
      onClick={handleClick}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, buttonHoverStyles);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
      }}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      aria-pressed={isFullscreen}
      title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
    >
      {isFullscreen ? <CompressIcon /> : <ExpandIcon />}
    </button>
  );
}

export const FullscreenButton = memo(FullscreenButtonComponent);
FullscreenButton.displayName = 'FullscreenButton';
