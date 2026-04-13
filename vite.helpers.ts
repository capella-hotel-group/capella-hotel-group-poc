import { createHash } from 'node:crypto';
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
      if (!existsSync(tsFile)) continue; // skip empty or incomplete block folders
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

function shortHash(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 8);
}

/**
 * Vite plugin that prepends a `/* v{version} *\/` banner comment to every
 * built JS chunk and CSS asset.
 */
export function versionBannerPlugin(version: string): Plugin {
  return {
    name: 'version-banner',
    enforce: 'post',
    renderChunk(code) {
      const banner = `/*! v${version} | h${shortHash(code)}*/`;
      return { code: `${banner}\n${code}`, map: null };
    },
    generateBundle(_opts, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'asset' && typeof file.source === 'string' && file.fileName.endsWith('.css')) {
          const banner = `/*! v${version} | h${shortHash(file.source)}*/`;
          file.source = `${banner}\n${file.source}`;
        }
      }
    },
  };
}

/**
 * In watch mode, removes entries from a root subdirectory that no longer
 * exist in the corresponding dist subdirectory (e.g. deleted/renamed blocks).
 * Skips silently if either directory does not exist yet.
 */
async function removeStaleEntries(subdir: string): Promise<void> {
  const distPath = path.resolve(DIST_DIR, subdir);
  const rootPath = path.resolve(ROOT, subdir);
  if (!existsSync(distPath) || !existsSync(rootPath)) return;
  const distEntries = new Set(readdirSync(distPath));
  // If dist dir is empty (e.g. partial/failed build), skip to avoid wiping root.
  if (distEntries.size === 0) return;
  const stale = readdirSync(rootPath).filter((e) => !distEntries.has(e));
  await Promise.all(stale.map((e) => rm(path.resolve(rootPath, e), { recursive: true, force: true })));
}

/**
 * In production build: cleans generated paths at root before building.
 * In watch mode: copies dist/ output back to root after each build
 * so that `aem up` always serves up-to-date files. Also removes stale
 * entries from output dirs (e.g. deleted or renamed blocks/chunks) without
 * doing a full clean that would cause downtime.
 */
export function cleanOutputPlugin(isWatch: boolean): Plugin {
  return {
    name: 'clean-output',
    apply: 'build',
    async buildStart() {
      if (isWatch) return; // emptyOutDir handles dist/ cleanup
      const foldersToRemove = ['blocks', 'styles', 'chunks', 'assets'].map((d) => path.resolve(ROOT, d));
      const filesToRemove = ['scripts/scripts.js', 'scripts/aem.js'].map((f) => path.resolve(ROOT, f));
      await Promise.all([
        ...foldersToRemove.map((dir) => rm(dir, { recursive: true, force: true })),
        ...filesToRemove.map((file) => rm(file, { force: true })),
      ]);
    },
    async closeBundle() {
      if (!isWatch) return;
      // Remove stale entries first (deleted/renamed blocks or chunks)
      // before copying so root never has leftover files from prior builds.
      await Promise.all(['blocks', 'chunks'].map(removeStaleEntries));
      await cp(DIST_DIR, ROOT, { recursive: true, force: true });
    },
  };
}
