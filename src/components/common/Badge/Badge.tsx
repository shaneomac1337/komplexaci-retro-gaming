/**
 * Badge Component
 * Cyberpunk-styled badge with console-specific variants
 */

import { memo, type ReactNode } from 'react';
import clsx from 'clsx';
import type { ConsoleType } from '@/types';
import styles from './Badge.module.css';

export interface BadgeProps {
  /** Visual style variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'console';
  /** Console type for console-specific styling */
  console?: ConsoleType;
  /** Badge size */
  size?: 'sm' | 'md';
  /** Badge content */
  children: ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * Badge component with cyberpunk styling
 * Supports standard variants and console-specific colors
 */
export const Badge = memo(function Badge({
  variant = 'default',
  console: consoleType,
  size = 'sm',
  children,
  className,
}: BadgeProps) {
  // Determine the console class if variant is 'console' and consoleType is provided
  const consoleClass = variant === 'console' && consoleType
    ? styles[`console${consoleType}` as keyof typeof styles]
    : undefined;

  return (
    <span
      className={clsx(
        styles.badge,
        styles[size],
        styles[variant],
        consoleClass,
        className
      )}
    >
      {children}
    </span>
  );
});
