import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import noUnsanitized from 'eslint-plugin-no-unsanitized'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      // Mozilla's no-unsanitized: catches innerHTML / outerHTML / document.write
      // / insertAdjacentHTML / DOMParser sinks fed with non-literal data —
      // i.e. exactly the patterns that cause DOM XSS. Currently no such
      // sinks exist in src/ (verified in iteration 2 of the security review),
      // so this rule is preventive: it'll fail lint the moment someone
      // introduces one.
      'no-unsanitized': noUnsanitized,
    },
    rules: {
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
