import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Match only real test files. The legacy src/App.test.tsx and
    // src/main.test.tsx are dummy debug components (not vitest suites)
    // — exclude them explicitly so `npm test` doesn't choke on them.
    include: ['workers/**/*.test.{ts,mts}'],
    // Workers tests use crypto.subtle / TextEncoder which are globals
    // in modern Node — no jsdom needed.
    environment: 'node',
  },
});
