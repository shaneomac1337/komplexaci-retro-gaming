/**
 * Custom Hooks Index
 * Central export point for all custom React hooks
 *
 * @module hooks
 */

// =============================================================================
// Debounce Hooks
// =============================================================================
export {
  useDebounce,
  useDebouncedCallback,
  useDebouncedCallbackWithControls,
} from './useDebounce';

// =============================================================================
// Media Query & Responsive Hooks
// =============================================================================
export {
  useMediaQuery,
  useMediaQueryWithDefault,
  useBreakpoint,
  useViewportSize,
  usePrefersReducedMotion,
  usePrefersColorScheme,
  BREAKPOINTS,
  type BreakpointKey,
} from './useMediaQuery';

// =============================================================================
// Fullscreen Hooks
// =============================================================================
export {
  useFullscreen,
  useIsDocumentFullscreen,
  useFullscreenWithShortcut,
} from './useFullscreen';

// =============================================================================
// Gamepad Hooks
// =============================================================================
export {
  useGamepad,
  useGamepadButtonPress,
  useGamepadSupport,
  GAMEPAD_BUTTONS,
  GAMEPAD_AXES,
  type GamepadState,
} from './useGamepad';

// =============================================================================
// Local Storage Hooks
// =============================================================================
export {
  useLocalStorage,
  useLocalStorageSync,
  useLocalStorageBoolean,
  useLocalStorageObject,
  useLocalStorageAvailable,
  isLocalStorageAvailable,
} from './useLocalStorage';

// =============================================================================
// Emulator Hooks
// =============================================================================
export {
  useEmulator,
  useEmulatorSupport,
  CDN_BASE_URL,
  CORE_MAPPING,
} from './useEmulator';

// =============================================================================
// Database Hooks (Dexie Live Query based)
// =============================================================================

// Favorites
export {
  useFavorites,
  useFavoriteStatus,
  useFavoritesCount,
  useBulkFavorites,
} from './useFavorites';

// Recently Played
export {
  useRecentlyPlayed,
  usePlaySession,
  useGamePlayStats,
  formatPlayTime,
} from './useRecentlyPlayed';

// Save States
export {
  useSaveStates,
  useSaveSlot,
  useSaveStatesCount,
  formatSaveSize,
  MAX_SLOTS,
  type SlotInfo,
} from './useSaveStates';

// =============================================================================
// Toast Hooks
// =============================================================================
export {
  useToast,
  useAdvancedToast,
  useToastPromise,
  useToastActions,
  type ToastOptions,
} from './useToast';

// =============================================================================
// Quick Save Indicator Hook
// =============================================================================
export {
  useQuickSaveIndicator,
  type QuickSaveIndicatorState,
} from './useQuickSaveIndicator';
