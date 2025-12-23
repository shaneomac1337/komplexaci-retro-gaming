/**
 * Icon Component
 * Renders SVG icons with customizable size and color
 */

import { memo } from 'react';
import { iconComponents, type IconName } from './icons';

export interface IconProps {
  /** Name of the icon to render */
  name: IconName;
  /** Size of the icon in pixels (default: 24) */
  size?: number;
  /** Color of the icon (default: currentColor) */
  color?: string;
  /** Additional CSS class name */
  className?: string;
  /** Accessible label for the icon */
  'aria-label'?: string;
  /** Whether the icon is decorative (hidden from screen readers) */
  'aria-hidden'?: boolean;
}

/**
 * Icon component that renders inline SVG icons
 * Supports all icons defined in the icons.tsx file
 */
export const Icon = memo(function Icon({
  name,
  size = 24,
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden = !ariaLabel,
}: IconProps) {
  const IconComponent = iconComponents[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <IconComponent
      width={size}
      height={size}
      style={{ color, minWidth: size, minHeight: size }}
      className={className}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      role={ariaLabel ? 'img' : undefined}
    />
  );
});

export type { IconName };
