/**
 * SectionHeader Component
 * Reusable header for home page sections with consistent neon styling
 */

import { memo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import styles from './SectionHeader.module.css';

export interface SectionHeaderProps {
  /** Section title text */
  title: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Optional icon to display on the left */
  icon?: ReactNode;
  /** Optional action link on the right side */
  action?: {
    label: string;
    to: string;
  };
  /** Additional CSS class name */
  className?: string;
}

/**
 * SectionHeader component with Orbitron font and neon styling
 * Features optional icon, subtitle, and action link
 */
export const SectionHeader = memo(function SectionHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <header className={clsx(styles.header, className)}>
      <div className={styles.titleGroup}>
        {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
        <div className={styles.textGroup}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>

      {action && (
        <Link to={action.to} className={styles.action}>
          {action.label}
          <svg
            className={styles.actionIcon}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      )}

      <div className={styles.underline} aria-hidden="true" />
    </header>
  );
});
