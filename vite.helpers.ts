import { readdirSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { BLOCKS_DIR } from './config.js';

/**
 * Scan src/blocks/ and generate one Rollup entry per block.
 * Returns a map of { 'blocks/name/name': '/abs/path/src/blocks/name/name.ts' }
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
  const banner = `/*! v${version} */`;
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
