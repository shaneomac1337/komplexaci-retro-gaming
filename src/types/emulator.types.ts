/**
 * Emulator Types for EmulatorJS Integration
 * Defines configuration options, state management, and save state handling
 */

import type { ConsoleType } from './console.types';

/**
 * EmulatorJS core type mapping
 * Maps our console types to EmulatorJS core identifiers
 */
export type EmulatorCore = 'psx' | 'mednafen_psx_hw' | 'pcsx_rearmed' | 'nes' | 'snes' | 'n64' | 'gb' | 'gba';

/**
 * EmulatorJS language codes
 */
export type EmulatorLanguage =
  | 'en-US'
  | 'es-ES'
  | 'pt-BR'
  | 'de-DE'
  | 'fr-FR'
  | 'it-IT'
  | 'ja-JP'
  | 'ko-KR'
  | 'zh-CN'
  | 'ru-RU';

/**
 * Shader/filter options available in EmulatorJS
 */
export type EmulatorShader =
  | ''
  | 'crt-aperture'
  | 'crt-easymode'
  | 'crt-geom'
  | 'crt-mattias'
  | 'sabr'
  | 'bicubic'
  | 'mix-frames';

/**
 * Color scheme options
 */
export type EmulatorColorScheme = 'auto' | 'light' | 'dark';

/**
 * Fast-forward ratio options
 */
export type FastForwardRatio = 1.5 | 2 | 3 | 4 | 5 | 10 | 'unlimited';

/**
 * Rewind granularity in frames
 */
export type RewindGranularity = 1 | 3 | 6 | 10 | 15 | 30 | 60;

/**
 * Complete EmulatorJS configuration options
 * Prefixed with EJS_ to match EmulatorJS convention
 * @see https://emulatorjs.org/docs/Options.html
 */
export interface EmulatorConfig {
  /** Path to EmulatorJS core files */
  EJS_pathtodata: string;
  /** URL/path to the ROM file */
  EJS_gameUrl: string;
  /** Core to use for emulation */
  EJS_core: EmulatorCore;
  /** Game display name */
  EJS_gameName?: string;
  /** Starting save state URL (optional) */
  EJS_loadStateURL?: string;
  /** BIOS file URL (for consoles that require it) */
  EJS_biosUrl?: string;
  /** Game parent folder for linking similar games */
  EJS_gameParentUrl?: string;
  /** Game ID for save state organization */
  EJS_gameID?: string;

  // Display Options
  /** UI language */
  EJS_language?: EmulatorLanguage;
  /** Color scheme */
  EJS_color?: string;
  /** Default shader/filter */
  EJS_defaultShader?: EmulatorShader;
  /** Background color (hex or CSS color) */
  EJS_backgroundColor?: string;
  /** Start in fullscreen mode */
  EJS_fullscreenOnLoad?: boolean;
  /** Scale multiplier for the display */
  EJS_scale?: number;

  // Audio Options
  /** Default volume (0-1) */
  EJS_volume?: number;
  /** Start muted */
  EJS_startMuted?: boolean;

  // Control Options
  /** Show virtual gamepad on touch devices */
  EJS_VirtualGamepadSettings?: {
    /** Enable virtual gamepad */
    enabled?: boolean;
    /** Opacity of the gamepad (0-1) */
    opacity?: number;
    /** Scale of the gamepad */
    scale?: number;
    /** Left or right handed mode */
    leftHanded?: boolean;
  };
  /** Default controller mappings */
  EJS_defaultControls?: ControlMapping;

  // Feature Toggles
  /** Disable save states feature */
  EJS_noSaveStates?: boolean;
  /** Disable cheats feature */
  EJS_noCheats?: boolean;
  /** Disable netplay feature */
  EJS_noNetplay?: boolean;
  /** Disable context menu */
  EJS_noContextMenu?: boolean;
  /** Disable auto-load of last save state */
  EJS_noAutoLoad?: boolean;
  /** Enable debug mode */
  EJS_DEBUG_XX?: boolean;

  // Performance Options
  /** Thread count for multi-threaded cores */
  EJS_threads?: number;
  /** Fast-forward speed ratio */
  EJS_fastForwardRatio?: FastForwardRatio;
  /** Enable rewind feature */
  EJS_rewind?: boolean;
  /** Rewind granularity in frames */
  EJS_rewindGranularity?: RewindGranularity;
  /** Slow motion ratio (0.1-0.9) */
  EJS_slowMotionRatio?: number;

