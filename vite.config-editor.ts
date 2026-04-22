import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, SRC_DIR } from './config';
import { versionBannerPlugin } from './vite.helpers';

const { name, version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  name: string;
  version: string;
};

/**
 * Separate build for editor-support.js.
 * The Universal Editor inject mechanism expects this file at scripts/editor-support.js
 * (in the project root, NOT inside dist/).
 */
export default defineConfig({
  root: ROOT,
  publicDir: false, // do not copy public/ assets into scripts/

  define: {
    __APP_NAME__: JSON.stringify(name),
    __APP_VERSION__: JSON.stringify(version),
  },

  plugins: [versionBannerPlugin(version)],

  resolve: {
    alias: {
      '@': SRC_DIR,
    },
  },

  build: {
    outDir: path.resolve(ROOT, 'scripts'),
    emptyOutDir: false,
    modulePreload: false,
    target: 'es2022',

    rollupOptions: {
      input: {
        'editor-support': path.resolve(SRC_DIR, 'app', 'editor', 'editor-support.ts'),
      },
      external: [path.resolve(SRC_DIR, 'app', 'scripts.ts'), path.resolve(SRC_DIR, 'app', 'aem.ts')],
      output: {
        paths: {
          [path.resolve(SRC_DIR, 'app', 'scripts.ts')]: '/scripts/scripts.js',
          [path.resolve(SRC_DIR, 'app', 'aem.ts')]: '/scripts/aem.js',
        },
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        format: 'es',
      },
      preserveEntrySignatures: 'exports-only',
    },
  },
});
