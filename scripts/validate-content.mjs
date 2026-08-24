#!/usr/bin/env node
/**
 * Valide tous les packs pédagogiques du dossier `content/`.
 *
 *   npm run content:check
 *
 * Le script réutilise exactement le même validateur que l'application
 * (`src/content/validation.ts`), de sorte qu'un pack accepté ici sera aussi
 * accepté à l'import depuis le tableau de bord parent.
 */
import { validateManifest, validatePack, crossCheck } from '../src/content/validation.ts';
import { CONTENT_DIR, MANIFEST_PATH, listPackFiles, readJson, relative } from './lib/read-content.mjs';

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

let errorCount = 0;
let warningCount = 0;

const report = (errors, warnings) => {
  errors.forEach((e) => {
    errorCount += 1;
    console.log(`  ${red('✗')} ${e}`);
  });
  warnings.forEach((w) => {
    warningCount += 1;
    console.log(`  ${yellow('!')} ${w}`);
  });
};

console.log(dim(`Dossier de contenu : ${relative(CONTENT_DIR)}`));

const manifestRaw = readJson(MANIFEST_PATH);
if (!manifestRaw.ok) {
  console.log(`${red('✗')} manifest.json : JSON invalide — ${manifestRaw.error}`);
  process.exit(1);
}
const manifestResult = validateManifest(manifestRaw.value);
console.log(`\n${manifestResult.ok ? green('✓') : red('✗')} manifest.json`);
report(manifestResult.errors, manifestResult.warnings);

const packs = [];
for (const file of listPackFiles()) {
  const raw = readJson(file);
  if (!raw.ok) {
    errorCount += 1;
    console.log(`\n${red('✗')} ${relative(file)} : JSON invalide — ${raw.error}`);
    continue;
  }
  const result = validatePack(raw.value, relative(file));
  const itemCount = Array.isArray(raw.value?.items) ? raw.value.items.length : 0;
  console.log(
    `\n${result.ok ? green('✓') : red('✗')} ${relative(file)} ${dim(`(${itemCount} items)`)}`,
  );
  report(result.errors, result.warnings);
  if (result.pack) packs.push(result.pack);
}

if (manifestResult.manifest) {
  const crossWarnings = crossCheck(manifestResult.manifest, packs);
  if (crossWarnings.length > 0) {
    console.log(`\n${dim('Cohérence packs ↔ manifeste')}`);
    report([], crossWarnings);
  }
}

const totalItems = packs.reduce((sum, p) => sum + p.items.length, 0);
console.log(
  `\n${packs.length} pack(s) valides · ${totalItems} items · ` +
    `${errorCount} erreur(s) · ${warningCount} avertissement(s)`,
);

process.exit(errorCount > 0 ? 1 : 0);
