// Regression tests for the games.json client-side validators.
//
// isValidGame is the trust boundary between an attacker-controlled
// games.json (gated by the R2 upload Workers' auth) and the React
// frontend. Tightened in iteration 27 to enforce URL scheme + console
// enum membership; pin those guarantees.

import { describe, it, expect } from 'vitest';
import { isValidGame, isValidGamesManifest } from './game.types';

const validGame = {
  id: 'ps1-crash-bash',
  title: 'Crash Bash',
  console: 'ps1',
  romPath: 'https://cdn.komplexaci.cz/roms/ps1/crash-bash.zip',
  coverPath: 'https://cdn.komplexaci.cz/covers/ps1/crash-bash.jpg',
};

describe('isValidGame', () => {
  it('accepts a well-formed game', () => {
    expect(isValidGame(validGame)).toBe(true);
  });

  it('accepts game without optional coverPath', () => {
    const noCover: Record<string, unknown> = { ...validGame };
    delete noCover.coverPath;
    expect(isValidGame(noCover)).toBe(true);
  });

  it('accepts blob: URLs (DevRomUploader local-file flow)', () => {
    expect(isValidGame({ ...validGame, romPath: 'blob:http://localhost:5173/abc-123' })).toBe(true);
  });

  it('accepts relative paths', () => {
    expect(isValidGame({ ...validGame, romPath: '/roms/ps1/foo.zip', coverPath: '/covers/ps1/foo.jpg' })).toBe(true);
  });

  describe('rejects unsafe URL schemes', () => {
    const unsafeRomPaths = [
      'javascript:alert(1)',
      'JAVASCRIPT:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
      'vbscript:msgbox(1)',
      '//attacker.com/x.zip',         // protocol-relative
      'C:\\windows\\system32\\evil',  // backslashes
      'ftp://attacker.com/x.zip',
      '',                              // empty
    ];
    for (const romPath of unsafeRomPaths) {
      it(`rejects romPath=${JSON.stringify(romPath)}`, () => {
        expect(isValidGame({ ...validGame, romPath })).toBe(false);
      });
    }

    it('rejects unsafe coverPath even when romPath is fine', () => {
      expect(isValidGame({ ...validGame, coverPath: 'javascript:alert(1)' })).toBe(false);
    });
  });

  describe('rejects unknown console types', () => {
    const invalid = ['xbox', 'PS1', 'ps2', 'switch', '', 'ps1; DROP TABLE games'];
    for (const console of invalid) {
      it(`rejects console=${JSON.stringify(console)}`, () => {
        expect(isValidGame({ ...validGame, console })).toBe(false);
      });
    }
  });

  describe('rejects malformed objects', () => {
    it('rejects null', () => expect(isValidGame(null)).toBe(false));
    it('rejects undefined', () => expect(isValidGame(undefined)).toBe(false));
    it('rejects primitives', () => {
      expect(isValidGame('not an object')).toBe(false);
      expect(isValidGame(42)).toBe(false);
      expect(isValidGame(true)).toBe(false);
    });
    it('rejects empty id', () => expect(isValidGame({ ...validGame, id: '' })).toBe(false));
    it('rejects empty title', () => expect(isValidGame({ ...validGame, title: '' })).toBe(false));
    it('rejects missing romPath', () => {
      const noRom: Record<string, unknown> = { ...validGame };
      delete noRom.romPath;
      expect(isValidGame(noRom)).toBe(false);
    });
  });

  it('rejects URLs longer than 2KB (cap on cover/rom path size)', () => {
    const oversize = 'https://cdn.komplexaci.cz/' + 'a'.repeat(2100);
    expect(isValidGame({ ...validGame, romPath: oversize })).toBe(false);
  });
});

describe('isValidGamesManifest', () => {
  const manifest = {
    version: '1.0.0',
    lastUpdated: '2026-05-10T00:00:00Z',
    games: [validGame],
  };

  it('accepts a well-formed manifest', () => {
    expect(isValidGamesManifest(manifest)).toBe(true);
  });

  it('rejects when any game is malformed', () => {
    const evil = { ...validGame, romPath: 'javascript:alert(1)' };
    expect(isValidGamesManifest({ ...manifest, games: [validGame, evil] })).toBe(false);
  });

  it('rejects missing version / lastUpdated', () => {
    const noVersion: Record<string, unknown> = { ...manifest };
    delete noVersion.version;
    expect(isValidGamesManifest(noVersion)).toBe(false);
  });

  it('rejects when games is not an array', () => {
    expect(isValidGamesManifest({ ...manifest, games: 'not-an-array' })).toBe(false);
  });
});
