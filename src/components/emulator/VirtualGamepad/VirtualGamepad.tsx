/**
 * VirtualGamepad Component
 * Touch-friendly on-screen controls for mobile devices
 * Supports multiple console layouts (NES, SNES, PS1, N64, GB, GBA)
 */

import { memo, useCallback, useState, useRef, useEffect, type TouchEvent } from 'react';
import clsx from 'clsx';
import type { ConsoleType } from '@/types/console.types';
import { Icon } from '@/components/common/Icon';
import styles from './VirtualGamepad.module.css';

export interface VirtualGamepadProps {
  /** Console type to determine button layout */
  console: ConsoleType;
  /** Callback when a button is pressed */
  onButtonPress?: (button: string) => void;
  /** Callback when a button is released */
  onButtonRelease?: (button: string) => void;
  /** Opacity of the gamepad (0-1) */
  opacity?: number;
  /** Whether to show the gamepad */
  visible?: boolean;
  /** Callback when visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * Button configurations per console type
 */
const CONSOLE_BUTTONS: Record<ConsoleType, { actions: string[]; shoulders?: string[]; cButtons?: boolean }> = {
  nes: {
    actions: ['B', 'A'],
  },
  snes: {
    actions: ['Y', 'X', 'B', 'A'],
    shoulders: ['L', 'R'],
  },
  ps1: {
    actions: ['Square', 'Triangle', 'X', 'O'],
    shoulders: ['L1', 'R1', 'L2', 'R2'],
  },
  n64: {
    actions: ['B', 'A'],
    shoulders: ['L', 'R', 'Z'],
    cButtons: true,
  },
  gb: {
    actions: ['B', 'A'],
  },
  gba: {
    actions: ['B', 'A'],
    shoulders: ['L', 'R'],
  },
};

/**
 * Keyboard key mappings for each button
 */
const BUTTON_KEYMAPS: Record<string, string> = {
  // D-Pad
  Up: 'ArrowUp',
  Down: 'ArrowDown',
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
  // Action buttons
  A: 'KeyX',
  B: 'KeyZ',
  X: 'KeyS',
  Y: 'KeyA',
  // PlayStation buttons
  O: 'KeyX',
  Square: 'KeyA',
  Triangle: 'KeyS',
  // Shoulder buttons
  L: 'KeyQ',
  R: 'KeyE',
  L1: 'KeyQ',
  R1: 'KeyE',
  L2: 'Digit1',
  R2: 'Digit3',
  Z: 'KeyQ',
  // System buttons
  Start: 'Enter',
  Select: 'ShiftRight',
  // N64 C-Buttons
  CUp: 'KeyI',
  CDown: 'KeyK',
  CLeft: 'KeyJ',
  CRight: 'KeyL',
};

/**
 * Dispatches a keyboard event to simulate button press/release
 */
function dispatchKeyEvent(key: string, type: 'keydown' | 'keyup') {
  const event = new KeyboardEvent(type, {
    key,
    code: BUTTON_KEYMAPS[key] || key,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
}

/**
 * GamepadButton - A pressable button component
 */
interface GamepadButtonProps {
  label: string;
  className?: string;
  onPress: () => void;
  onRelease: () => void;
  ariaLabel: string;
}

const GamepadButton = memo(function GamepadButton({
  label,
  className,
  onPress,
  onRelease,
  ariaLabel,
}: GamepadButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      event.preventDefault();
      setIsPressed(true);
      onPress();
    },
    [onPress]
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      event.preventDefault();
      setIsPressed(false);
      onRelease();
    },
    [onRelease]
  );

  return (
    <button
      ref={buttonRef}
      type="button"
      className={clsx(className, { [styles.pressed]: isPressed })}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={() => {
        setIsPressed(true);
        onPress();
      }}
      onMouseUp={() => {
        setIsPressed(false);
        onRelease();
      }}
      onMouseLeave={() => {
        if (isPressed) {
          setIsPressed(false);
          onRelease();
        }
      }}
      aria-label={ariaLabel}
      aria-pressed={isPressed}
    >
      {label}
    </button>
  );
});

/**
 * VirtualGamepad provides on-screen touch controls for mobile gaming
 */
