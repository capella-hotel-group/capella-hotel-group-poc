import { readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { BLOCKS_DIR, DIST_DIR, ROOT } from './config.js';
import { rm, cp } from 'node:fs/promises';

/**
 * Scan src/blocks/ and generate one Rollup entry per block.
 * Each block folder is included if it has a matching `.ts` file.
 * If a matching `.css` file also exists, it is added as a separate CSS entry
 * so blocks do not need to manually import their own stylesheet.
 *
 * Returns a map of:
 *   { 'blocks/name/name': '...name.ts', 'blocks/name/name--style': '...name.css' }
 */
export function generateBlockEntries(): Record<string, string> {
  const entries: Record<string, string> = {};
  try {
    const blockFolders = readdirSync(BLOCKS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const name of blockFolders) {
      const tsFile = path.resolve(BLOCKS_DIR, name, `${name}.ts`);
      entries[`blocks/${name}/${name}`] = tsFile;

      const cssFile = path.resolve(BLOCKS_DIR, name, `${name}.css`);
      if (existsSync(cssFile)) {
        entries[`blocks/${name}/${name}--style`] = cssFile;
      }
    }
  } catch {
    // blocks dir may not exist during initial scaffolding
  }
  return entries;
}

/**
 * Vite plugin that prepends a `/* v{version} *\/` banner comment to every
 * built JS chunk and CSS asset.
 */
export function versionBannerPlugin(version: string): Plugin {
  const banner = `/*! v${version} | t${Date.now()}*/`;
  return {
    name: 'version-banner',
    enforce: 'post',
    renderChunk(code) {
      return { code: `${banner}\n${code}`, map: null };
    },
    generateBundle(_opts, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'asset' && typeof file.source === 'string' && file.fileName.endsWith('.css')) {
          file.source = `${banner}\n${file.source}`;
        }
      }
    },
  };
}

/**
 * In production build: cleans generated paths at root before building.
 * In watch mode: copies dist/ output back to root after each build
 * so that `aem up` always serves up-to-date files.
 */
export function cleanOutputPlugin(isWatch: boolean): Plugin {
  return {
    name: 'clean-output',
    apply: 'build',
    async buildStart() {
      if (isWatch) return; // emptyOutDir handles '-dist' cleanup
      const foldersToRemove = ['blocks', 'styles', 'chunks', 'assets'].map((d) => path.resolve(ROOT, d));
      const filesToRemove = ['scripts/main.js', 'scripts/aem.js'].map((f) => path.resolve(ROOT, f));
      await Promise.all([
        ...foldersToRemove.map((dir) => rm(dir, { recursive: true, force: true })),
        ...filesToRemove.map((file) => rm(file, { force: true })),
      ]);
    },
    async closeBundle() {
      if (!isWatch) return;
      await cp(DIST_DIR, ROOT, { recursive: true, force: true });
    },
  };
}
