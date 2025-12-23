/**
 * Settings Service
 * Manages user settings and preferences using Dexie IndexedDB.
 *
 * @module services/storage/settingsService
 */

import { db } from '../database/db';
import { DEFAULT_USER_SETTINGS } from '../database/models';
import type { UserSettings } from '../database/models';

/**
 * User settings management service
 */
export const settingsService = {
  /**
   * Gets all user settings.
   * Returns default settings if none have been saved.
   *
   * @returns The user settings object
   */
  async getSettings(): Promise<UserSettings> {
    try {
      return await db.getSettings();
    } catch (error) {
      console.error('Error getting settings:', error);
      return { ...DEFAULT_USER_SETTINGS, lastUpdated: new Date() };
    }
  },

  /**
   * Updates user settings with partial values.
   * Only the provided fields will be updated.
   *
   * @param settings - Partial settings object with values to update
   */
  async updateSettings(settings: Partial<Omit<UserSettings, 'id' | 'lastUpdated'>>): Promise<void> {
    try {
      await db.updateSettings(settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Resets all settings to their default values.
   */
  async resetSettings(): Promise<void> {
    try {
      await db.resetSettings();
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw new Error(`Failed to reset settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Gets a specific setting value.
   *
   * @param key - The setting key to retrieve
   * @returns The value of the specified setting
   */
  async getSetting<K extends keyof UserSettings>(key: K): Promise<UserSettings[K]> {
    try {
      const settings = await db.getSettings();
      return settings[key];
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      const defaults = { ...DEFAULT_USER_SETTINGS, lastUpdated: new Date() };
      return defaults[key];
    }
  },

  /**
   * Sets a specific setting value.
   *
   * @param key - The setting key to update
   * @param value - The new value for the setting
   */
  async setSetting<K extends keyof Omit<UserSettings, 'id' | 'lastUpdated'>>(
    key: K,
    value: UserSettings[K]
  ): Promise<void> {
    try {
      await db.updateSettings({ [key]: value });
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      throw new Error(`Failed to set ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Gets the current volume level.
   *
   * @returns Volume level (0.0 to 1.0)
   */
  async getVolume(): Promise<number> {
    return this.getSetting('volume');
  },

  /**
   * Sets the volume level.
   *
   * @param volume - Volume level (0.0 to 1.0)
   */
  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    await this.updateSettings({ volume: clampedVolume });
  },

  /**
   * Gets the default save slot.
   *
   * @returns Default save slot number (0-9)
   */
  async getDefaultSaveSlot(): Promise<number> {
    return this.getSetting('defaultSaveSlot');
  },

  /**
   * Sets the default save slot.
   *
   * @param slot - Slot number (0-9)
   */
  async setDefaultSaveSlot(slot: number): Promise<void> {
    const clampedSlot = Math.max(0, Math.min(9, Math.floor(slot)));
    await this.updateSettings({ defaultSaveSlot: clampedSlot });
  },

  /**
   * Gets the virtual gamepad visibility setting.
   *
   * @returns True if virtual gamepad should be shown
   */
  async getShowVirtualGamepad(): Promise<boolean> {
    return this.getSetting('showVirtualGamepad');
  },

  /**
   * Sets the virtual gamepad visibility.
   *
   * @param show - Whether to show the virtual gamepad
   */
  async setShowVirtualGamepad(show: boolean): Promise<void> {
    await this.updateSettings({ showVirtualGamepad: show });
  },

  /**
   * Gets the control mappings.
   *
   * @returns Control mappings object
   */
  async getControlMappings(): Promise<Record<string, unknown>> {
    return this.getSetting('controlMappings');
  },

  /**
   * Updates control mappings.
   *
   * @param mappings - New control mappings
   */
  async setControlMappings(mappings: Record<string, unknown>): Promise<void> {
    await this.updateSettings({ controlMappings: mappings });
  },

  /**
   * Gets the default settings object.
   * Useful for comparison or reset purposes.
   *
   * @returns The default settings object
   */
  getDefaultSettings(): UserSettings {
    return { ...DEFAULT_USER_SETTINGS, lastUpdated: new Date() };
  },

  /**
   * Checks if settings have been modified from defaults.
   *
   * @returns True if any settings differ from defaults
   */
  async hasCustomSettings(): Promise<boolean> {
    try {
      const current = await db.getSettings();
      const defaults = DEFAULT_USER_SETTINGS;

      return (
        current.volume !== defaults.volume ||
        current.defaultSaveSlot !== defaults.defaultSaveSlot ||
        current.showVirtualGamepad !== defaults.showVirtualGamepad ||
        JSON.stringify(current.controlMappings) !== JSON.stringify(defaults.controlMappings)
      );
    } catch {
      return false;
    }
  },

  /**
   * Exports settings as a JSON string for backup.
   *
   * @returns JSON string of current settings
   */
  async exportSettings(): Promise<string> {
    try {
      const settings = await db.getSettings();
      return JSON.stringify(settings, null, 2);
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw new Error('Failed to export settings');
    }
  },

  /**
   * Imports settings from a JSON string.
   *
   * @param json - JSON string containing settings
   */
  async importSettings(json: string): Promise<void> {
    try {
      const parsed = JSON.parse(json) as Partial<UserSettings>;

      // Validate and sanitize imported settings
      const updates: Partial<Omit<UserSettings, 'id' | 'lastUpdated'>> = {};

      if (typeof parsed.volume === 'number') {
        updates.volume = Math.max(0, Math.min(1, parsed.volume));
      }

      if (typeof parsed.defaultSaveSlot === 'number') {
        updates.defaultSaveSlot = Math.max(0, Math.min(9, Math.floor(parsed.defaultSaveSlot)));
      }

      if (typeof parsed.showVirtualGamepad === 'boolean') {
        updates.showVirtualGamepad = parsed.showVirtualGamepad;
      }

      if (typeof parsed.controlMappings === 'object' && parsed.controlMappings !== null) {
        updates.controlMappings = parsed.controlMappings;
      }

      await db.updateSettings(updates);
    } catch (error) {
      console.error('Error importing settings:', error);
      throw new Error('Failed to import settings: Invalid format');
    }
  },
};
