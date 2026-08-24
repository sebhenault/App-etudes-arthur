import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CONTENT_DIR = path.join(ROOT, 'content');
export const MANIFEST_PATH = path.join(CONTENT_DIR, 'manifest.json');
/** Dossiers de `content/` qui ne contiennent pas des packs d'exercices. */
export const NON_PACK_DIRS = new Set(['config']);

/** Liste récursivement tous les packs JSON (le manifeste est exclu). */
export function listPackFiles(dir = CONTENT_DIR) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (NON_PACK_DIRS.has(entry.name)) continue;
      out.push(...listPackFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.json') && full !== MANIFEST_PATH) {
      out.push(full);
    }
  }
  return out.sort();
}

export function readJson(file) {
  const text = fs.readFileSync(file, 'utf8');
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export const relative = (file) => path.relative(ROOT, file).split(path.sep).join('/');
