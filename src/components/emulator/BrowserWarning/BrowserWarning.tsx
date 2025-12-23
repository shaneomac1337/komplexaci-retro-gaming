/**
 * BrowserWarning Component
 *
 * Displays a warning when the user is on Firefox, recommending
 * Chrome/Edge for better audio performance with EmulatorJS.
 */

import { memo, useState, useLayoutEffect } from 'react';
import styles from './BrowserWarning.module.css';

export interface BrowserWarningProps {
  /** Callback when user dismisses the warning */
  onDismiss: () => void;
  /** Callback when user chooses to continue anyway */
  onContinue: () => void;
}

/**
 * Detect if the current browser is Firefox
 */
function isFirefox(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.toLowerCase().includes('firefox');
}

/**
 * Get browser recommendation based on OS
 */
function getRecommendedBrowser(): string {
  if (typeof navigator === 'undefined') return 'Chrome or Edge';
  const platform = navigator.platform.toLowerCase();
  if (platform.includes('mac')) return 'Chrome or Safari';
  if (platform.includes('win')) return 'Edge or Chrome';
  return 'Chrome or Edge';
}

// Initialize Firefox detection immediately (not in effect)
const firefoxDetectedOnLoad = typeof navigator !== 'undefined' && isFirefox();

function BrowserWarningComponent({ onDismiss, onContinue }: BrowserWarningProps) {
  const [isVisible, setIsVisible] = useState(firefoxDetectedOnLoad);
  const recommendedBrowser = getRecommendedBrowser();

  // Auto-continue for non-Firefox browsers (using layout effect to avoid flash)
  useLayoutEffect(() => {
    if (!firefoxDetectedOnLoad) {
      onContinue();
    }
  }, [onContinue]);

  if (!isVisible) return null;

  const handleContinue = () => {
    setIsVisible(false);
    onContinue();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Warning icon */}
        <div className={styles.iconWrapper}>
          <svg
            className={styles.warningIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Title */}
        <h2 className={styles.title}>Browser Compatibility Notice</h2>

        {/* Message */}
        <div className={styles.content}>
          <p className={styles.mainMessage}>
            You're using <span className={styles.highlight}>Firefox</span>, which may experience
            <span className={styles.issue}> audio stuttering</span> during emulation.
          </p>

          <div className={styles.recommendation}>
            <div className={styles.recommendLabel}>RECOMMENDED</div>
            <p className={styles.recommendText}>
              For the best experience, we recommend using <strong>{recommendedBrowser}</strong>.
            </p>
          </div>

          <div className={styles.technicalNote}>
            <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span>
              This is due to Firefox's Web Audio API implementation differences with EmulatorJS.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.continueButton}
            onClick={handleContinue}
          >
            <span className={styles.buttonText}>Continue Anyway</span>
            <span className={styles.buttonSubtext}>I understand there may be audio issues</span>
          </button>

          <button
            className={styles.backButton}
            onClick={handleDismiss}
          >
            Go Back
          </button>
        </div>

        {/* Firefox logo decorative */}
        <div className={styles.firefoxBadge}>
          <svg viewBox="0 0 24 24" className={styles.firefoxIcon}>
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span>Firefox Detected</span>
        </div>
      </div>
    </div>
  );
}

export const BrowserWarning = memo(BrowserWarningComponent);
BrowserWarning.displayName = 'BrowserWarning';

export default BrowserWarning;
