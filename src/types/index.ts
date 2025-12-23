/**
 * Type Definitions Index
 * Central export point for all TypeScript types used in the Retro Gaming Platform
 *
 * @module types
 */

// =============================================================================
// Console Types
// =============================================================================
export type {
  ConsoleType,
  RomExtension,
  BiosFile,
  ConsoleConfiguration,
  ConsoleConfigMap,
} from './console.types';

export {
  CONSOLE_CONFIG,
  SUPPORTED_CONSOLES,
  isConsoleType,
  getConsoleConfig,
  getAllSupportedExtensions,
} from './console.types';

// =============================================================================
// Game Types
// =============================================================================
export type {
  GameGenre,
  PlayerCount,
  GameSortField,
  SortOrder,
  Game,
  GameWithMetadata,
  GamesManifest,
  GameFilter,
  FilteredGamesResult,
  GameSearchResult,
} from './game.types';

export {
  DEFAULT_GAME_FILTER,
  isValidGame,
  isValidGamesManifest,
  createGame,
} from './game.types';

// =============================================================================
// Emulator Types
// =============================================================================
export type {
  EmulatorCore,
  EmulatorLanguage,
  EmulatorShader,
  EmulatorColorScheme,
  FastForwardRatio,
  RewindGranularity,
  EmulatorConfig,
  InputButton,
  KeyboardMapping,
  GamepadMapping,
  ControlMapping,
  PlayerControlMappings,
  EmulatorState,
  SaveStateSlot,
  GameSaveStates,
  EmulatorAction,
} from './emulator.types';

export {
  DEFAULT_EMULATOR_STATE,
  MAX_SAVE_SLOTS,
  createEmptySaveSlots,
} from './emulator.types';

// =============================================================================
// Database Types
// =============================================================================
export type {
  BaseEntity,
  SaveState,
  SaveStateInput,
  FavoriteGame,
  FavoriteGameInput,
  PlaySession,
  PlaySessionInput,
  GamePlayStats,
  VirtualGamepadSettings,
  DisplaySettings,
  UserSettings,
  UserSettingsUpdate,
  DatabaseMeta,
  DatabaseTableName,
  DatabaseStats,
} from './database.types';

export {
  SAVE_SLOT,
  DEFAULT_VIRTUAL_GAMEPAD_SETTINGS,
  DEFAULT_DISPLAY_SETTINGS,
  DEFAULT_USER_SETTINGS,
} from './database.types';

// =============================================================================
// UI Types
// =============================================================================
export type {
  ModalType,
  ToastType,
  Toast,
  ToastInput,
  ViewMode,
  SortOption,
  GridSize,
  SidebarState,
  RoutePath,
  Breadcrumb,
  ConfirmDialogConfig,
  ModalState,
  LoadingState,
  ErrorState,
  ConsoleFilterButton,
  GameCardProps,
  PaginationState,
  ThemeConfig,
  KeyboardShortcut,
  Breakpoint,
  ScreenSize,
  ContextMenuItem,
  ContextMenuState,
} from './ui.types';

export {
  DEFAULT_TOAST_DURATION,
  DEFAULT_MODAL_STATE,
  DEFAULT_THEME_CONFIG,
  BREAKPOINTS,
} from './ui.types';
