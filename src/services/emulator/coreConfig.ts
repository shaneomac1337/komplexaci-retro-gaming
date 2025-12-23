/**
 * Emulator Core Configuration
 * Defines EmulatorJS core configurations and helper functions.
 *
 * @module services/emulator/coreConfig
 */

import type { ConsoleType, ConsoleConfiguration, BiosFile } from '@/types';

/** Base URL for CDN assets */
export const CDN_BASE_URL = 'https://cdn.komplexaci.cz';

/** Path to EmulatorJS data files */
export const EMULATORJS_DATA_PATH = '/data/';

/**
 * Console configuration with EmulatorJS core mappings
 * Each console has specific core and BIOS requirements
 */
export const CONSOLE_CONFIG: Record<ConsoleType, ConsoleConfiguration> = {
  ps1: {
    name: 'PlayStation 1',
    core: 'pcsx_rearmed',
    extensions: ['.bin', '.cue', '.iso', '.pbp', '.chd'],
    requiresBios: true,
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
    biosPath: 'bios/ps1/',
    icon: 'ps1.svg',
    color: '#003087',
    description: 'Sony PlayStation (1994)',
    releaseYear: 1994,
    manufacturer: 'Sony',
  },
  nes: {
    name: 'NES / Famicom',
    core: 'fceumm',
    extensions: ['.nes', '.fds'],
    requiresBios: false,
    icon: 'nes.svg',
    color: '#E60012',
    description: 'Nintendo Entertainment System (1983)',
    releaseYear: 1983,
    manufacturer: 'Nintendo',
  },
  snes: {
    name: 'Super Nintendo',
    core: 'snes9x',
    extensions: ['.sfc', '.smc'],
    requiresBios: false,
    icon: 'snes.svg',
    color: '#7B5AA6',
    description: 'Super Nintendo Entertainment System (1990)',
    releaseYear: 1990,
    manufacturer: 'Nintendo',
  },
  n64: {
    name: 'Nintendo 64',
    core: 'mupen64plus_next',
    extensions: ['.z64', '.n64', '.v64'],
    requiresBios: false,
    icon: 'n64.svg',
    color: '#009E60',
    description: 'Nintendo 64 (1996)',
    releaseYear: 1996,
    manufacturer: 'Nintendo',
  },
  gb: {
    name: 'Game Boy / Color',
    core: 'gambatte',
    extensions: ['.gb', '.gbc'],
    requiresBios: false,
    icon: 'gb.svg',
    color: '#8B956D',
    description: 'Nintendo Game Boy / Game Boy Color (1989)',
    releaseYear: 1989,
    manufacturer: 'Nintendo',
  },
  gba: {
    name: 'Game Boy Advance',
    core: 'mgba',
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
    biosPath: 'bios/gba/',
    icon: 'gba.svg',
    color: '#5A2D82',
    description: 'Nintendo Game Boy Advance (2001)',
    releaseYear: 2001,
    manufacturer: 'Nintendo',
  },
};

/**
 * Gets the console configuration for a specific console type.
 *
 * @param console - The console type
 * @returns The console configuration
 * @throws Error if console type is not supported
 */
export function getConsoleConfig(console: ConsoleType): ConsoleConfiguration {
  const config = CONSOLE_CONFIG[console];
  if (!config) {
    throw new Error(`Unsupported console type: ${console}`);
  }
  return config;
}

/**
 * Builds the full URL for a ROM file.
 *
 * @param romPath - The relative path to the ROM file
 * @returns The full URL to the ROM file
 */
export function getRomUrl(romPath: string): string {
  // Remove leading slash if present
  const cleanPath = romPath.startsWith('/') ? romPath.slice(1) : romPath;
  return `${CDN_BASE_URL}/roms/${cleanPath}`;
}

/**
 * Builds the full URL for a BIOS file.
 *
 * @param console - The console type
 * @param biosFile - The BIOS file name
 * @returns The full URL to the BIOS file
 */
export function getBiosUrl(console: ConsoleType, biosFile: string): string {
  const config = getConsoleConfig(console);
  const biosPath = config.biosPath ?? `bios/${console}/`;
  // Remove leading slash if present
  const cleanPath = biosPath.startsWith('/') ? biosPath.slice(1) : biosPath;
  return `${CDN_BASE_URL}/${cleanPath}${biosFile}`;
}

/**
 * Gets the EmulatorJS data path.
 *
 * @returns The path to EmulatorJS data files
 */
export function getEmulatorDataPath(): string {
  return `${CDN_BASE_URL}${EMULATORJS_DATA_PATH}`;
}

/**
 * Gets the core name for a specific console.
 *
 * @param console - The console type
 * @returns The EmulatorJS core name
 */
export function getCoreName(console: ConsoleType): string {
  return getConsoleConfig(console).core;
}

/**
 * Checks if a console requires BIOS files.
 *
 * @param console - The console type
 * @returns True if the console requires BIOS files
 */
export function requiresBios(console: ConsoleType): boolean {
  return getConsoleConfig(console).requiresBios;
}

/**
 * Gets the required BIOS files for a console.
 *
 * @param console - The console type
 * @returns Array of required BIOS files, empty if none required
 */
export function getRequiredBiosFiles(console: ConsoleType): readonly BiosFile[] {
  const config = getConsoleConfig(console);
  if (!config.biosFiles) {
    return [];
  }
  return config.biosFiles.filter((bios) => bios.required);
}

/**
 * Gets all BIOS files (required and optional) for a console.
 *
 * @param console - The console type
 * @returns Array of all BIOS files, empty if none
 */
export function getAllBiosFiles(console: ConsoleType): readonly BiosFile[] {
  return getConsoleConfig(console).biosFiles ?? [];
}

/**
 * Checks if a file extension is supported by a console.
 *
 * @param console - The console type
 * @param extension - The file extension (with or without leading dot)
 * @returns True if the extension is supported
 */
export function isExtensionSupported(console: ConsoleType, extension: string): boolean {
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  const config = getConsoleConfig(console);
  return config.extensions.includes(ext.toLowerCase() as (typeof config.extensions)[number]);
}

/**
 * Gets all supported file extensions for a console.
 *
 * @param console - The console type
 * @returns Array of supported file extensions
 */
export function getSupportedExtensions(console: ConsoleType): readonly string[] {
  return getConsoleConfig(console).extensions;
}

/**
 * Gets the console color for UI theming.
 *
 * @param console - The console type
 * @returns The hex color code
 */
export function getConsoleColor(console: ConsoleType): string {
  return getConsoleConfig(console).color;
}

/**
 * Gets the console icon identifier.
 *
 * @param console - The console type
 * @returns The icon file name
 */
export function getConsoleIcon(console: ConsoleType): string {
  return getConsoleConfig(console).icon;
}

/**
 * Gets the display name for a console.
 *
 * @param console - The console type
 * @returns The human-readable console name
 */
export function getConsoleName(console: ConsoleType): string {
  return getConsoleConfig(console).name;
}

/**
 * Gets all supported console types.
 *
 * @returns Array of all console types
 */
export function getAllConsoleTypes(): ConsoleType[] {
  return Object.keys(CONSOLE_CONFIG) as ConsoleType[];
}

/**
 * Validates if a string is a valid console type.
 *
 * @param value - The string to validate
 * @returns True if the value is a valid console type
 */
export function isValidConsoleType(value: string): value is ConsoleType {
  return Object.keys(CONSOLE_CONFIG).includes(value);
}
