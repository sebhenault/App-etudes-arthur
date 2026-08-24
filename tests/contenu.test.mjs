import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { packToExercises } from '../src/content/exercises.ts';
import { buildLibrary } from '../src/content/library.ts';
import { bundledManifest, bundledPacks } from '../src/content/registry.generated.ts';
import {
  crossCheck,
  parseAndValidatePack,
  validateManifest,
  validatePack,
} from '../src/content/validation.ts';

const validPack = () => ({
  schemaVersion: 1,
  id: 'test-01',
  title: 'Pack de test',
  subject: 'francais',
  topic: 'accords',
  grade: 4,
  items: [
    { id: 'a', type: 'qcm', skill: 's', question: 'Q ?', choices: ['1', '2'], answer: 0 },
    { id: 'b', type: 'vraiFaux', skill: 's', statement: 'Vrai ?', answer: true },
    { id: 'c', type: 'calcul', skill: 's', question: '2 + 2 ?', answer: 4 },
    { id: 'd', type: 'texteATrous', skill: 's', prompt: 'Le ___ dort.', answers: ['chat'] },
    {
      id: 'e',
      type: 'association',
      skill: 's',
      instruction: 'Associe',
      pairs: [
        { left: 'a', right: '1' },
        { left: 'b', right: '2' },
      ],
    },
    { id: 'f', type: 'ordre', skill: 's', instruction: 'Range', sequence: ['x', 'y'] },
  ],
});

test('le manifeste livré est valide', () => {
  const result = validateManifest(bundledManifest);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test('tous les packs livrés sont valides', () => {
  for (const pack of bundledPacks) {
    const result = validatePack(pack, pack.id);
    assert.deepEqual(result.errors, [], `Pack invalide : ${pack.id}`);
  }
});

test('les identifiants de packs livrés sont uniques', () => {
  const ids = bundledPacks.map((pack) => pack.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('tous les exercices livrés ont une clé unique', () => {
  const keys = bundledPacks.flatMap((pack) => packToExercises(pack)).map((item) => item.key);
  assert.equal(new Set(keys).size, keys.length);
});

test('chaque pack livré est rattaché à une matière du manifeste', () => {
  const warnings = crossCheck(bundledManifest, bundledPacks).filter((warning) =>
    warning.includes('absente du manifeste') || warning.includes('absent de la matière'),
  );
  assert.deepEqual(warnings, []);
});

test('un pack sans items est refusé', () => {
  const result = validatePack({ ...validPack(), items: [] }, 'vide');
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('items')));
});

test('un index de bonne réponse hors des choix est refusé', () => {
  const pack = validPack();
  pack.items[0].answer = 7;
  const result = validatePack(pack, 'qcm');
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('index valide')));
});

test('deux items partageant un identifiant sont refusés', () => {
  const pack = validPack();
  pack.items[1].id = 'a';
  const result = validatePack(pack, 'doublon');
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('double')));
});

test('une association ambiguë (deux fois la même réponse) est refusée', () => {
  const pack = validPack();
  pack.items[4].pairs = [
    { left: 'a', right: 'même' },
    { left: 'b', right: 'même' },
  ];
  const result = validatePack(pack, 'association');
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('deux fois à droite')));
});

test('un token visant une colonne inexistante est refusé', () => {
  const pack = validPack();
  pack.items.push({
    id: 'g',
    type: 'classement',
    skill: 's',
    instruction: 'Classe',
    buckets: ['A', 'B'],
    tokens: [
      { text: 'un', bucket: 'A' },
      { text: 'deux', bucket: 'C' },
    ],
  });
  const result = validatePack(pack, 'classement');
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('colonne inconnue')));
});

test('un format plus récent que l’application est refusé clairement', () => {
  const result = validatePack({ ...validPack(), schemaVersion: 99 }, 'futur');
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('plus récent')));
});

test('un JSON malformé donne un message compréhensible', () => {
  const result = parseAndValidatePack('{ pas du json', 'collé');
  assert.equal(result.ok, false);
  assert.ok(result.errors[0].includes('JSON invalide'));
});

test('un pack valide passe l’import', () => {
  const result = parseAndValidatePack(JSON.stringify(validPack()), 'collé');
  assert.equal(result.ok, true);
  assert.equal(result.pack.items.length, 6);
});

test('la bibliothèque construit l’arbre matières → sujets', () => {
  const library = buildLibrary([]);
  assert.ok(library.subjects.length >= 5);
  const francais = library.subjectByKey.get('francais');
  assert.ok(francais);
  assert.ok(francais.topics.some((topic) => topic.key === 'accords'));
  assert.ok(francais.exerciseCount > 0);
});

test('un pack importé sur un sujet inédit crée la matière manquante', () => {
  const library = buildLibrary([
    {
      ...validPack(),
      id: 'import-01',
      subject: 'musique',
      topic: 'rythme',
      origin: 'imported',
    },
  ]);
  const musique = library.subjectByKey.get('musique');
  assert.ok(musique, 'la matière inconnue doit être créée automatiquement');
  assert.equal(musique.topics[0].key, 'rythme');
  assert.equal(musique.label, 'Musique');
});

test('un pack importé remplace le pack livré de même identifiant', () => {
  const original = bundledPacks[0];
  const library = buildLibrary([
    { ...validPack(), id: original.id, title: 'Version corrigée', origin: 'imported' },
  ]);
  const pack = library.packById.get(original.id);
  assert.equal(pack.title, 'Version corrigée');
  assert.equal(pack.origin, 'imported');
  assert.equal(library.packs.length, bundledPacks.length);
});

test('le registre généré correspond aux fichiers du dossier content', () => {
  const registry = readFileSync('src/content/registry.generated.ts', 'utf8');
  for (const pack of bundledPacks) {
    assert.ok(
      registry.includes(pack.id.replace(/[^A-Za-z0-9]/g, '_')),
      `Le registre ne référence pas ${pack.id} — lance « npm run content:build ».`,
    );
  }
});
