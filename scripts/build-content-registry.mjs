#!/usr/bin/env node
/**
 * Génère `src/content/registry.generated.ts` à partir des fichiers du dossier `content/`.
 *
 *   npm run content:build
 *
 * Metro (le bundler de React Native) ne peut pas parcourir un dossier à
 * l'exécution : il faut que chaque JSON soit importé statiquement quelque part.
 * Ce script écrit donc automatiquement ces imports. Ajouter une notion se résume
 * à : déposer un fichier JSON dans `content/`, puis lancer cette commande.
 */
import fs from 'node:fs';
import path from 'node:path';
import { validateManifest, validatePack } from '../src/content/validation.ts';
import { MANIFEST_PATH, ROOT, listPackFiles, readJson, relative } from './lib/read-content.mjs';

const OUTPUT = path.join(ROOT, 'src', 'content', 'registry.generated.ts');

const manifestRaw = readJson(MANIFEST_PATH);
if (!manifestRaw.ok) {
  console.error(`manifest.json : JSON invalide — ${manifestRaw.error}`);
  process.exit(1);
}
const manifestResult = validateManifest(manifestRaw.value);
if (!manifestResult.ok) {
  console.error('manifest.json invalide :');
  manifestResult.errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

const files = listPackFiles();
const entries = [];
let failed = 0;

for (const file of files) {
  const raw = readJson(file);
  if (!raw.ok) {
    console.error(`${relative(file)} : JSON invalide — ${raw.error}`);
    failed += 1;
    continue;
  }
  const result = validatePack(raw.value, relative(file));
  if (!result.ok) {
    console.error(`${relative(file)} : pack invalide`);
    result.errors.forEach((e) => console.error(`  - ${e}`));
    failed += 1;
    continue;
  }
  entries.push({
    id: raw.value.id,
    file,
    // Chemin d'import relatif depuis src/content/
    importPath: path
      .relative(path.dirname(OUTPUT), file)
      .split(path.sep)
      .join('/'),
    items: raw.value.items.length,
  });
}

if (failed > 0) {
  console.error(`\n${failed} pack(s) rejeté(s). Registre non regénéré.`);
  process.exit(1);
}

const varName = (id, index) => `pack${index}_${id.replace(/[^A-Za-z0-9]/g, '_')}`;

const lines = [
  '/**',
  ' * FICHIER GÉNÉRÉ AUTOMATIQUEMENT — NE PAS MODIFIER À LA MAIN.',
  ' *',
  ' * Source : dossier `content/`. Régénérer avec `npm run content:build`.',
  ` * Généré à partir de ${entries.length} pack(s).`,
  ' */',
  '',
  "import type { ContentManifest, ContentPack } from './types';",
  '',
  "import manifestJson from '../../content/manifest.json';",
];

entries.forEach((entry, index) => {
  lines.push(`import ${varName(entry.id, index)} from '${entry.importPath}';`);
});

lines.push(
  '',
  'export const bundledManifest = manifestJson as unknown as ContentManifest;',
  '',
  '/** Tous les packs livrés avec l\'application, dans l\'ordre alphabétique des fichiers. */',
  'export const bundledPacks: ContentPack[] = [',
  ...entries.map(
    (entry, index) =>
      `  ${varName(entry.id, index)} as unknown as ContentPack, // ${relative(entry.file)} (${entry.items} items)`,
  ),
  '];',
  '',
);

fs.writeFileSync(OUTPUT, lines.join('\n'), 'utf8');

const totalItems = entries.reduce((sum, e) => sum + e.items, 0);
console.log(
  `✓ ${relative(OUTPUT)} régénéré — ${entries.length} pack(s), ${totalItems} items.`,
);