export const VirtualGamepad = memo(function VirtualGamepad({
  console: consoleType,
  onButtonPress,
  onButtonRelease,
  opacity = 0.7,
  visible = true,
  onVisibilityChange,
}: VirtualGamepadProps) {
  // Track the previous visible prop value to detect changes
  const prevVisibleRef = useRef(visible);
  // Use prop directly as the source of truth, with local override for toggle
  const [localOverride, setLocalOverride] = useState<boolean | null>(null);
  const config = CONSOLE_BUTTONS[consoleType];

  // Reset local override when prop changes - using ref comparison to avoid sync setState
  useEffect(() => {
    if (prevVisibleRef.current !== visible) {
      prevVisibleRef.current = visible;
      // Use setTimeout to make the state update async
      setTimeout(() => setLocalOverride(null), 0);
    }
  }, [visible]);

  // Derive visibility from prop and local override
  const isVisible = localOverride !== null ? localOverride : visible;

  /**
   * Handle button press
   */
  const handlePress = useCallback(
    (button: string) => {
      dispatchKeyEvent(button, 'keydown');
      onButtonPress?.(button);
    },
    [onButtonPress]
  );

  /**
   * Handle button release
   */
  const handleRelease = useCallback(
    (button: string) => {
      dispatchKeyEvent(button, 'keyup');
      onButtonRelease?.(button);
    },
    [onButtonRelease]
  );

  /**
   * Toggle visibility
   */
  const toggleVisibility = useCallback(() => {
    const newValue = !isVisible;
    setLocalOverride(newValue);
    onVisibilityChange?.(newValue);
  }, [isVisible, onVisibilityChange]);

  /**
   * Get button class based on button name
   */
  const getButtonClass = (button: string): string => {
    const buttonLower = button.toLowerCase();
    if (buttonLower === 'a' || buttonLower === 'o') return styles.buttonA;
    if (buttonLower === 'b' || buttonLower === 'x') return styles.buttonB;
    if (buttonLower === 'x' || buttonLower === 'square') return styles.buttonX;
    if (buttonLower === 'y' || buttonLower === 'triangle') return styles.buttonY;
    return '';
  };

  /**
   * Get action buttons grid class
   */
  const getActionGridClass = (): string => {
    switch (consoleType) {
      case 'nes':
      case 'gb':
        return styles.actionButtonsNes;
      case 'snes':
      case 'gba':
        return styles.actionButtonsSnes;
      case 'ps1':
        return styles.actionButtonsPs1;
      case 'n64':
        return styles.actionButtonsN64;
      default:
        return styles.actionButtonsGb;
    }
  };

  return (
    <>
      {/* Toggle button - always visible */}
      <button
        type="button"
        className={clsx(styles.toggleButton, { [styles.active]: isVisible })}
        onClick={toggleVisibility}
        aria-label={isVisible ? 'Hide virtual gamepad' : 'Show virtual gamepad'}
        aria-pressed={isVisible}
      >
        <Icon name="gamepad" size={20} />
      </button>

      {/* Gamepad container */}
      <div
        className={clsx(styles.container, { [styles.hidden]: !isVisible })}
        style={{ opacity }}
        role="group"
        aria-label="Virtual gamepad controls"
        aria-hidden={!isVisible}
      >
        {/* Left section - D-Pad */}
        <div className={styles.leftSection}>
          <div className={styles.dpad} role="group" aria-label="Directional pad">
            <GamepadButton
              label=""
              className={clsx(styles.dpadButton, styles.dpadUp)}
              onPress={() => handlePress('Up')}
              onRelease={() => handleRelease('Up')}
              ariaLabel="D-pad up"
            />
            <GamepadButton
              label=""
              className={clsx(styles.dpadButton, styles.dpadDown)}
              onPress={() => handlePress('Down')}
              onRelease={() => handleRelease('Down')}
              ariaLabel="D-pad down"
            />
            <GamepadButton
              label=""
              className={clsx(styles.dpadButton, styles.dpadLeft)}
              onPress={() => handlePress('Left')}
              onRelease={() => handleRelease('Left')}
              ariaLabel="D-pad left"
            />
            <GamepadButton
              label=""
              className={clsx(styles.dpadButton, styles.dpadRight)}
              onPress={() => handlePress('Right')}
              onRelease={() => handleRelease('Right')}
              ariaLabel="D-pad right"
            />
            <div className={clsx(styles.dpadButton, styles.dpadCenter)} aria-hidden="true" />
          </div>
        </div>

        {/* Center section - Start/Select */}
        <div className={styles.centerSection}>
          <div className={styles.systemButtons} role="group" aria-label="System buttons">
            <GamepadButton
              label="Select"
              className={styles.systemButton}
              onPress={() => handlePress('Select')}
              onRelease={() => handleRelease('Select')}
              ariaLabel="Select button"
            />
            <GamepadButton
              label="Start"
              className={styles.systemButton}
              onPress={() => handlePress('Start')}
              onRelease={() => handleRelease('Start')}
              ariaLabel="Start button"
            />
          </div>
        </div>

        {/* Right section - Action buttons */}
        <div className={styles.rightSection}>
          {/* Shoulder buttons */}
          {config.shoulders && (
            <div className={styles.shoulderButtons} role="group" aria-label="Shoulder buttons">
              {config.shoulders.map((button) => (
                <GamepadButton
                  key={button}
                  label={button}
                  className={styles.shoulderButton}
                  onPress={() => handlePress(button)}
                  onRelease={() => handleRelease(button)}
                  ariaLabel={`${button} shoulder button`}
                />
              ))}
            </div>
          )}

          {/* N64 C-Buttons */}
          {config.cButtons && (
            <div className={styles.cButtons} role="group" aria-label="C-buttons">
              <GamepadButton
                label="C"
                className={styles.cButton}
                onPress={() => handlePress('CUp')}
                onRelease={() => handleRelease('CUp')}
                ariaLabel="C-up button"
              />
              <GamepadButton
                label="C"
                className={styles.cButton}
                onPress={() => handlePress('CDown')}
                onRelease={() => handleRelease('CDown')}
                ariaLabel="C-down button"
              />
              <GamepadButton
                label="C"
                className={styles.cButton}
                onPress={() => handlePress('CLeft')}
                onRelease={() => handleRelease('CLeft')}
                ariaLabel="C-left button"
              />
              <GamepadButton
                label="C"
                className={styles.cButton}
                onPress={() => handlePress('CRight')}
                onRelease={() => handleRelease('CRight')}
                ariaLabel="C-right button"
              />
            </div>
          )}

          {/* Action buttons */}
          <div
            className={clsx(styles.actionButtons, getActionGridClass())}
            role="group"
            aria-label="Action buttons"
          >
            {config.actions.map((button) => (
              <GamepadButton
                key={button}
                label={button.length > 2 ? button.charAt(0) : button}
                className={clsx(styles.actionButton, getButtonClass(button))}
                onPress={() => handlePress(button)}
                onRelease={() => handleRelease(button)}
                ariaLabel={`${button} button`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
});
