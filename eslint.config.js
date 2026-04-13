import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import xwalkPlugin from 'eslint-plugin-xwalk';
import * as jsoncParser from 'jsonc-eslint-parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig([
  // Global ignores (replaces .eslintignore)
  {
    ignores: ['dist/', 'blocks/', 'chunks/', 'assets/', 'styles/', 'scripts/scripts.js', 'scripts/aem.js', 'scripts/editor-support.js'],
  },

  // JavaScript files
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-param-reassign': ['error', { props: false }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },

  // TypeScript files
  {
    files: ['**/*.ts'],
    plugins: { js },
    extends: ['js/recommended', ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-param-reassign': ['error', { props: false }],
      'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-object-type': 'off', // Allow empty object types for flexible event maps and similar patterns
    },
  },

  // JSON files — AEM component model validation
  {
    files: ['**/*.json'],
    plugins: { xwalk: xwalkPlugin },
    languageOptions: { parser: jsoncParser },
    rules: {
      'xwalk/max-cells': "off", // Disable max cells rule for flexibility in component definitions
      'xwalk/no-duplicate-fields': 'error',
      'xwalk/invalid-field-name': 'error',
      'xwalk/no-orphan-collapsible-fields': 'error',
      'xwalk/no-custom-resource-types': 'error',
    },
  },

  // Disable all ESLint formatting rules — Prettier handles formatting
  prettier,
]);
