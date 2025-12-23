/**
 * SettingsPage Component
 *
 * Settings page with sections for audio, display, controls, and data management.
 * Provides user preferences configuration with persistence via IndexedDB.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services/database';
import { settingsService } from '@/services/storage';
import { useGameStore } from '@/stores';
import { useToast } from '@/hooks/useToast';
import { Button, Modal } from '@/components/common';
import styles from './SettingsPage.module.css';

/**
 * SettingsPage - User preferences and data management
 */
export function SettingsPage() {
  const { success, error: showError } = useToast();
  const viewMode = useGameStore((state) => state.viewMode);
  const setViewMode = useGameStore((state) => state.setViewMode);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  // Settings from IndexedDB
  const settings = useLiveQuery(() => db.getSettings(), [], null);

  // Local state for immediate UI updates - initialize from settings if available
  const [volume, setVolume] = useState(() => settings?.volume ?? 0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showVirtualGamepad, setShowVirtualGamepad] = useState(() => settings?.showVirtualGamepad ?? true);

  // Track previous settings to detect changes from database
  const prevSettingsRef = useRef(settings);

  // Sync local state with database only when settings change externally
  useEffect(() => {
    if (settings && prevSettingsRef.current !== settings) {
      prevSettingsRef.current = settings;
      // Use setTimeout to avoid sync setState in effect
      setTimeout(() => {
        setVolume(settings.volume);
        setShowVirtualGamepad(settings.showVirtualGamepad);
      }, 0);
    }
  }, [settings]);

  // Update document title
  useEffect(() => {
    document.title = 'Settings - RetroGaming';
    return () => {
      document.title = 'RetroGaming';
    };
  }, []);

  // Handle volume change
  const handleVolumeChange = useCallback(
    async (newVolume: number) => {
      setVolume(newVolume);
      try {
        await settingsService.setVolume(newVolume);
      } catch {
        showError('Failed to save volume setting');
      }
    },
    [showError]
  );

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Handle view mode change
  const handleViewModeChange = useCallback(
    (mode: 'grid' | 'list') => {
      setViewMode(mode);
      success(`Default view set to ${mode}`);
    },
    [setViewMode, success]
  );

  // Handle virtual gamepad toggle
  const handleVirtualGamepadToggle = useCallback(async () => {
    const newValue = !showVirtualGamepad;
    setShowVirtualGamepad(newValue);
    try {
      await settingsService.setShowVirtualGamepad(newValue);
      success(newValue ? 'Virtual gamepad enabled' : 'Virtual gamepad disabled');
    } catch {
      showError('Failed to save gamepad setting');
      setShowVirtualGamepad(!newValue);
    }
  }, [showVirtualGamepad, success, showError]);

  // Handle reset controls
  const handleResetControls = useCallback(async () => {
    try {
      await settingsService.setControlMappings({});
      success('Controls reset to defaults');
    } catch {
      showError('Failed to reset controls');
    }
  }, [success, showError]);

  // Open confirmation dialog
  const openConfirmDialog = useCallback(
    (title: string, message: string, action: () => Promise<void>) => {
      setConfirmDialog({
        isOpen: true,
        title,
        message,
        action,
      });
    },
    []
  );

  // Close confirmation dialog
  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Execute confirmed action
  const executeConfirmedAction = useCallback(async () => {
    try {
      await confirmDialog.action();
      closeConfirmDialog();
    } catch {
      showError('Action failed');
    }
  }, [confirmDialog, closeConfirmDialog, showError]);

  // Clear play history
  const handleClearHistory = useCallback(() => {
    openConfirmDialog(
      'Clear Play History',
      'This will permanently delete all your play history and recently played data. This cannot be undone.',
      async () => {
        await db.playSessions.clear();
        success('Play history cleared');
      }
    );
  }, [openConfirmDialog, success]);

  // Clear all save states
  const handleClearSaveStates = useCallback(() => {
    openConfirmDialog(
      'Clear All Save States',
      'This will permanently delete ALL save states for ALL games. This cannot be undone.',
      async () => {
        await db.saveStates.clear();
        success('All save states cleared');
      }
    );
  }, [openConfirmDialog, success]);

  // Clear favorites
  const handleClearFavorites = useCallback(() => {
    openConfirmDialog(
      'Clear Favorites',
      'This will remove all games from your favorites list. This cannot be undone.',
      async () => {
        await db.favorites.clear();
        success('Favorites cleared');
      }
    );
  }, [openConfirmDialog, success]);

  // Export settings
  const handleExportSettings = useCallback(async () => {
    try {
      const json = await settingsService.exportSettings();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'retrogaming-settings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Settings exported');
    } catch {
      showError('Failed to export settings');
    }
  }, [success, showError]);

  // Import settings
  const handleImportSettings = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const json = await file.text();
        await settingsService.importSettings(json);
        success('Settings imported successfully');
      } catch {
        showError('Failed to import settings: Invalid file format');
      }
    };
    input.click();
  }, [success, showError]);

  return (
    <div className={styles.settings}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Customize your RetroGaming experience</p>
      </header>

      <div className={styles.sections}>
        {/* Audio Settings */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Audio Settings</h2>
          <div className={styles.sectionContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <label htmlFor="volume" className={styles.settingLabel}>
                  Default Volume
                </label>
                <span className={styles.settingDescription}>
                  Set the default volume level for games
                </span>
              </div>
              <div className={styles.settingControl}>
                <input
                  id="volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{Math.round(volume * 100)}%</span>
              </div>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Mute Audio</span>
                <span className={styles.settingDescription}>
                  Mute all game audio by default
                </span>
              </div>
              <div className={styles.settingControl}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isMuted}
                  className={`${styles.toggle} ${isMuted ? styles.toggleActive : ''}`}
                  onClick={handleMuteToggle}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Display Settings */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Display Settings</h2>
          <div className={styles.sectionContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Default View Mode</span>
                <span className={styles.settingDescription}>
                  Choose how games are displayed in the library
                </span>
              </div>
              <div className={styles.settingControl}>
                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    className={`${styles.groupButton} ${
                      viewMode === 'grid' ? styles.groupButtonActive : ''
                    }`}
                    onClick={() => handleViewModeChange('grid')}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    className={`${styles.groupButton} ${
                      viewMode === 'list' ? styles.groupButtonActive : ''
                    }`}
                    onClick={() => handleViewModeChange('list')}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Virtual Gamepad on Mobile</span>
                <span className={styles.settingDescription}>
                  Show on-screen gamepad controls on mobile devices
                </span>
              </div>
              <div className={styles.settingControl}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showVirtualGamepad}
                  className={`${styles.toggle} ${showVirtualGamepad ? styles.toggleActive : ''}`}
                  onClick={handleVirtualGamepadToggle}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Controls Settings */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Controls Settings</h2>
          <div className={styles.sectionContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Keyboard Mapping</span>
                <span className={styles.settingDescription}>
                  Default keyboard controls are configured per console
                </span>
              </div>
              <div className={styles.settingControl}>
                <span className={styles.readOnlyBadge}>Read Only</span>
              </div>
            </div>

            <div className={styles.keyboardInfo}>
              <h3 className={styles.keyboardTitle}>Default Controls</h3>
              <div className={styles.keyboardGrid}>
                <div className={styles.keyItem}>
                  <kbd>Arrow Keys</kbd>
                  <span>D-Pad</span>
                </div>
                <div className={styles.keyItem}>
                  <kbd>Z / X</kbd>
                  <span>A / B Buttons</span>
                </div>
                <div className={styles.keyItem}>
                  <kbd>A / S</kbd>
                  <span>L / R Triggers</span>
                </div>
                <div className={styles.keyItem}>
                  <kbd>Enter</kbd>
                  <span>Start</span>
                </div>
                <div className={styles.keyItem}>
                  <kbd>Shift</kbd>
                  <span>Select</span>
                </div>
                <div className={styles.keyItem}>
                  <kbd>F5 / F8</kbd>
                  <span>Quick Save / Load</span>
                </div>
              </div>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Reset Controls</span>
                <span className={styles.settingDescription}>
                  Reset all control mappings to defaults
                </span>
              </div>
              <div className={styles.settingControl}>
                <Button variant="secondary" size="sm" onClick={handleResetControls}>
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Data Management</h2>
          <div className={styles.sectionContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Clear Play History</span>
                <span className={styles.settingDescription}>
                  Remove all play session records and recently played data
                </span>
              </div>
              <div className={styles.settingControl}>
                <Button variant="danger" size="sm" onClick={handleClearHistory}>
                  Clear History
                </Button>
              </div>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Clear All Save States</span>
                <span className={styles.settingDescription}>
                  Delete all save states for all games (irreversible)
                </span>
              </div>
              <div className={styles.settingControl}>
                <Button variant="danger" size="sm" onClick={handleClearSaveStates}>
                  Clear Saves
                </Button>
              </div>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Clear Favorites</span>
                <span className={styles.settingDescription}>
                  Remove all games from your favorites list
                </span>
              </div>
              <div className={styles.settingControl}>
                <Button variant="danger" size="sm" onClick={handleClearFavorites}>
                  Clear Favorites
                </Button>
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Export Settings</span>
                <span className={styles.settingDescription}>
                  Download your settings as a JSON file
                </span>
              </div>
              <div className={styles.settingControl}>
                <Button variant="secondary" size="sm" onClick={handleExportSettings}>
                  Export
                </Button>
              </div>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Import Settings</span>
                <span className={styles.settingDescription}>
                  Restore settings from a previously exported file
                </span>
              </div>
              <div className={styles.settingControl}>
                <Button variant="secondary" size="sm" onClick={handleImportSettings}>
                  Import
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Confirmation Dialog */}
      <Modal
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        title={confirmDialog.title}
        size="sm"
      >
        <div className={styles.confirmContent}>
          <p className={styles.confirmMessage}>{confirmDialog.message}</p>
          <div className={styles.confirmActions}>
            <Button variant="ghost" onClick={closeConfirmDialog}>
              Cancel
            </Button>
            <Button variant="danger" onClick={executeConfirmedAction}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SettingsPage;