  // Callbacks
  /** Called when emulator is ready */
  EJS_onGameStart?: () => void;
  /** Called when save state is created */
  EJS_onSaveState?: (state: ArrayBuffer) => void;
  /** Called when save state is loaded */
  EJS_onLoadState?: () => void;
  /** Called when game is paused */
  EJS_onPause?: () => void;
  /** Called when game is resumed */
  EJS_onResume?: () => void;
}

/**
 * Input button names for control mapping
 */
export type InputButton =
  | 'a'
  | 'b'
  | 'x'
  | 'y'
  | 'l'
  | 'r'
  | 'l2'
  | 'r2'
  | 'l3'
  | 'r3'
  | 'start'
  | 'select'
  | 'up'
  | 'down'
  | 'left'
  | 'right';

/**
 * Keyboard key mapping value
 */
export interface KeyboardMapping {
  /** Keyboard key code */
  key: string;
  /** Display name for the key */
  label?: string;
}

/**
 * Gamepad button mapping value
 */
export interface GamepadMapping {
  /** Gamepad button index */
  button: number;
  /** Axis index for analog sticks */
  axis?: number;
  /** Axis direction (-1 or 1) */
  axisDirection?: -1 | 1;
}

/**
 * Control mapping for a single player
 */
export type ControlMapping = {
  [K in InputButton]?: KeyboardMapping | GamepadMapping;
};

/**
 * Multi-player control mappings
 */
export interface PlayerControlMappings {
  player1: ControlMapping;
  player2?: ControlMapping;
  player3?: ControlMapping;
  player4?: ControlMapping;
}

/**
 * Current state of the emulator
 */
export interface EmulatorState {
  /** Whether a game is currently loaded and playing */
  isPlaying: boolean;
  /** Whether the emulator is loading a game or core */
  isLoading: boolean;
  /** Loading progress percentage (0-100) */
  loadProgress: number;
  /** Loading stage description */
  loadingStage?: 'core' | 'rom' | 'bios' | 'state';
  /** Current volume level (0-1) */
  volume: number;
  /** Whether audio is muted */
  isMuted: boolean;
  /** Whether in fullscreen mode */
  isFullscreen: boolean;
  /** Whether game is paused */
  isPaused: boolean;
  /** Currently active shader */
  currentShader: EmulatorShader;
  /** Current fast-forward status */
  isFastForward: boolean;
  /** Current rewind status */
  isRewinding: boolean;
  /** Error message if emulation failed */
  error?: string;
}

/**
 * Default emulator state
 */
export const DEFAULT_EMULATOR_STATE: EmulatorState = {
  isPlaying: false,
  isLoading: false,
  loadProgress: 0,
  volume: 0.7,
  isMuted: false,
  isFullscreen: false,
  isPaused: false,
  currentShader: '',
  isFastForward: false,
  isRewinding: false,
} as const;

/**
 * Save state slot configuration
 */
export interface SaveStateSlot {
  /** Slot number (0-9 typically) */
  slot: number;
  /** Whether this slot has saved data */
  hasData: boolean;
  /** Timestamp when the state was saved */
  timestamp?: Date;
  /** Screenshot thumbnail as base64 or blob URL */
  screenshot?: string;
  /** Display label for the slot */
  label?: string;
  /** Size of the save state in bytes */
  sizeBytes?: number;
}

/**
 * Collection of save state slots for a game
 */
export interface GameSaveStates {
  /** Game ID these states belong to */
  gameId: string;
  /** Console type for compatibility */
  console: ConsoleType;
  /** Array of save state slots */
  slots: SaveStateSlot[];
  /** Auto-save slot (separate from manual slots) */
  autoSave?: SaveStateSlot;
  /** Quick save slot */
  quickSave?: SaveStateSlot;
}

/**
 * Maximum number of save state slots per game
 */
export const MAX_SAVE_SLOTS = 10;

/**
 * Create initial save state slots configuration
 */
export function createEmptySaveSlots(): SaveStateSlot[] {
  return Array.from({ length: MAX_SAVE_SLOTS }, (_, index) => ({
    slot: index,
    hasData: false,
  }));
}

/**
 * Emulator action types for state management
 */
export type EmulatorAction =
  | { type: 'START_LOADING'; stage: EmulatorState['loadingStage'] }
  | { type: 'UPDATE_PROGRESS'; progress: number }
  | { type: 'LOADED' }
  | { type: 'ERROR'; error: string }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'SET_SHADER'; shader: EmulatorShader }
  | { type: 'TOGGLE_FAST_FORWARD' }
  | { type: 'START_REWIND' }
  | { type: 'STOP_REWIND' }
  | { type: 'RESET' };
