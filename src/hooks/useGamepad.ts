/**
 * Gamepad Hook for Retro Gaming Platform
 *
 * Provides detection and state management for physical game controllers.
 * Uses the Gamepad API with animation frame polling for responsive input.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * State representation of a connected gamepad
 */
export interface GamepadState {
  /** Whether the gamepad is currently connected */
  connected: boolean;
  /** The native Gamepad object (null if disconnected) */
  gamepad: Gamepad | null;
  /** Array of button pressed states (true = pressed) */
  buttons: boolean[];
  /** Array of axis values (-1 to 1) */
  axes: number[];
  /** Gamepad index in the system */
  index: number;
  /** Gamepad identifier string */
  id: string;
  /** Timestamp of last update */
  timestamp: number;
}

/**
 * Default state for a disconnected gamepad slot
 */
const createEmptyGamepadState = (index: number): GamepadState => ({
  connected: false,
  gamepad: null,
  buttons: [],
  axes: [],
  index,
  id: '',
  timestamp: 0,
});

/**
 * Maximum number of gamepads to track (Gamepad API supports up to 4)
 */
const MAX_GAMEPADS = 4;

/**
 * Deadzone threshold for analog sticks to filter out noise
 */
const DEFAULT_DEADZONE = 0.1;

/**
 * Converts a native Gamepad object to our GamepadState format
 */
function gamepadToState(gamepad: Gamepad | null, index: number): GamepadState {
  if (!gamepad) {
    return createEmptyGamepadState(index);
  }

  return {
    connected: gamepad.connected,
    gamepad,
    buttons: Array.from(gamepad.buttons).map((button) => button.pressed),
    axes: Array.from(gamepad.axes),
    index: gamepad.index,
    id: gamepad.id,
    timestamp: gamepad.timestamp,
  };
}

/**
 * Applies deadzone to analog stick values to filter noise.
 */
function applyDeadzone(value: number, deadzone: number): number {
  if (Math.abs(value) < deadzone) {
    return 0;
  }
  // Scale value to full range after deadzone
  const sign = value > 0 ? 1 : -1;
  return sign * ((Math.abs(value) - deadzone) / (1 - deadzone));
}

/**
 * Hook for detecting and reading physical gamepad controllers.
 * Polls gamepad state on animation frames when controllers are connected.
 *
 * @param options - Configuration options
 * @returns Object with gamepad states and utility functions
 *
 * @example
 * ```tsx
 * function GameController() {
 *   const { gamepads, hasGamepad, primaryGamepad } = useGamepad();
 *
 *   useEffect(() => {
 *     if (primaryGamepad?.buttons[0]) {
 *       console.log('A button pressed!');
 *     }
 *   }, [primaryGamepad]);
 *
 *   return (
 *     <div>
 *       <p>Gamepad connected: {hasGamepad ? 'Yes' : 'No'}</p>
 *       {hasGamepad && (
 *         <p>Controller: {primaryGamepad?.id}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useGamepad(options: {
  /** Whether to actively poll gamepad state (default: true) */
  enabled?: boolean;
  /** Deadzone for analog sticks (default: 0.1) */
  deadzone?: number;
  /** Callback when a gamepad connects */
  onConnect?: (gamepad: GamepadState) => void;
  /** Callback when a gamepad disconnects */
  onDisconnect?: (index: number) => void;
} = {}): {
  gamepads: GamepadState[];
  hasGamepad: boolean;
  primaryGamepad: GamepadState | null;
  getButton: (index: number, buttonIndex: number) => boolean;
  getAxis: (index: number, axisIndex: number) => number;
} {
  const { enabled = true, deadzone = DEFAULT_DEADZONE, onConnect, onDisconnect } = options;

  const [gamepads, setGamepads] = useState<GamepadState[]>(() =>
    Array.from({ length: MAX_GAMEPADS }, (_, i) => createEmptyGamepadState(i))
  );

  const animationFrameRef = useRef<number | null>(null);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

  // Keep callback refs updated
  useEffect(() => {
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
  }, [onConnect, onDisconnect]);

  /**
   * Polls all connected gamepads and updates state
   */
  const pollGamepads = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      return;
    }

    const nativeGamepads = navigator.getGamepads();
    const newStates: GamepadState[] = [];

    for (let i = 0; i < MAX_GAMEPADS; i++) {
      const nativeGamepad = nativeGamepads[i];
      const state = gamepadToState(nativeGamepad, i);

      // Apply deadzone to axes
      if (state.connected) {
        state.axes = state.axes.map((axis) => applyDeadzone(axis, deadzone));
      }

      newStates.push(state);
    }

    setGamepads(newStates);
  }, [deadzone]);

  /**
   * Animation frame loop for polling gamepad state
   * Use useCallback with pollGamepads in the dependency array
   */
  const gameLoop = useCallback(() => {
    pollGamepads();
    // Schedule next frame using a local function reference
    const loop = () => {
      pollGamepads();
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    animationFrameRef.current = requestAnimationFrame(loop);
  }, [pollGamepads]);

  // Handle gamepad connection events
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleGamepadConnected = (event: GamepadEvent) => {
      const state = gamepadToState(event.gamepad, event.gamepad.index);
      onConnectRef.current?.(state);

      // Update state immediately on connect
      setGamepads((prev) => {
        const newStates = [...prev];
        newStates[event.gamepad.index] = state;
        return newStates;
      });
    };

    const handleGamepadDisconnected = (event: GamepadEvent) => {
      const index = event.gamepad.index;
      onDisconnectRef.current?.(index);

      // Update state immediately on disconnect
      setGamepads((prev) => {
        const newStates = [...prev];
        newStates[index] = createEmptyGamepadState(index);
        return newStates;
      });
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
    };
  }, []);

  // Start/stop polling based on enabled state and gamepad connections
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Check if any gamepads are connected
    const hasConnectedGamepad = gamepads.some((gp) => gp.connected);

    if (hasConnectedGamepad && !animationFrameRef.current) {
      // Start polling
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    } else if (!hasConnectedGamepad && animationFrameRef.current) {
      // Stop polling when no gamepads connected
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [enabled, gamepads, gameLoop]);

  // Initial gamepad detection - use setTimeout to avoid sync setState
  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') {
      setTimeout(() => pollGamepads(), 0);
    }
  }, [pollGamepads]);

  /**
   * Get button state for a specific gamepad and button
   */
  const getButton = useCallback(
    (gamepadIndex: number, buttonIndex: number): boolean => {
      const gamepad = gamepads[gamepadIndex];
      if (!gamepad?.connected || !gamepad.buttons[buttonIndex]) {
        return false;
      }
      return gamepad.buttons[buttonIndex];
    },
    [gamepads]
  );

  /**
   * Get axis value for a specific gamepad and axis
   */
  const getAxis = useCallback(
    (gamepadIndex: number, axisIndex: number): number => {
      const gamepad = gamepads[gamepadIndex];
      if (!gamepad?.connected || gamepad.axes[axisIndex] === undefined) {
        return 0;
      }
      return gamepad.axes[axisIndex];
    },
    [gamepads]
  );

  // Check if any gamepad is connected
  const hasGamepad = gamepads.some((gp) => gp.connected);

  // Get the first connected gamepad (primary)
  const primaryGamepad = gamepads.find((gp) => gp.connected) || null;

  return {
    gamepads,
    hasGamepad,
    primaryGamepad,
    getButton,
    getAxis,
  };
}

