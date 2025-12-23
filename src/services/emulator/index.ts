/**
 * Emulator Services Index
 * Central export point for all emulator-related services and configurations.
 *
 * @module services/emulator
 */

export {
  CDN_BASE_URL,
  EMULATORJS_DATA_PATH,
  CONSOLE_CONFIG,
  getConsoleConfig,
  getRomUrl,
  getBiosUrl,
  getEmulatorDataPath,
  getCoreName,
  requiresBios,
  getRequiredBiosFiles,
  getAllBiosFiles,
  isExtensionSupported,
  getSupportedExtensions,
  getConsoleColor,
  getConsoleIcon,
  getConsoleName,
  getAllConsoleTypes,
  isValidConsoleType,
} from './coreConfig';
