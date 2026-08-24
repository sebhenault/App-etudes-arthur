import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  expectedAnswerText,
  gradeExercise,
  normalizeText,
  packToExercises,
} from '../src/content/exercises.ts';

const pack = {
  schemaVersion: 1,
  id: 'test-pack',
  title: 'Pack de test',
  subject: 'francais',
  topic: 'accords',
  grade: 4,
  difficulty: 2,
  items: [
    { id: 'q1', type: 'qcm', skill: 'accord', question: 'Combien ?', choices: ['Un', 'Deux'], answer: 1 },
    { id: 'q2', type: 'texteATrous', skill: 'accord', prompt: 'Les ___ sont là.', answers: ['élèves'] },
    {
      id: 'q3',
      type: 'lecture',
      passage: { title: 'Texte', text: 'Il était une fois.' },
      questions: [
        { id: 'a', question: 'Q1 ?', choices: ['X', 'Y'], answer: 0, skill: 'reperage' },
        { id: 'b', question: 'Q2 ?', choices: ['X', 'Y'], answer: 1 },
      ],
    },
  ],
};

test('un item de lecture produit un exercice par question', () => {
  const exercises = packToExercises(pack);
  assert.equal(exercises.length, 4);
  assert.deepEqual(
    exercises.map((exercise) => exercise.key),
    ['test-pack::q1', 'test-pack::q2', 'test-pack::q3::a', 'test-pack::q3::b'],
  );
});

test('la notion de la question de lecture prime sur celle de l’item', () => {
  const exercises = packToExercises(pack);
  assert.equal(exercises[2].skill, 'reperage');
  // Sans « skill » déclarée, on retombe sur une étiquette dérivée du sujet.
  assert.equal(exercises[3].skill, 'accords-general');
});

test('normalizeText ignore la casse, les accents et la ponctuation', () => {
  assert.equal(normalizeText('  Élèves. '), 'eleves');
  assert.equal(normalizeText('É L È V E S'), 'e l e v e s');
});

test('un texte à trous accepte une réponse sans accents', () => {
  const exercise = packToExercises(pack)[1];
  const result = gradeExercise(exercise, { kind: 'text', value: 'eleves' });
  assert.equal(result.correct, true);
  assert.equal(result.score, 1);
});

test('une réponse vide est comptée fausse', () => {
  const exercise = packToExercises(pack)[1];
  const result = gradeExercise(exercise, { kind: 'text', value: '   ' });
  assert.equal(result.correct, false);
  assert.equal(result.given, '(vide)');
});

test('un choix multiple mémorise la réponse donnée en texte', () => {
  const exercise = packToExercises(pack)[0];
  const wrong = gradeExercise(exercise, { kind: 'choice', index: 0 });
  assert.equal(wrong.correct, false);
  assert.equal(wrong.given, 'Un');
  assert.equal(wrong.expected, 'Deux');
});

test('les jeux à plusieurs éléments donnent un score partiel', () => {
  const sortPack = {
    ...pack,
    id: 'tri',
    items: [
      {
        id: 's1',
        type: 'classement',
        skill: 'genre',
        instruction: 'Classe',
        buckets: ['A', 'B'],
        tokens: [
          { text: 'un', bucket: 'A' },
          { text: 'deux', bucket: 'A' },
          { text: 'trois', bucket: 'B' },
          { text: 'quatre', bucket: 'B' },
        ],
      },
    ],
  };
  const exercise = packToExercises(sortPack)[0];
  const partial = gradeExercise(exercise, {
    kind: 'buckets',
    value: { un: 'A', deux: 'A', trois: 'A', quatre: 'B' },
  });
  assert.equal(partial.correct, false);
  assert.equal(partial.score, 0.75);

  const perfect = gradeExercise(exercise, {
    kind: 'buckets',
    value: { un: 'A', deux: 'A', trois: 'B', quatre: 'B' },
  });
  assert.equal(perfect.correct, true);
  assert.equal(perfect.score, 1);
});

test('la mise en ordre compare position par position', () => {
  const orderPack = {
    ...pack,
    id: 'ordre',
    items: [
      { id: 'o1', type: 'ordre', skill: 'ordre', instruction: 'Range', sequence: ['a', 'b', 'c', 'd'] },
    ],
  };
  const exercise = packToExercises(orderPack)[0];
  const result = gradeExercise(exercise, { kind: 'order', value: ['a', 'b', 'd', 'c'] });
  assert.equal(result.score, 0.5);
  assert.equal(result.correct, false);
});

test('un exercice passé est faux et laisse une trace explicite', () => {
  const exercise = packToExercises(pack)[0];
  const result = gradeExercise(exercise, { kind: 'skipped' });
  assert.equal(result.correct, false);
  assert.equal(result.given, '(passé)');
  assert.equal(result.expected, expectedAnswerText(exercise));
});
