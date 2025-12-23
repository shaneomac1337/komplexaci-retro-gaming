/**
 * GamepadIndicator Component
 * Shows connection status of physical gamepad controllers
 */

import { memo } from 'react';
import clsx from 'clsx';
import { useGamepad } from '@/hooks/useGamepad';
import { Icon } from '@/components/common/Icon';
import styles from './GamepadIndicator.module.css';

export interface GamepadIndicatorProps {
  /** Additional CSS class name */
  className?: string;
}

/**
 * GamepadIndicator displays the connection status of physical gamepads
 * Shows a pulsing indicator when a controller is connected
 */
export const GamepadIndicator = memo(function GamepadIndicator({
  className,
}: GamepadIndicatorProps) {
  const { hasGamepad, primaryGamepad } = useGamepad();

  // Get controller name (clean up common patterns)
  const getControllerName = (): string => {
    if (!primaryGamepad?.id) return 'No controller';

    // Common patterns to clean up
    let name = primaryGamepad.id;

    // Remove vendor/product IDs
    name = name.replace(/\s*\(.*?\)\s*/g, ' ').trim();

    // Truncate if too long
    if (name.length > 30) {
      name = name.substring(0, 27) + '...';
    }

    return name || 'Controller';
  };

  return (
    <div className={clsx(styles.container, className)}>
      <div
        className={clsx(styles.indicator, { [styles.connected]: hasGamepad })}
        role="status"
        aria-label={hasGamepad ? `Controller connected: ${getControllerName()}` : 'No controller connected'}
        tabIndex={hasGamepad ? 0 : -1}
      >
        <Icon
          name="gamepad"
          size={20}
          className={styles.indicatorIcon}
          aria-hidden
        />
      </div>

      {/* Status dot */}
      <span
        className={clsx(styles.statusDot, { [styles.connected]: hasGamepad })}
        aria-hidden="true"
      />

      {/* Tooltip */}
      <div className={styles.tooltip} role="tooltip">
        <div className={styles.tooltipTitle}>Controller</div>
        <div
          className={clsx(styles.tooltipStatus, {
            [styles.connected]: hasGamepad,
            [styles.disconnected]: !hasGamepad,
          })}
        >
          {hasGamepad ? (
            <>
              <span>Connected:</span>
              <span>{getControllerName()}</span>
            </>
          ) : (
            <span>Not connected</span>
          )}
        </div>
      </div>
    </div>
  );
});
