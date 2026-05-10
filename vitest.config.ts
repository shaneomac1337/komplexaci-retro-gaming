import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Match only real test files. The legacy src/App.test.tsx and
    // src/main.test.tsx are dummy debug components (not vitest suites)
    // — explicitly include the .test.ts pattern (excluding .tsx) so they
    // don't choke the run.
    include: ['workers/**/*.test.{ts,mts}', 'src/**/*.test.ts'],
    // Workers tests use crypto.subtle / TextEncoder which are globals
    // in modern Node — no jsdom needed.
    environment: 'node',
  },
});
