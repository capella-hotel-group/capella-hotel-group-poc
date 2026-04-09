import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, SRC_DIR, DIST_DIR } from './config';
import { generateBlockEntries, versionBannerPlugin } from './vite.helpers';

const { name, version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  name: string;
  version: string;
};

const blockEntries = generateBlockEntries();

export default defineConfig({
  root: ROOT,
  publicDir: 'public',

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
    outDir: DIST_DIR,
    emptyOutDir: true,
    modulePreload: false,
    cssCodeSplit: true,
    target: 'es2022',

    rollupOptions: {
      input: {
        // Main entry point — output as scripts/main.js; aem.ts detects codeBasePath via this filename
        'scripts/main': path.resolve(SRC_DIR, 'app', 'main.ts'),
        // aem.ts - compiled as a Rollup entry so it lands at dist/scripts/aem.js
        'scripts/aem': path.resolve(SRC_DIR, 'app', 'aem.ts'),
        // Styles entry (CSS only - no JS output)
        'styles/styles': path.resolve(SRC_DIR, 'styles', 'styles.css'),
        'styles/lazy-styles': path.resolve(SRC_DIR, 'styles', 'lazy-styles.css'),
        'styles/fonts': path.resolve(SRC_DIR, 'styles', 'fonts.css'),
        // All blocks
        ...blockEntries,
      },
      output: {
        // Keep entry file names exactly as declared above
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? '';
          if (name.endsWith('.css')) {
            const originalFile = (assetInfo.originalFileNames ?? [])[0] ?? '';
            // Block CSS: originals point to the block's .ts entry file
            const blockMatch = originalFile.match(/src\/blocks\/([^/]+)\//);
            if (blockMatch) {
              const blockName = blockMatch[1];
              return `blocks/${blockName}/${blockName}.css`;
            }
            // Styles entries: name already includes the 'styles/' prefix
            if (name.startsWith('styles/')) {
              return name;
            }
            return 'styles/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
      preserveEntrySignatures: 'exports-only',
    },
  },
});
