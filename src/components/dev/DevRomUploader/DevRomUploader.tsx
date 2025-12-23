/**
 * DevRomUploader Component
 *
 * Development-only component for testing ROMs without setting up a server.
 * Allows uploading a ROM file directly and launching the emulator.
 */

import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores';
import type { ConsoleType, Game } from '@/types';
import { CONSOLE_CONFIG } from '@/types';

// Map file extensions to console types
const EXTENSION_TO_CONSOLE: Record<string, ConsoleType> = {
  '.nes': 'nes',
  '.unf': 'nes',
  '.fds': 'nes',
  '.sfc': 'snes',
  '.smc': 'snes',
  '.z64': 'n64',
  '.n64': 'n64',
  '.v64': 'n64',
  '.gb': 'gb',
  '.gbc': 'gb',
  '.gba': 'gba',
  '.bin': 'ps1',
  '.cue': 'ps1',
  '.iso': 'ps1',
  '.img': 'ps1',
  '.pbp': 'ps1',
  '.chd': 'ps1',
};

interface DevRomUploaderProps {
  onRomLoaded?: (game: Game) => void;
}

export function DevRomUploader({ onRomLoaded }: DevRomUploaderProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedConsole, setSelectedConsole] = useState<ConsoleType | ''>('');
  const [error, setError] = useState<string | null>(null);
  const setGames = useGameStore((state) => state.setGames);
  const games = useGameStore((state) => state.games);

  // Detect console from file extension
  const detectConsole = useCallback((filename: string): ConsoleType | null => {
    const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (ext && ext in EXTENSION_TO_CONSOLE) {
      return EXTENSION_TO_CONSOLE[ext];
    }
    return null;
  }, []);

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);

    // Auto-detect console
    const detected = detectConsole(file.name);
    if (detected) {
      setSelectedConsole(detected);
    }
  }, [detectConsole]);

  // Handle console selection
  const handleConsoleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedConsole(e.target.value as ConsoleType);
  }, []);

  // Load the ROM
  const handleLoadRom = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select a ROM file');
      return;
    }

    if (!selectedConsole) {
      setError('Please select a console type');
      return;
    }

    try {
      // Create a blob URL for the file
      const blobUrl = URL.createObjectURL(selectedFile);

      // Create a temporary game entry
      const tempGame: Game = {
        id: `dev-${Date.now()}`,
        title: selectedFile.name.replace(/\.[^.]+$/, ''),
        console: selectedConsole,
        romPath: blobUrl,
        description: 'Development test ROM',
        addedAt: new Date().toISOString(),
      };

      // Add to games list temporarily
      setGames([tempGame, ...games]);

      // Notify parent if callback provided
      onRomLoaded?.(tempGame);

      // Navigate to play page
      navigate(`/play/${tempGame.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ROM');
    }
  }, [selectedFile, selectedConsole, games, setGames, navigate, onRomLoaded]);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'rgba(0, 255, 255, 0.1)',
      borderRadius: '8px',
      border: '1px solid rgba(0, 255, 255, 0.3)',
      marginBottom: '20px',
    }}>
      <h3 style={{
        margin: '0 0 15px 0',
        color: '#00ffff',
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '14px',
      }}>
        🛠️ Dev ROM Tester
      </h3>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".nes,.unf,.fds,.sfc,.smc,.z64,.n64,.v64,.gb,.gbc,.gba,.bin,.cue,.iso,.img,.pbp,.chd"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(0, 255, 255, 0.2)',
            border: '1px solid #00ffff',
            borderRadius: '4px',
            color: '#00ffff',
            cursor: 'pointer',
            fontFamily: 'Rajdhani, sans-serif',
          }}
        >
          {selectedFile ? selectedFile.name : 'Select ROM File'}
        </button>

        {/* Console Selector */}
        <select
          value={selectedConsole}
          onChange={handleConsoleChange}
          style={{
            padding: '8px 12px',
            backgroundColor: '#1a1a2e',
            border: '1px solid #00ffff',
            borderRadius: '4px',
            color: '#ffffff',
            fontFamily: 'Rajdhani, sans-serif',
          }}
        >
          <option value="">Select Console</option>
          {Object.entries(CONSOLE_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.name}
            </option>
          ))}
        </select>

        {/* Load Button */}
        <button
          onClick={handleLoadRom}
          disabled={!selectedFile || !selectedConsole}
          style={{
            padding: '8px 20px',
            backgroundColor: selectedFile && selectedConsole ? '#00ffff' : 'rgba(0, 255, 255, 0.3)',
            border: 'none',
            borderRadius: '4px',
            color: '#0a0a0f',
            cursor: selectedFile && selectedConsole ? 'pointer' : 'not-allowed',
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 'bold',
          }}
        >
          Load & Play
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <p style={{ color: '#ff0055', marginTop: '10px', marginBottom: 0 }}>
          {error}
        </p>
      )}

      {/* Help Text */}
      <p style={{
        color: '#6b6b6b',
        fontSize: '12px',
        marginTop: '10px',
        marginBottom: 0,
      }}>
        Supported: NES, SNES, N64, Game Boy, GBA, PS1
      </p>
    </div>
  );
}

export default DevRomUploader;
