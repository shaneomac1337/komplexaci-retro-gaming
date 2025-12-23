/**
 * Stores Index
 * Central export point for all Zustand stores
 */

// =============================================================================
// Game Store
// =============================================================================
export { useGameStore } from './gameStore';
export {
  selectGames,
  selectIsLoading as selectGamesLoading,
  selectError as selectGamesError,
  selectSelectedConsole,
  selectSearchQuery,
  selectSortConfig,
  selectViewMode,
  selectGameCountByConsole,
  selectTotalGameCount,
  selectFilteredGameCount,
  selectHasActiveFilters,
} from './gameStore';

// =============================================================================
// Emulator Store
// =============================================================================
export { useEmulatorStore } from './emulatorStore';
export {
  selectCurrentGame,
  selectIsPlaying,
  selectIsLoading as selectEmulatorLoading,
  selectLoadProgress,
  selectVolumeSettings,
  selectEffectiveVolume,
  selectIsFullscreen,
  selectShowVirtualGamepad,
  selectHasGameLoaded,
  selectCurrentConsole,
  selectIsReady,
} from './emulatorStore';

// =============================================================================
// UI Store
// =============================================================================
export { useUIStore } from './uiStore';
export {
  selectIsSidebarOpen,
  selectIsSidebarCollapsed,
  selectSidebarState,
  selectActiveModal,
  selectModalData,
  selectModalState,
  selectToasts,
  selectToastCount,
  selectHasToasts,
  createModalSelector,
  // Toast helpers
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast,
} from './uiStore';
