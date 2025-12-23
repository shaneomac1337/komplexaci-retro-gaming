/**
 * Emulator Components
 *
 * Core components for the EmulatorJS-based retro gaming player.
 * Includes the main container, controls, overlays, and utility components.
 *
 * @module components/emulator
 */

// Main Container
export { EmulatorContainer } from './EmulatorContainer';
export type { EmulatorContainerProps } from './EmulatorContainer';

// Bezel
export { EmulatorBezel } from './EmulatorBezel';
export type { EmulatorBezelProps } from './EmulatorBezel';

// Controls
export { EmulatorControls } from './EmulatorControls';
export type { EmulatorControlsProps } from './EmulatorControls';

// Volume Control
export { VolumeControl } from './VolumeControl';
export type { VolumeControlProps } from './VolumeControl';

// Fullscreen Button
export { FullscreenButton } from './FullscreenButton';
export type { FullscreenButtonProps } from './FullscreenButton';

// Loading Overlay
export { LoadingOverlay } from './LoadingOverlay';
export type { LoadingOverlayProps } from './LoadingOverlay';

// Error Overlay
export { ErrorOverlay } from './ErrorOverlay';
export type { ErrorOverlayProps } from './ErrorOverlay';

// Save State Manager
export { SaveStateManager, SaveStateSlot } from './SaveStateManager';
export type { SaveStateManagerProps, SaveStateSlotProps } from './SaveStateManager';

// Virtual Gamepad
export { VirtualGamepad } from './VirtualGamepad';
export type { VirtualGamepadProps } from './VirtualGamepad';

// Gamepad Indicator
export { GamepadIndicator } from './GamepadIndicator';
export type { GamepadIndicatorProps } from './GamepadIndicator';

// Quick Save Indicator
export { QuickSaveIndicator } from './QuickSaveIndicator';
export type { QuickSaveIndicatorProps } from './QuickSaveIndicator';
export { useQuickSaveIndicator } from '@/hooks/useQuickSaveIndicator';

// Emulator Keyboard Help
export { EmulatorKeyboardHelp } from './EmulatorKeyboardHelp';
export type { EmulatorKeyboardHelpProps } from './EmulatorKeyboardHelp';
