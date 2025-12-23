/**
 * Console Types for Retro Gaming Platform
 * Defines supported gaming consoles and their configurations for EmulatorJS
 */

/**
 * Supported console types that can be emulated
 */
export type ConsoleType = 'ps1' | 'nes' | 'snes' | 'n64' | 'gb' | 'gba';

/**
 * File extensions commonly associated with ROMs for each console
 */
export type RomExtension =
  | '.bin'
  | '.cue'
  | '.iso'
  | '.img'
  | '.pbp'
  | '.chd'
  | '.nes'
  | '.unf'
  | '.fds'
  | '.sfc'
  | '.smc'
  | '.z64'
  | '.n64'
  | '.v64'
  | '.gb'
  | '.gbc'
  | '.gba';

/**
 * BIOS file configuration for consoles that require it
 */
export interface BiosFile {
  /** Name of the BIOS file */
  readonly name: string;
  /** MD5 hash for verification (optional) */
  readonly md5?: string;
  /** Description of the BIOS file */
  readonly description?: string;
  /** Whether this BIOS file is required or optional */
  readonly required: boolean;
}

/**
 * Configuration for a gaming console
 * Contains all necessary information for EmulatorJS to run games
 */
export interface ConsoleConfiguration {
  /** Display name of the console */
  readonly name: string;
  /** EmulatorJS core identifier */
  readonly core: string;
  /** Supported ROM file extensions */
  readonly extensions: readonly RomExtension[];
  /** Whether this console requires BIOS files to function */
  readonly requiresBios: boolean;
  /** BIOS files required by this console (if any) */
  readonly biosFiles?: readonly BiosFile[];
  /** Path to BIOS directory relative to public folder */
  readonly biosPath?: string;
  /** Icon identifier for UI display */
  readonly icon: string;
  /** Brand color for UI theming (hex format) */
  readonly color: string;
  /** Short description of the console */
  readonly description?: string;
  /** Year the console was released */
  readonly releaseYear?: number;
  /** Manufacturer of the console */
  readonly manufacturer?: string;
}

/**
 * Record type mapping console types to their configurations
 */
export type ConsoleConfigMap = {
  readonly [K in ConsoleType]: ConsoleConfiguration;
};

/**
 * Complete configuration for all supported gaming consoles
 * Uses const assertion for type safety and immutability
 */
export const CONSOLE_CONFIG = {
  ps1: {
    name: 'PlayStation',
    core: 'psx',
    extensions: ['.bin', '.cue', '.iso', '.img', '.pbp', '.chd'],
    requiresBios: true, // Use real BIOS for better compatibility
    biosFiles: [
      {
        name: 'scph5501.bin',
        md5: '490f666e1afb15b7362b406ed1cea246',
        description: 'PlayStation BIOS (US)',
        required: true,
      },
      {
        name: 'scph5500.bin',
        md5: '8dd7d5296a650fac7319bce665a6a53c',
        description: 'PlayStation BIOS (JP)',
        required: false,
      },
      {
        name: 'scph5502.bin',
        md5: '32736f17079d0b2b7024407c39bd3050',
        description: 'PlayStation BIOS (EU)',
        required: false,
      },
    ],
    biosPath: 'https://cdn.komplexaci.cz/roms/bios/ps1',
    icon: 'playstation',
    color: '#003087',
    description: 'Sony PlayStation (1994)',
    releaseYear: 1994,
    manufacturer: 'Sony',
  },
  nes: {
    name: 'Nintendo Entertainment System',
    core: 'nes',
    extensions: ['.nes', '.unf', '.fds'],
    requiresBios: false,
    icon: 'nintendo',
    color: '#E60012',
    description: 'Nintendo Entertainment System (1983)',
    releaseYear: 1983,
    manufacturer: 'Nintendo',
  },
  snes: {
    name: 'Super Nintendo',
    core: 'snes',
    extensions: ['.sfc', '.smc'],
    requiresBios: false,
    icon: 'snes',
    color: '#7B5AA6',
    description: 'Super Nintendo Entertainment System (1990)',
    releaseYear: 1990,
    manufacturer: 'Nintendo',
  },
  n64: {
    name: 'Nintendo 64',
    core: 'n64',
    extensions: ['.z64', '.n64', '.v64'],
    requiresBios: false,
    icon: 'n64',
    color: '#009E60',
    description: 'Nintendo 64 (1996)',
    releaseYear: 1996,
    manufacturer: 'Nintendo',
  },
  gb: {
    name: 'Game Boy',
    core: 'gb',
    extensions: ['.gb', '.gbc'],
    requiresBios: false,
    icon: 'gameboy',
    color: '#8B956D',
    description: 'Nintendo Game Boy / Game Boy Color (1989)',
    releaseYear: 1989,
    manufacturer: 'Nintendo',
  },
  gba: {
    name: 'Game Boy Advance',
    core: 'gba',
    extensions: ['.gba'],
    requiresBios: false,
    biosFiles: [
      {
        name: 'gba_bios.bin',
        md5: 'a860e8c0b6d573d191e4ec7db1b1e4f6',
        description: 'GBA BIOS (optional but recommended)',
        required: false,
      },
    ],
    biosPath: '/bios/gba',
    icon: 'gba',
    color: '#5A2D82',
    description: 'Nintendo Game Boy Advance (2001)',
    releaseYear: 2001,
    manufacturer: 'Nintendo',
  },
} as const satisfies ConsoleConfigMap;

/**
 * Array of all supported console types
 */
export const SUPPORTED_CONSOLES = Object.keys(CONSOLE_CONFIG) as ConsoleType[];

/**
 * Type guard to check if a string is a valid ConsoleType
 */
export function isConsoleType(value: string): value is ConsoleType {
  return SUPPORTED_CONSOLES.includes(value as ConsoleType);
}

/**
 * Get console configuration by type with type safety
 */
export function getConsoleConfig(consoleType: ConsoleType): ConsoleConfiguration {
  return CONSOLE_CONFIG[consoleType];
}

/**
 * Get all supported file extensions across all consoles
 */
export function getAllSupportedExtensions(): RomExtension[] {
  const extensions = new Set<RomExtension>();
  for (const config of Object.values(CONSOLE_CONFIG)) {
    for (const ext of config.extensions) {
      extensions.add(ext);
    }
  }
  return Array.from(extensions);
}
