#!/usr/bin/env node
/**
 * Upload games.json to CDN using wrangler
 *
 * Usage: npm run upload:games
 *
 * Make sure you have wrangler installed and authenticated:
 *   npx wrangler login
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Read games.json
const gamesJsonPath = resolve(rootDir, 'public', 'games.json');
const gamesJson = readFileSync(gamesJsonPath, 'utf-8');
const gamesData = JSON.parse(gamesJson);

console.log(`📦 Uploading games.json to CDN...`);
console.log(`   Total games: ${gamesData.games?.length || 0}`);

try {
  // Upload to R2 bucket (remote)
  execSync(
    `npx wrangler r2 object put komplexaci-media/games.json --file="${gamesJsonPath}" --content-type="application/json" --remote`,
    {
      cwd: rootDir,
      stdio: 'inherit'
    }
  );

  console.log(`✅ Successfully uploaded games.json to CDN!`);
} catch (error) {
  console.error(`❌ Failed to upload:`, error.message);
  process.exit(1);
}
