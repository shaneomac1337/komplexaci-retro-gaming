/**
 * Card Component
 * Glassmorphism card with cyberpunk styling and hover effects
 */

import { forwardRef, memo, type ReactNode, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: 'default' | 'interactive' | 'glass';
  /** Enable hover animation effect */
  hover?: boolean;
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Card content */
  children: ReactNode;
}

const paddingMap = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
} as const;

/**
 * Card component with glassmorphism and cyberpunk styling
 * Supports multiple variants and hover animations
 */
export const Card = memo(
  forwardRef<HTMLDivElement, CardProps>(function Card(
    {
      variant = 'default',
      hover = false,
      padding = 'md',
      children,
      className,
      onClick,
      ...props
    },
    ref
  ) {
    // Interactive variant is automatically clickable
    const isClickable = variant === 'interactive' || !!onClick;

    return (
      <div
        ref={ref}
        className={clsx(
          styles.card,
          styles[variant],
          paddingMap[padding],
          {
            [styles.hoverEnabled]: hover && variant === 'default',
          },
          className
        )}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={
          isClickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
                }
              }
            : undefined
        }
        {...props}
      >
        {children}
      </div>
    );
  })
);
