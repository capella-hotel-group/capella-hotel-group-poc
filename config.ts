import path from 'node:path';

export const ROOT = process.cwd();
export const DIST_DIR = path.resolve(ROOT, 'dist');
export const SRC_DIR = path.resolve(ROOT, 'src');
export const BLOCKS_DIR = path.resolve(SRC_DIR, 'blocks');
export const SCRIPTS_DIR = path.resolve(SRC_DIR, 'scripts');
export const PUBLIC_DIR = path.resolve(ROOT, 'public');
