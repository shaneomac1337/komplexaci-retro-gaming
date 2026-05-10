// Regression tests for the settings-import validator.
//
// settingsService.importSettings() is the only flow that reads attacker-
// controllable JSON (from a user-picked file) and writes it to IndexedDB.
// Iteration 30 added structural validation for `controlMappings` to defend
// against prototype-pollution-style keys and malformed shapes; pin those
// guarantees here.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database layer — we're testing the validator, not Dexie.
const updateSettingsMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../database/db', () => ({
  db: {
    getSettings: vi.fn(),
    updateSettings: (...args: unknown[]) => updateSettingsMock(...args),
  },
}));

import { settingsService } from './settingsService';

describe('settingsService.importSettings', () => {
  beforeEach(() => {
    updateSettingsMock.mockClear();
  });

  describe('valid imports persist as expected', () => {
    it('imports volume clamped to [0, 1]', async () => {
      await settingsService.importSettings(JSON.stringify({ volume: 5 }));
      expect(updateSettingsMock).toHaveBeenCalledWith({ volume: 1 });
    });

    it('imports defaultSaveSlot clamped to [0, 9] and floored', async () => {
      await settingsService.importSettings(JSON.stringify({ defaultSaveSlot: 7.9 }));
      expect(updateSettingsMock).toHaveBeenCalledWith({ defaultSaveSlot: 7 });
    });

    it('imports showVirtualGamepad bool', async () => {
      await settingsService.importSettings(JSON.stringify({ showVirtualGamepad: true }));
      expect(updateSettingsMock).toHaveBeenCalledWith({ showVirtualGamepad: true });
    });

    it('imports a valid controlMappings shape', async () => {
      const valid = {
        player1: { 'a-button': { type: 'keyboard', key: 'X' } },
        player2: { 'b-button': { type: 'keyboard', key: 'Z' } },
      };
      await settingsService.importSettings(JSON.stringify({ controlMappings: valid }));
      expect(updateSettingsMock).toHaveBeenCalledWith(expect.objectContaining({ controlMappings: valid }));
    });
  });

  describe('controlMappings validation rejects malformed input', () => {
    async function importControlMappings(controlMappings: unknown) {
      updateSettingsMock.mockClear();
      await settingsService.importSettings(JSON.stringify({ controlMappings }));
      // Find the controlMappings field in the call (or absence).
      const call = updateSettingsMock.mock.calls[0]?.[0] ?? {};
      return Object.prototype.hasOwnProperty.call(call, 'controlMappings');
    }

    it('rejects null', async () => {
      expect(await importControlMappings(null)).toBe(false);
    });
    it('rejects array', async () => {
      expect(await importControlMappings([])).toBe(false);
    });
    it('rejects primitive', async () => {
      expect(await importControlMappings('not an object')).toBe(false);
      expect(await importControlMappings(42)).toBe(false);
    });
    it('rejects when player1 is missing', async () => {
      expect(await importControlMappings({ player2: {} })).toBe(false);
    });
    it('rejects when player1 is not an object', async () => {
      expect(await importControlMappings({ player1: 'wat' })).toBe(false);
    });
    it('rejects constructor / prototype keys', async () => {
      expect(await importControlMappings({ player1: { constructor: { x: 1 } } })).toBe(false);
      expect(await importControlMappings({ player1: { prototype: { x: 1 } } })).toBe(false);
    });

    it('rejects __proto__ key smuggled via raw JSON', async () => {
      // The object literal `{ __proto__: ... }` sets the prototype; you
      // can only smuggle __proto__ as a regular own property by hand-
      // crafting the JSON string. importSettings parses it via JSON.parse
      // which DOES create a regular __proto__ property in this case.
      updateSettingsMock.mockClear();
      const malicious = '{"controlMappings":{"player1":{"__proto__":{"isAdmin":true}}}}';
      await settingsService.importSettings(malicious);
      const call = updateSettingsMock.mock.calls[0]?.[0] ?? {};
      expect(Object.prototype.hasOwnProperty.call(call, 'controlMappings')).toBe(false);
    });
    it('rejects when an entry value is not an object', async () => {
      expect(await importControlMappings({ player1: { 'a-button': 'a string' } })).toBe(false);
    });
    it('rejects when a player mapping has > 256 entries', async () => {
      const huge: Record<string, object> = {};
      for (let i = 0; i < 300; i++) huge[`btn-${i}`] = { type: 'keyboard', key: 'X' };
      expect(await importControlMappings({ player1: huge })).toBe(false);
    });
  });

  describe('catastrophic input', () => {
    it('throws on invalid JSON', async () => {
      await expect(settingsService.importSettings('{invalid json')).rejects.toThrow();
    });

    it('does not crash on completely empty object', async () => {
      await expect(settingsService.importSettings('{}')).resolves.toBeUndefined();
    });

    it('drops unknown fields silently', async () => {
      await settingsService.importSettings(JSON.stringify({ volume: 0.5, attackerField: 'evil' }));
      const call = updateSettingsMock.mock.calls[0][0];
      expect(call).toEqual({ volume: 0.5 });
      expect(call).not.toHaveProperty('attackerField');
    });
  });
});
