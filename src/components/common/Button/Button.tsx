/**
 * Button Component
 * Cyberpunk-themed button with neon glow effects and multiple variants
 */

import { forwardRef, memo, type ReactNode, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Show loading spinner */
  isLoading?: boolean;
  /** Icon to show on the left side */
  leftIcon?: ReactNode;
  /** Icon to show on the right side */
  rightIcon?: ReactNode;
  /** Make button full width */
  fullWidth?: boolean;
  /** Button content */
  children: ReactNode;
}

/**
 * Button component with cyberpunk styling
 * Features neon glow effects, loading states, and icon support
 */
export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      className,
      type = 'button',
      ...props
    },
    ref
  ) {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={clsx(
          styles.button,
          styles[variant],
          styles[size],
          {
            [styles.fullWidth]: fullWidth,
            [styles.loading]: isLoading,
          },
          className
        )}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        {...props}
      >
        {isLoading && <span className={styles.loadingSpinner} aria-hidden="true" />}
        <span className={styles.content}>
          {leftIcon && <span className={styles.iconLeft}>{leftIcon}</span>}
          {children}
          {rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
        </span>
      </button>
    );
  })
);
