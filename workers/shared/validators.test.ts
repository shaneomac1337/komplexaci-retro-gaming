// Regression tests for the shared Worker security validators.
//
// These functions guard the only write path into the production R2 bucket;
// silent regressions here would re-open the issues fixed in iteration 1
// (unrestricted upload), iteration 3 (length-leaking compare), and iteration
// 8 (Content-Length bypass). Pin them.

import { describe, it, expect } from "vitest";
import { isValidKey, safeCompareSecrets, KEY_ALLOWLIST, SIMPLE_PUT_MAX_BYTES } from "./validators";
// The JS Worker (scripts/r2-fetch-worker.js) carries a duplicated copy of
// KEY_ALLOWLIST because it can't import a .ts module without a build step.
// This import lets the drift-detection test below catch any future change
// that loosens the allow-list in one file but not the other.
// @ts-expect-error -- plain .js Worker file with no .d.ts; the export is real
import { KEY_ALLOWLIST as JS_KEY_ALLOWLIST } from "../../scripts/r2-fetch-worker.js";

describe("isValidKey", () => {
  describe("accepts well-formed allow-listed keys", () => {
    const accepted = [
      "roms/ps1/crash-bash.chd",
      "roms/ps1/crash-bash.zip",
      "roms/n64/wwf-no-mercy.z64",
      "roms/snes/zelda.sfc",
      "bios/ps1/scph5501.bin",
      "bios/ps1/ps1-bios.zip",
      "covers/ps1/crash-bash.jpg",
      "covers/n64/wwf-no-mercy.jpg",
      "saves/games/save.json",
      "roms/ps1/multi.disc.bin",          // dots in filename body
      "roms/ps1/dir/subdir/game.chd",     // nested paths
    ];
    for (const key of accepted) {
      it(`accepts ${key}`, () => {
        expect(isValidKey(key)).toBe(true);
      });
    }
  });

  describe("rejects path traversal / encoding tricks", () => {
    const rejected = [
      "..",
      "../etc/passwd",
      "roms/../bios/scph5501.bin",
      "roms/ps1/../../etc/passwd",
      "%2e%2e/etc/passwd",
      "%2E%2E/etc/passwd",
      "roms\0/ps1/game.chd",
      "/roms/ps1/game.chd",               // leading slash
    ];
    for (const key of rejected) {
      it(`rejects ${JSON.stringify(key)}`, () => {
        expect(isValidKey(key)).toBe(false);
      });
    }
  });

  describe("rejects keys outside the allow-list", () => {
    const rejected = [
      "",
      "games.json",                        // top-level, no prefix
      "evil.html",                         // not under allowed prefix
      "roms/game.exe",                     // disallowed extension
      "roms/ps1/game.chd.exe",             // double extension trick
      "logs/secret.txt",                   // disallowed prefix
      "roms/ps1/game",                     // no extension
      "roms/ps1/game.CHD",                 // uppercase extension
      "ROMS/ps1/game.chd",                 // uppercase prefix
      "roms/ps1/" + "x".repeat(600) + ".chd",  // > 512 chars
    ];
    for (const key of rejected) {
      it(`rejects ${JSON.stringify(key.slice(0, 40))}${key.length > 40 ? "..." : ""}`, () => {
        expect(isValidKey(key)).toBe(false);
      });
    }
  });

  it("rejects empty / non-string", () => {
    expect(isValidKey("")).toBe(false);
    // @ts-expect-error -- defending against runtime misuse from JSON parse
    expect(isValidKey(undefined)).toBe(false);
    // @ts-expect-error -- defending against runtime misuse from JSON parse
    expect(isValidKey(null)).toBe(false);
  });

  it("KEY_ALLOWLIST is exported and is a RegExp", () => {
    expect(KEY_ALLOWLIST).toBeInstanceOf(RegExp);
  });

  it("SIMPLE_PUT_MAX_BYTES is exported and is a positive number", () => {
    expect(typeof SIMPLE_PUT_MAX_BYTES).toBe("number");
    expect(SIMPLE_PUT_MAX_BYTES).toBeGreaterThan(0);
  });
});

describe("KEY_ALLOWLIST drift detection (JS vs TS)", () => {
  // The JS Worker (scripts/r2-fetch-worker.js) maintains its own copy of
  // KEY_ALLOWLIST. The two MUST stay byte-identical — this test fails if
  // someone tightens one without mirroring to the other.
  it("JS Worker regex source is identical to TS canonical version", () => {
    expect(JS_KEY_ALLOWLIST.source).toBe(KEY_ALLOWLIST.source);
    expect(JS_KEY_ALLOWLIST.flags).toBe(KEY_ALLOWLIST.flags);
  });
});

describe("safeCompareSecrets", () => {
  it("returns true on byte-identical inputs", async () => {
    expect(await safeCompareSecrets("hunter2hunter2hunter2", "hunter2hunter2hunter2")).toBe(true);
  });

  it("returns false on different inputs of the same length", async () => {
    expect(await safeCompareSecrets("abcdef0123456789", "0123456789abcdef")).toBe(false);
  });

  it("returns false on different inputs of different lengths", async () => {
    expect(await safeCompareSecrets("short", "this-is-a-much-longer-secret")).toBe(false);
  });

  it("returns false when either side is empty", async () => {
    expect(await safeCompareSecrets("", "real-secret")).toBe(false);
    expect(await safeCompareSecrets("real-secret", "")).toBe(false);
    expect(await safeCompareSecrets("", "")).toBe(false);
  });

  it("handles non-ASCII / unicode without throwing", async () => {
    expect(await safeCompareSecrets("héllo-wörld", "héllo-wörld")).toBe(true);
    expect(await safeCompareSecrets("héllo-wörld", "hello-world")).toBe(false);
  });

  it("handles realistic 64-byte hex secret", async () => {
    const a = "0".repeat(63) + "1";
    const b = "0".repeat(63) + "2";
    expect(await safeCompareSecrets(a, a)).toBe(true);
    expect(await safeCompareSecrets(a, b)).toBe(false);
  });
});