/**
 * Standard gamepad button mapping (Xbox layout)
 * Based on W3C Gamepad API standard mapping
 */
export const GAMEPAD_BUTTONS = {
  A: 0, // Cross (PlayStation)
  B: 1, // Circle
  X: 2, // Square
  Y: 3, // Triangle
  L1: 4, // Left bumper
  R1: 5, // Right bumper
  L2: 6, // Left trigger
  R2: 7, // Right trigger
  SELECT: 8, // Back/Select
  START: 9, // Start/Options
  L3: 10, // Left stick press
  R3: 11, // Right stick press
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
  HOME: 16, // Guide/PS button
} as const;

/**
 * Standard gamepad axis mapping
 */
export const GAMEPAD_AXES = {
  LEFT_STICK_X: 0,
  LEFT_STICK_Y: 1,
  RIGHT_STICK_X: 2,
  RIGHT_STICK_Y: 3,
} as const;

/**
 * Hook for detecting button presses (edge detection).
 * Triggers once when button is pressed, not continuously while held.
 *
 * @param gamepadState - Current gamepad state
 * @param buttonIndex - Button index to watch
 * @param onPress - Callback when button is pressed
 *
 * @example
 * ```tsx
 * function GameMenu() {
 *   const { primaryGamepad } = useGamepad();
 *
 *   useGamepadButtonPress(primaryGamepad, GAMEPAD_BUTTONS.A, () => {
 *     console.log('A pressed - select menu item');
 *   });
 *
 *   useGamepadButtonPress(primaryGamepad, GAMEPAD_BUTTONS.B, () => {
 *     console.log('B pressed - go back');
 *   });
 *
 *   return <Menu />;
 * }
 * ```
 */
export function useGamepadButtonPress(
  gamepadState: GamepadState | null,
  buttonIndex: number,
  onPress: () => void
): void {
  const previousStateRef = useRef<boolean>(false);
  const onPressRef = useRef(onPress);

  useEffect(() => {
    onPressRef.current = onPress;
  }, [onPress]);

  useEffect(() => {
    if (!gamepadState?.connected) {
      previousStateRef.current = false;
      return;
    }

    const currentState = gamepadState.buttons[buttonIndex] ?? false;
    const wasPressed = previousStateRef.current;

    // Detect rising edge (button just pressed)
    if (currentState && !wasPressed) {
      onPressRef.current();
    }

    previousStateRef.current = currentState;
  }, [gamepadState, buttonIndex]);
}

/**
 * Hook that returns a simple boolean for gamepad support detection.
 *
 * @example
 * ```tsx
 * function Controls() {
 *   const gamepadSupported = useGamepadSupport();
 *
 *   return (
 *     <div>
 *       {gamepadSupported
 *         ? 'Connect a gamepad for best experience!'
 *         : 'Gamepad not supported in this browser'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useGamepadSupport(): boolean {
  // Initialize with computed value to avoid setState in effect
  const [supported] = useState(() =>
    typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function'
  );

  return supported;
}
